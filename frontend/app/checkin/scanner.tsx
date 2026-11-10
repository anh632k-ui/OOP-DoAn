'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { formatVietnamDate } from '../../lib/vietnam-time';

type QRDetector = {
  detect(video: HTMLVideoElement): Promise<{ rawValue: string }[]>;
};
type DetectorCtor = new (options: { formats: string[] }) => QRDetector;
type ScanResult = { accepted: boolean; message: string; ticketId?: string };
type Stats = { tickets: number; used: number; rejected: number; capacity: number };
type AssignedSession = { id: string; title: string; venue: string; startsAt: string; status: string };

export default function CheckinScanner() {
  const [sessionId, setSessionId] = useState('');
  const [assignedSessions, setAssignedSessions] = useState<AssignedSession[]>([]);
  const [listError, setListError] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  function stopCamera() {
    activeRef.current = false;
    setScanning(false);
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/checkin/sessions', {cache:'no-store'})
      .then(async response => {
        const payload = (await response.json()) as {items?: AssignedSession[]; message?: string};
        if (!response.ok || !payload.items) throw new Error(payload.message ?? 'Không thể tải suất được giao');
        return payload.items;
      })
      .then(items => { if (active) {
        setAssignedSessions(items);
        setSessionId(previous => items.some(s => s.id === previous)
          ? previous : (items[0]?.id ?? ''));
      }})
      .catch(e => { if (active) setListError(e instanceof Error ? e.message : 'Lỗi tải suất'); });
    return () => { active = false; };
  }, []);

  async function startCamera() {
    setCameraError('');
    const ctor = (window as Window & { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
    if (!ctor) {
      setCameraError('Trình duyệt chưa hỗ trợ nhận dạng QR. Hãy nhập mã vé bằng tay.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false, video: { facingMode: { ideal: 'environment' } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { stopCamera(); return; }
      video.srcObject = stream;
      await video.play();
      const detector = new ctor({ formats: ['qr_code'] });
      activeRef.current = true;
      setScanning(true);
      const detectFrame = async () => {
        if (!activeRef.current) return;
        try {
          const codes = await detector.detect(video);
          if (codes.length > 0) {
            setCode(codes[0].rawValue.trim());
            stopCamera();
            return;
          }
        } catch {
          // Inconsistent frames can be skipped; the manual input remains available.
        }
        if (activeRef.current) frameRef.current = requestAnimationFrame(detectFrame);
      };
      frameRef.current = requestAnimationFrame(detectFrame);
    } catch {
      stopCamera();
      setCameraError('Không mở được camera. Kiểm tra quyền truy cập hoặc nhập mã thủ công.');
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setResult(null);
    try {
      const response = await fetch('/api/checkin/scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.trim(), code: code.trim() }),
      });
      const data = (await response.json()) as ScanResult & { message?: string };
      if (!response.ok) setResult({ accepted: false, message: data.message ?? 'Có lỗi kiểm tra vé' });
      else setResult(data);
      void loadStats();
    } catch {
      setResult({ accepted: false, message: 'Không kết nối được máy chủ' });
    } finally {
      setBusy(false);
    }
  }

  async function loadStats() {
    if (!/^[0-9a-fA-F-]{36}$/.test(sessionId)) return;
    try {
      const r = await fetch(`/api/checkin/sessions/${sessionId}/stats`);
      if (r.ok) setStats((await r.json()) as Stats);
    } catch { setStats(null); }
  }

  return <section className="scan-workspace-grid">
    <div className="panel scan-control-panel">
      <form className="auth-form scan-form" onSubmit={submit}>
        <label>Suất được phân công
          <select value={sessionId} onChange={e => {
            setSessionId(e.target.value); setStats(null); setResult(null);
          }} required>
            <option value="">-- Chọn suất --</option>
            {assignedSessions.map(s => <option key={s.id} value={s.id}>
              {s.title} · {s.venue} · {formatVietnamDate(s.startsAt,'short')}
            </option>)}
          </select>
        </label>
        {listError && <p role="alert" className="form-error">{listError}</p>}
        {!assignedSessions.length && !listError &&
          <p className="note">Chưa có suất được phân công. Liên hệ ban tổ chức.</p>}
        <div className={scanning ? 'camera-stage camera-live' : 'camera-stage camera-idle'}>
          <video ref={videoRef} muted playsInline className="scan-video"
            aria-label="Hình ảnh camera dùng để nhận diện QR"/>
          {!scanning && <p className="camera-help">ĐƯA MÃ QR VÀO KHUNG
            <span>Camera đang tắt · Hỗ trợ HTTPS hoặc localhost</span>
          </p>}
        </div>
        {cameraError && <p role="alert" className="form-error">{cameraError}</p>}
        <div className="scan-form-actions">
          <button type="button" onClick={scanning ? stopCamera : startCamera}
            disabled={busy}>{scanning ? 'Dừng camera' : 'Mở camera'}</button>
          <label>Mã vé (quét QR hoặc nhập thủ công)
            <input value={code} onChange={e => setCode(e.target.value)}
              placeholder="Nhập mã vé điện tử" autoComplete="off" required />
          </label>
          <button type="submit" disabled={busy || !sessionId || !code.trim()}>
            {busy ? 'Đang kiểm tra...' : 'Xác nhận check-in'}
          </button>
        </div>
        <p className="note">Khi camera không khả dụng, nhân viên vẫn có thể nhập mã vé thủ công.</p>
      </form>
    </div>
    <aside className="scan-side-panel" aria-label="Thống kê và kết quả check-in">
      <div className="scan-stats-side">
        <div><span>Vé đã cấp</span>
          <strong>{stats ? stats.tickets.toLocaleString('vi-VN') : '—'}</strong>
          <small>{stats ? 'Sức chứa ' + stats.capacity.toLocaleString('vi-VN') : 'Chưa tải thống kê'}</small></div>
        <div><span>Check-in thành công</span>
          <strong>{stats ? stats.used.toLocaleString('vi-VN') : '—'}</strong>
          <small>Cập nhật theo suất đã chọn</small></div>
        <div><span>Lượt từ chối</span>
          <strong>{stats ? stats.rejected.toLocaleString('vi-VN') : '—'}</strong>
          <small>Cập nhật theo suất đã chọn</small></div>
      </div>
      <button className="button-secondary scan-refresh" type="button"
        disabled={!sessionId} onClick={() => void loadStats()}>
        Cập nhật thống kê
      </button>
      <div className="scan-result-card" aria-live="polite">
        <h2>Kết quả quét</h2>
        {result ? <p role="status"
          className={result.accepted ? 'scan-result-success' : 'scan-result-error'}>
          {result.accepted ? '✓ Vé hợp lệ / vào cổng' : 'Từ chối check-in'}
        </p> : <p className="scan-result-neutral">Chưa có lượt kiểm tra trong phiên này.</p>}
        <p className="note">{result
          ? result.message
          : 'Hệ thống kiểm tra hiệu lực, khung giờ và chống sử dụng trùng vé.'}</p>
      </div>
    </aside>
  </section>;
}
