'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  ManagedEvent, ManagedVenue, AccessibilityFeature,
} from './page';
import SessionInsights from './session-insights';
import SessionStaff from './session-staff';
import SessionReschedule from './session-reschedule';
import { formatVietnamDate, hanoiInputToIso } from '../../lib/vietnam-time';
import { labelStatus } from '../../lib/status-label';

type Session = {
  id: string; startsAt: string; endsAt: string; capacity: number;
  status: string; method: string | null; fcfsQuota?: number | null; registrationClosesAt: string;
};

type Props = {
  events: ManagedEvent[];
  venues: ManagedVenue[];
  features: AccessibilityFeature[];
};

export default function OrganizerDashboard({ events, venues, features }: Props) {
  const router = useRouter();
  const [eventId, setEventId] = useState(events.find(e => e.status !== 'DA_HUY')?.id ?? events[0]?.id ?? '');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [inspectedSession, setInspectedSession] = useState('');
  const [reload, setReload] = useState(0);
  const [activeTab, setActiveTab] = useState<'sessions' | 'people' | 'settings' | 'create'>('sessions');
  const [allocationChoice, setAllocationChoice] = useState<'FCFS'|'LOTTERY'|'MIXED'>('FCFS');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId) { setSessions([]); setInspectedSession(''); return; }
    let cancelled = false;
    fetch(`/api/manage/events/${eventId}/sessions`, { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error('Không tải được các suất của sự kiện');
        return (await r.json()) as { items: Session[] };
      })
      .then(data => { if (!cancelled) {
        setSessions(data.items);
        setInspectedSession(previous => data.items.some(s => s.id === previous)
          ? previous : (data.items[0]?.id ?? ''));
      } })
      .catch(() => { if (!cancelled) { setSessions([]); setError('Không tải được các suất; vui lòng thử lại.'); } });
    return () => { cancelled = true; };
  }, [eventId, reload]);

  async function request(path: string, method: 'POST' | 'PUT' | 'PATCH', body?: unknown) {
    const response = await fetch(`/api/manage/${path}`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    const result = (await response.json()) as {
      message?: string | string[]; id?: string; roundId?: string;
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
    if (!eventId || !window.confirm('Hủy sự kiện và toàn bộ đăng ký chưa diễn ra? Vé chưa dùng sẽ bị vô hiệu, thao tác không thể hoàn tác.')) return;
    void perform(async () => {
      await request(`events/${eventId}/cancel`, 'POST');
    });
  }

  function togglePause(pause: boolean) {
    if (!eventId || !window.confirm(pause
      ? 'Tạm ngưng sự kiện và dừng tiếp nhận đăng ký mới?'
      : 'Mở lại sự kiện và tiếp tục tiếp nhận đăng ký?')) return;
    void perform(async () => {
      await request(`events/${eventId}/${pause ? 'pause' : 'resume'}`, 'POST');
    });
  }

  function cancelSession(sessionId: string) {
    if (!window.confirm('Hủy suất này? Đăng ký bị hủy, vé chưa dùng sẽ bị vô hiệu.')) return;
    void perform(async () => {
      await request('sessions/' + sessionId + '/cancel', 'POST');
    });
  }

  function completeSession(sessionId: string) {
    if (!window.confirm('Hoàn tất suất? Đăng ký chờ còn lại sẽ chuyển sang từ chối.')) return;
    void perform(async () => {
      await request('sessions/' + sessionId + '/complete', 'POST');
    });
  }

  function uploadCover(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!eventId) return;
    const form = e.currentTarget, data = new FormData(form);
    void perform(async () => {
      const response = await fetch('/api/event-cover/' + eventId, {
        method: 'POST', body: data,
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? 'Không thể tải ảnh lên');
      form.reset();
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
    void perform(async () => {
      const toIso = (key: string) => hanoiInputToIso(String(data.get(key)));
      const startsAt = toIso('startsAt'), endsAt = toIso('endsAt');
      const registrationOpensAt = toIso('registrationOpensAt');
      const registrationClosesAt = toIso('registrationClosesAt');
      if (new Date(endsAt) <= new Date(startsAt)) {
        throw new Error('Kết thúc suất phải sau thời điểm bắt đầu.');
      }
      if (new Date(registrationClosesAt) <= new Date(registrationOpensAt)
        || new Date(registrationClosesAt) > new Date(startsAt)) {
        throw new Error('Hạn đăng ký phải sau giờ mở và không muộn hơn khi suất bắt đầu.');
      }
      await request(`events/${eventId}/sessions`, 'POST', {
        venueId: data.get('venueId'), capacity: Number(data.get('capacity')),
        startsAt, endsAt, registrationOpensAt, registrationClosesAt,
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
        method: allocationChoice,
        ...(allocationChoice === 'MIXED' ? { fcfsQuota: Number(data.get('fcfsQuota')) } : {}),
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
  const selectedSession = sessions.find(s => s.id === inspectedSession);
  return (
    <div className="management-area">
      {message && <p role="status" className="success-note">{message}</p>}
      {error && <p role="alert" className="form-error">{error}</p>}

      <section className="panel">
        <h2>Danh sách sự kiện của bạn</h2>
        {events.length === 0 ? <p>Chưa có sự kiện.</p> : (
          <ul className="event-list">{events.map(event => (
            <li key={event.id} className="event-item">
              <strong>{event.title}</strong> — {labelStatus(event.status)}
            </li>
          ))}</ul>
        )}
        <label className="management-label">Chọn sự kiện để quản lý
          <select value={eventId} onChange={e => {
            setEventId(e.target.value);
            setSessions([]);
            setInspectedSession('');
          }}>
            <option value="">-- Chọn --</option>
            {events.map(event => <option key={event.id} value={event.id}>
              {event.title} — {labelStatus(event.status)}
            </option>)}
          </select>
        </label>
        {chosen && <p className="note">Đang chọn: {chosen.title} ({labelStatus(chosen.status)})</p>}
      </section>

      <nav className="organizer-tabs" aria-label="Chức năng quản lý sự kiện">
        {([
          ['sessions', 'Danh sách suất'],
          ['people', 'Đăng ký & check-in'],
          ['settings', 'Thiết lập & địa điểm'],
          ['create', 'Tạo sự kiện mới'],
        ] as const).map(([value,label]) => (
          <button key={value} type="button"
            className={activeTab === value ? 'organizer-tab current' : 'organizer-tab'}
            aria-pressed={activeTab === value} onClick={() => setActiveTab(value)}>
            {label}
          </button>
        ))}
      </nav>
      <p className="note">Mọi ngày giờ trong hệ thống theo giờ Hà Nội (UTC+7).</p>

      {activeTab === 'create' && (
        <>
      <section className="panel">
        <h2>Tạo sự kiện (bản nháp)</h2>
        <form className="auth-form" onSubmit={createEvent}>
          <label>Tên sự kiện <input name="title" maxLength={200} required /></label>
          <label>Mô tả <textarea name="description" maxLength={4000} rows={3}/></label>
          <button type="submit" disabled={busy}>Tạo sự kiện</button>
        </form>
      </section>

        </>
      )}
      {activeTab === 'sessions' && (
        <>
      {chosen && (
        <section className="panel">
          <h2>Các suất của sự kiện</h2>
          {sessions.length ? <ul className="session-management-list">{sessions.map(s =>
            <li key={s.id} className="session-management-item">
              <strong>{formatVietnamDate(s.startsAt, 'short')}</strong>
              <p>{s.capacity} vé · {s.method === 'MIXED' ? `Kết hợp: ${s.fcfsQuota ?? 0} vé theo thứ tự, ${s.capacity - (s.fcfsQuota ?? 0)} vé bốc thăm` : (s.method ?? 'Chưa có chính sách')}
                {' '}· {labelStatus(s.status)}</p>
              <p className="note">Mã suất: <code>{s.id}</code></p>
            {s.status !== 'DA_HUY' && new Date(s.startsAt).getTime() >
              Date.now() + 30 * 60 * 1000 && chosen.status !== 'DA_HUY' && (
                <button type="button" disabled={busy}
                  onClick={() => cancelSession(s.id)}>Hủy suất</button>
              )}
            {s.status !== 'DA_HUY' && s.status !== 'HOAN_TAT'
              && new Date(s.endsAt).getTime() <= Date.now()
              && chosen.status === 'DA_CONG_BO' && (
                <button type="button" disabled={busy}
                  onClick={() => completeSession(s.id)}>Hoàn tất suất</button>
              )}
            {(s.method === 'LOTTERY' || s.method === 'MIXED') && new Date(s.registrationClosesAt).getTime() <= Date.now()
              && s.status !== 'DONG_DANG_KY' && s.status !== 'DA_HUY'
              && s.status !== 'HOAN_TAT' && chosen.status === 'DA_CONG_BO' && (
                <button type="button" disabled={busy} onClick={() => runDraw(s.id)}>
                  Bốc thăm phần vé còn lại
                </button>
              )}
          </li>)}</ul> : <p>Chưa có suất.</p>}
        </section>
      )}
        </>
      )}
      {activeTab === 'sessions' && chosen &&
        ['NHAP','DA_CONG_BO'].includes(chosen.status) && (
          <>
          <section className="panel">
            <h2>Thêm suất tổ chức</h2>
            {error && <p className="form-error" role="alert">{error}</p>}
            <p className="note">Nhập giờ Hà Nội (UTC+7), không phụ thuộc múi giờ trên máy tính. Suất phải ở tương lai.</p>
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
                {formatVietnamDate(s.startsAt, 'short')} ·
                {' '}{s.capacity} vé · {s.method === 'MIXED' ? `Kết hợp (${s.fcfsQuota ?? 0} cấp sớm / ${s.capacity - (s.fcfsQuota ?? 0)} bốc thăm)` : (s.method ?? 'Chưa cấu hình')}
              </li>)}</ul>
            ) : <p>Chưa có suất.</p>}
            <form className="auth-form" onSubmit={setPolicy}>
              <label>Suất
                <select name="sessionId" required defaultValue="">
                  <option value="" disabled>Chọn suất</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>
                    {formatVietnamDate(s.startsAt, 'short')}
                  </option>)}
                </select>
              </label>
              <label>Phương thức
                <select name="method" value={allocationChoice}
                  onChange={e => setAllocationChoice(e.target.value as 'FCFS'|'LOTTERY'|'MIXED')}>
                  <option value="FCFS">Theo thứ tự đăng ký</option>
                  <option value="LOTTERY">Bốc thăm công bằng</option>
                  <option value="MIXED">Kết hợp cấp sớm và bốc thăm</option>
                </select>
              </label>
              {allocationChoice === 'MIXED' && <label>Số vé cấp theo thứ tự đăng ký
                <input name="fcfsQuota" type="number" min={1} max={99999} required
                  placeholder="Ví dụ: 50 trong 100 vé" />
                <span className="note">Phần còn lại sẽ bốc thăm khi đóng đăng ký.</span>
              </label>}
              <button type="submit" disabled={busy || !sessions.length}>Lưu chính sách</button>
            </form>
          </section>


          </>
      )}
      {activeTab === 'people' && (
        <>
      {chosen && sessions.length > 0 && (
        <section className="panel">
          <h2>Thống kê và danh sách đăng ký theo suất</h2>
          <label className="management-label">Chọn suất
            <select value={inspectedSession} onChange={e => setInspectedSession(e.target.value)}>
              {sessions.map(s => <option key={s.id} value={s.id}>
                {formatVietnamDate(s.startsAt, 'short')} · {s.method ?? 'Chưa cấu hình'}
              </option>)}
            </select>
          </label>
          {inspectedSession && <SessionInsights sessionId={inspectedSession} refreshVersion={reload}/>}
          {inspectedSession && chosen.status !== 'DA_HUY' &&
            <SessionStaff sessionId={inspectedSession} revision={reload}/>}
          {selectedSession && chosen.status !== 'DA_HUY'
            && !['HOAN_TAT','DA_HUY'].includes(selectedSession.status)
            && new Date(selectedSession.startsAt).getTime() > Date.now()+30*60*1000
            && <SessionReschedule
              key={selectedSession.id + ':' + selectedSession.startsAt}
              sessionId={selectedSession.id} startsAt={selectedSession.startsAt}
              endsAt={selectedSession.endsAt}
              onSaved={() => setReload(v => v+1)}
            />}

        </section>
      )}
        </>
      )}
      {activeTab === 'settings' && (
        <>
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
      {chosen && chosen.status === 'NHAP' && (
        <section className="panel">
          <h2>Ảnh bìa sự kiện</h2>
          <p className="note">Lưu trong object storage S3-compatible, không lưu binary trong PostgreSQL.</p>
          <form className="auth-form" onSubmit={uploadCover}>
            <label>Chọn ảnh (PNG/JPEG/WebP, tối đa 2 MB)
              <input name="image" type="file" accept="image/png,image/jpeg,image/webp" required/>
            </label>
            <button type="submit" disabled={busy}>Tải ảnh bìa</button>
          </form>
        </section>
      )}
      {chosen && ['DA_CONG_BO','TAM_NGUNG'].includes(chosen.status) && (
        <section className="panel">
          <h2>{chosen.status === 'TAM_NGUNG' ? 'Mở lại sự kiện' : 'Tạm ngưng sự kiện'}</h2>
          <p className="note">Tạm ngưng chặn đăng ký mới; vé và đăng ký đã có vẫn được giữ.</p>
          <button type="button" disabled={busy}
            onClick={() => togglePause(chosen.status === 'DA_CONG_BO')}>
            {chosen.status === 'TAM_NGUNG' ? 'Mở lại sự kiện' : 'Tạm ngưng'}
          </button>
        </section>
      )}
      {chosen && chosen.status !== 'DA_HUY' && (
        <section className="panel">
          <h2>Hủy sự kiện</h2>
          <p className="note">Hủy sự kiện sẽ vô hiệu vé chưa dùng và hủy các đăng ký liên quan. Không thể hủy trong 30 phút trước giờ diễn ra hoặc sau khi có vé check-in.</p>
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

      {chosen && chosen.status === 'NHAP' && (
        <>
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
            <p className="note">Mọi suất phải có lịch tương lai và chính sách phân bổ hợp lệ (theo thứ tự, bốc thăm hoặc kết hợp).</p>
            <button type="button" disabled={busy || !sessions.length} onClick={publish}>
              Công bố sự kiện
            </button>
          </section>
        </>
      )}
        </>
      )}
    </div>
  );
}
