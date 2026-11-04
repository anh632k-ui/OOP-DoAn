'use client';

import { FormEvent, useEffect, useState } from 'react';

type AssignedStaff = { id: string; name: string; email: string; assignedAt: string };
type ErrorResponse = { message?: string | string[] };

function message(body: ErrorResponse): string {
  return Array.isArray(body.message) ? body.message.join(', ')
    : body.message ?? 'Không thực hiện được thao tác';
}

export default function SessionStaff({ sessionId, revision }: {
  sessionId: string; revision: number;
}) {
  const [items, setItems] = useState<AssignedStaff[]>([]);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    fetch('/api/manage/sessions/' + sessionId + '/staff', {cache:'no-store'})
      .then(async response => {
        const data = (await response.json()) as {items?: AssignedStaff[]} & ErrorResponse;
        if (!response.ok || !data.items) throw new Error(message(data));
        return data.items;
      })
      .then(rows => { if (active) setItems(rows); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Lỗi kết nối'); });
    return () => { active = false; };
  }, [sessionId,refresh,revision]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/manage/sessions/' + sessionId + '/staff', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body:JSON.stringify({email:email.trim()}),
      });
      const data = (await response.json()) as ErrorResponse;
      if (!response.ok) throw new Error(message(data));
      setEmail('');
      setRefresh(v => v+1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không phân công được nhân viên');
    } finally { setBusy(false); }
  }

  async function remove(staff: AssignedStaff) {
    if (!window.confirm('Thu hồi quyền check-in suất này của ' + staff.name + '?')) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/manage/sessions/' + sessionId + '/staff/' + staff.id, {
        method:'DELETE', headers:{'Content-Type':'application/json'}, body:'{}',
      });
      const data = (await response.json()) as ErrorResponse;
      if (!response.ok) throw new Error(message(data));
      setRefresh(v => v+1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thu hồi được');
    } finally { setBusy(false); }
  }

  return <section className="staff-panel">
    <h3>Phân công nhân viên check-in</h3>
    <p className="note">Tài khoản nhân viên phải được ADMIN cấp vai trò CHECKIN trước.
      Nhân viên chỉ quét vé thuộc các suất được giao.</p>
    <form onSubmit={add} className="auth-form">
      <label>Email nhân viên
        <input type="email" value={email} autoComplete="off" maxLength={254}
          onChange={e => setEmail(e.target.value)} required />
      </label>
      <button type="submit" disabled={busy || !email.trim()}>
        Phân công cho suất
      </button>
    </form>
    {error && <p role="alert" className="form-error">{error}</p>}
    {items.length===0 ? <p>Chưa phân công nhân viên.</p> :
      <ul>{items.map(item => <li key={item.id}>
        {item.name} ({item.email}){' '}
        <button type="button" disabled={busy} onClick={() => void remove(item)}>
          Thu hồi
        </button>
      </li>)}</ul>}
  </section>;
}
