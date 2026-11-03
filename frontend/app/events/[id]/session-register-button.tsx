'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SessionRegisterButton({
  sessionId, method, available,
}: { sessionId: string; method: string | null; available: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function register() {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/registrations/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const body = (await response.json()) as {
        status?: string; message?: string | string[];
      };
      if (response.status === 401) {
        setError('Vui lòng đăng nhập trước khi đăng ký suất.');
        return;
      }
      if (!response.ok) {
        setError(Array.isArray(body.message)
          ? body.message.join(', ') : body.message ?? 'Đăng ký không thành công');
        return;
      }
      const states: Record<string, string> = {
        DA_XAC_NHAN: 'Đăng ký thành công! Vé đã được cấp.',
        DANH_SACH_CHO: 'Đã thêm vào danh sách chờ.',
        CHO_PHAN_BO: 'Đã ghi nhận đăng ký bốc thăm. Vui lòng theo dõi kết quả.',
      };
      setResult(states[body.status ?? ''] ?? 'Đã ghi nhận đăng ký.');
    } catch {
      setError('Không kết nối được máy chủ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="action-panel">
      {available && !result && (
        <button type="button" onClick={register} disabled={busy}>
          {busy ? 'Đang gửi...' : method === 'LOTTERY'
            ? 'Đăng ký tham gia bốc thăm' : 'Đăng ký suất miễn phí'}
        </button>
      )}
      {!available && <p className="note">Suất hiện chưa mở đăng ký.</p>}
      {error && <p role="alert" className="form-error">{error}</p>}
      {result && <p role="status" className="success-note">{result}</p>}
      {(error || result) && (
        <p><Link href="/registrations">Xem các đăng ký của tôi</Link></p>
      )}
    </div>
  );
}
