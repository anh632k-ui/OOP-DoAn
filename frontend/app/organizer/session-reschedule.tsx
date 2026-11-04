'use client';

import { FormEvent, useState } from 'react';
import { toHanoiInput, hanoiInputToIso } from '../../lib/vietnam-time';

export default function SessionReschedule({
  sessionId, startsAt, endsAt, onSaved,
}: {sessionId:string; startsAt:string; endsAt:string; onSaved:()=>void}) {
  const [start, setStart] = useState(() => toHanoiInput(startsAt));
  const [end, setEnd] = useState(() => toHanoiInput(endsAt));
  const [reason,setReason] = useState('');
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm('Xác nhận đổi lịch? Người đăng ký sẽ thấy thông báo và thời gian mới.')) return;
    setBusy(true);setError('');setMessage('');
    try {
      const response = await fetch('/api/manage/sessions/' + sessionId + '/schedule',{
        method:'PATCH',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          startsAt:hanoiInputToIso(start),
          endsAt:hanoiInputToIso(end),reason,
        }),
      });
      const body = (await response.json()) as {message?:string|string[];affectedRegistrations?:number};
      if (!response.ok) {
        throw new Error(Array.isArray(body.message)
          ? body.message.join('; ') : body.message ?? 'Không thể đổi lịch');
      }
      setMessage('Đổi lịch thành công. Số đăng ký còn hiệu lực: '
        + (body.affectedRegistrations ?? 0));
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : 'Lỗi máy chủ'); }
    finally {setBusy(false);}
  }
  return <div className="reschedule-form">
    <h3>Đổi lịch suất</h3>
    <p className="note">Đổi trước khung giờ check-in. Nếu đã có người đăng ký,
      giờ mới phải cách hiện tại hơn 24 giờ. Thời hạn đăng ký được giữ nguyên.</p>
    <form className="auth-form" onSubmit={submit}>
      <p className="note">Ngày giờ được nhập theo giờ Hà Nội (UTC+7).</p>
      <label>Bắt đầu mới
        <input type="datetime-local" required value={start}
          onChange={e => setStart(e.target.value)}/>
      </label>
      <label>Kết thúc mới
        <input type="datetime-local" required value={end}
          onChange={e => setEnd(e.target.value)}/>
      </label>
      <label>Lý do đổi lịch
        <textarea required minLength={10} maxLength={500} value={reason}
          onChange={e => setReason(e.target.value)}/>
      </label>
      <button type="submit" disabled={busy || reason.trim().length < 10}>
        {busy ? 'Đang cập nhật...' : 'Lưu lịch mới'}
      </button>
    </form>
    {message && <p role="status" className="success-note">{message}</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}
