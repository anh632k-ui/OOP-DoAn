'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  ManagedEvent, ManagedVenue, AccessibilityFeature,
} from './page';

type Session = {
  id: string; startsAt: string; endsAt: string; capacity: number;
  status: string; method: string | null; registrationClosesAt: string;
};

type Props = {
  events: ManagedEvent[];
  venues: ManagedVenue[];
  features: AccessibilityFeature[];
};

export default function OrganizerDashboard({ events, venues, features }: Props) {
  const router = useRouter();
  const [eventId, setEventId] = useState(events[0]?.id ?? '');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId) { setSessions([]); return; }
    let cancelled = false;
    fetch(`/api/manage/events/${eventId}/sessions`, { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error('Không tải được các suất của sự kiện');
        return (await r.json()) as { items: Session[] };
      })
      .then(data => { if (!cancelled) setSessions(data.items); })
      .catch(() => { if (!cancelled) setSessions([]); });
    return () => { cancelled = true; };
  }, [eventId, reload]);

  async function request(path: string, method: 'POST' | 'PUT' | 'PATCH', body?: unknown) {
    const response = await fetch(`/api/manage/${path}`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    const result = (await response.json()) as {
      message?: string | string[]; id?: string;
    };
    if (!response.ok) {
      throw new Error(Array.isArray(result.message)
        ? result.message.join('; ') : result.message ?? 'Thao tác thất bại');
    }
    return result;
  }

  async function perform(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await fn();
      setMessage('Thao tác thành công. Dữ liệu đã được lưu vào PostgreSQL.');
      setReload(v => v + 1);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setBusy(false);
    }
  }

  function createEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    void perform(async () => {
      const result = await request('events', 'POST', {
        title: data.get('title'), description: data.get('description'),
      });
      if (result.id) setEventId(result.id);
      form.reset();
    });
  }

  function updateEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!eventId) return;
    const data = new FormData(e.currentTarget);
    void perform(async () => {
      await request(`events/${eventId}`, 'PATCH', {
        title: data.get('title'), description: data.get('description'),
      });
    });
  }

  function cancelEvent() {
    if (!eventId || !window.confirm('Bạn muốn hủy sự kiện này?')) return;
    void perform(async () => {
      await request(`events/${eventId}/cancel`, 'POST');
    });
  }

  function createVenue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget, data = new FormData(form);
    void perform(async () => {
      await request('venues', 'POST', {
        name: data.get('name'), address: data.get('address'),
        description: data.get('description'),
      });
      form.reset();
    });
  }

  function createSession(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!eventId) return;
    const form = e.currentTarget, data = new FormData(form);
    const toIso = (key: string) => new Date(String(data.get(key))).toISOString();
    void perform(async () => {
      await request(`events/${eventId}/sessions`, 'POST', {
        venueId: data.get('venueId'), capacity: Number(data.get('capacity')),
        startsAt: toIso('startsAt'), endsAt: toIso('endsAt'),
        registrationOpensAt: toIso('registrationOpensAt'),
        registrationClosesAt: toIso('registrationClosesAt'),
      });
      form.reset();
    });
  }

  function setPolicy(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const sessionId = String(data.get('sessionId'));
    void perform(async () => {
      await request(`sessions/${sessionId}/policy`, 'PUT', {
        method: data.get('method'),
      });
    });
  }

  function runDraw(sessionId: string) {
    if (!window.confirm('Bốc thăm một lần cho suất này? Không thể bốc thăm lại.')) return;
    void perform(async () => {
      const result = await request(`sessions/${sessionId}/draw`, 'POST');
      window.alert('Đã bốc thăm. Lưu thông tin kiểm chứng từ API báo cáo bốc thăm. Mã đợt: ' + (result.roundId ?? ''));
    });
  }

  function setAccessibility(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!eventId) return;
    const data = new FormData(e.currentTarget);
    void perform(async () => {
      await request(`events/${eventId}/accessibility`, 'PUT', {
        verified: data.get('verified') === 'on',
        featureIds: data.getAll('featureId'),
        note: data.get('note'),
      });
    });
  }

  function publish() {
    if (!eventId) return;
    void perform(async () => {
      await request(`events/${eventId}/publish`, 'POST');
    });
  }

  const chosen = events.find(e => e.id === eventId);
  return (
    <div className="management-area">
      {message && <p role="status" className="success-note">{message}</p>}
      {error && <p role="alert" className="form-error">{error}</p>}

      <section className="panel">
        <h2>Tạo sự kiện (bản nháp)</h2>
        <form className="auth-form" onSubmit={createEvent}>
          <label>Tên sự kiện <input name="title" maxLength={200} required /></label>
          <label>Mô tả <textarea name="description" maxLength={4000} rows={3}/></label>
          <button type="submit" disabled={busy}>Tạo sự kiện</button>
        </form>
      </section>

      <section className="panel">
        <h2>Danh sách sự kiện của bạn</h2>
        {events.length === 0 ? <p>Chưa có sự kiện.</p> : (
          <ul className="event-list">{events.map(event => (
            <li key={event.id} className="event-item">
              <strong>{event.title}</strong> — {event.status}
            </li>
          ))}</ul>
        )}
        <label className="management-label">Chọn sự kiện để quản lý
          <select value={eventId} onChange={e => setEventId(e.target.value)}>
            <option value="">-- Chọn --</option>
            {events.map(event => <option key={event.id} value={event.id}>
              {event.title} — {event.status}
            </option>)}
          </select>
        </label>
        {chosen && <p className="note">Đang chọn: {chosen.title} ({chosen.status})</p>}
      </section>

      {chosen && chosen.status === 'NHAP' && (
        <section className="panel">
          <h2>Chỉnh sửa sự kiện nháp</h2>
          <form className="auth-form" key={chosen.id} onSubmit={updateEvent}>
            <label>Tên sự kiện
              <input name="title" defaultValue={chosen.title} maxLength={200} required/>
            </label>
            <label>Mô tả
              <textarea name="description" defaultValue={chosen.description} maxLength={4000}/>
            </label>
            <button type="submit" disabled={busy}>Lưu thay đổi</button>
          </form>
        </section>
      )}
      {chosen && chosen.status !== 'DA_HUY' && (
        <section className="panel">
          <h2>Hủy sự kiện</h2>
          <p className="note">Chỉ được hủy khi sự kiện chưa có đăng ký.</p>
          <button type="button" disabled={busy} onClick={cancelEvent}>
            Hủy sự kiện
          </button>
        </section>
      )}

      <section className="panel">
        <h2>Địa điểm</h2>
        <form className="auth-form" onSubmit={createVenue}>
          <label>Tên địa điểm <input name="name" maxLength={200} required /></label>
          <label>Địa chỉ <input name="address" maxLength={1000} required /></label>
          <label>Mô tả <input name="description" maxLength={4000} /></label>
          <button type="submit" disabled={busy}>Thêm địa điểm</button>
        </form>
      </section>

      {chosen && (
        <section className="panel">
          <h2>Các suất của sự kiện</h2>
          {sessions.length ? <ul>{sessions.map(s => <li key={s.id}>
            <code>{s.id}</code> · {new Date(s.startsAt).toLocaleString('vi-VN')}
            {' '}· {s.capacity} vé · {s.method ?? 'Chưa có chính sách'}
            {s.method === 'LOTTERY' && new Date(s.registrationClosesAt).getTime() <= Date.now()
              && s.status !== 'DONG_DANG_KY' && (
                <button type="button" disabled={busy} onClick={() => runDraw(s.id)}>
                  Bốc thăm Lottery
                </button>
              )}
          </li>)}</ul> : <p>Chưa có suất.</p>}
        </section>
      )}
      {chosen && chosen.status === 'NHAP' && (
        <>
          <section className="panel">
            <h2>Thêm suất tổ chức</h2>
            <p className="note">Thời gian theo múi giờ máy tính của bạn. Suất phải ở tương lai.</p>
            <form className="auth-form" onSubmit={createSession}>
              <label>Địa điểm
                <select name="venueId" required defaultValue="">
                  <option value="" disabled>Chọn địa điểm</option>
                  {venues.map(v => <option key={v.id} value={v.id}>
                    {v.name} · {v.address}
                  </option>)}
                </select>
              </label>
              <label>Sức chứa <input name="capacity" type="number" min={1} max={100000} required /></label>
              <label>Bắt đầu <input name="startsAt" type="datetime-local" required /></label>
              <label>Kết thúc <input name="endsAt" type="datetime-local" required /></label>
              <label>Mở đăng ký <input name="registrationOpensAt" type="datetime-local" required /></label>
              <label>Đóng đăng ký <input name="registrationClosesAt" type="datetime-local" required /></label>
              <button type="submit" disabled={busy || !venues.length}>Thêm suất</button>
            </form>
          </section>

          <section className="panel">
            <h2>Chính sách phân bổ</h2>
            {sessions.length ? (
              <ul>{sessions.map(s => <li key={s.id}>
                {new Date(s.startsAt).toLocaleString('vi-VN')} ·
                {' '}{s.capacity} vé · {s.method ?? 'Chưa cấu hình'}
              </li>)}</ul>
            ) : <p>Chưa có suất.</p>}
            <form className="auth-form" onSubmit={setPolicy}>
              <label>Suất
                <select name="sessionId" required defaultValue="">
                  <option value="" disabled>Chọn suất</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>
                    {new Date(s.startsAt).toLocaleString('vi-VN')}
                  </option>)}
                </select>
              </label>
              <label>Phương thức
                <select name="method" defaultValue="FCFS">
                  <option value="FCFS">FCFS – Theo thời gian đăng ký</option>
                  <option value="LOTTERY">LOTTERY – Bốc thăm</option>
                </select>
              </label>
              <button type="submit" disabled={busy || !sessions.length}>Lưu chính sách</button>
            </form>
          </section>

          <section className="panel">
            <h2>Accessibility (khả năng tiếp cận)</h2>
            <form className="auth-form" onSubmit={setAccessibility}>
              <fieldset>
                <legend>Chỉ chọn đặc tính đã được xác nhận ở địa điểm thực tế</legend>
                {features.map(f => (
                  <label key={f.id} className="check-line">
                    <input type="checkbox" name="featureId" value={f.id} />
                    {f.name}
                  </label>
                ))}
              </fieldset>
              <label>Ghi chú xác minh <textarea name="note" maxLength={500} /></label>
              <label className="check-line">
                <input type="checkbox" name="verified" required />
                Tôi xác nhận thông tin tiếp cận đã được kiểm tra
              </label>
              <button type="submit" disabled={busy}>Lưu accessibility</button>
            </form>
          </section>

          <section className="panel">
            <h2>Công bố sự kiện</h2>
            <p className="note">Mọi suất phải có lịch tương lai và chính sách FCFS hoặc LOTTERY.</p>
            <button type="button" disabled={busy || !sessions.length} onClick={publish}>
              Công bố sự kiện
            </button>
          </section>
        </>
      )}
    </div>
  );
}
