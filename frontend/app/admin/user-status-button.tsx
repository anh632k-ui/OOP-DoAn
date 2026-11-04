'use client';

import { useState } from 'react';

export default function AccountStatusButton({
  id, name, status, isSelf, isAdmin, onSaved,
}: {
  id:string; name:string; status:string;
  isSelf:boolean; isAdmin:boolean; onSaved:()=>void;
}) {
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const locked = status === 'KHOA';
  const disabled = busy || isSelf || isAdmin;
  async function changeStatus() {
    if (!window.confirm((locked ? 'Mở khóa ' : 'Khóa ') + name + '?')) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/users/' + id + '/status', {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({locked:!locked}),
      });
      const body = (await response.json()) as {message?:string|string[]};
      if (!response.ok) {
        throw new Error(Array.isArray(body.message)
          ? body.message.join(', ') : body.message ?? 'Thao tác không thành công');
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi máy chủ');
    } finally { setBusy(false); }
  }
  return <div>
    <button type="button" disabled={disabled} onClick={() => void changeStatus()}>
      {busy ? 'Đang cập nhật...' : locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
    </button>
    {(isSelf || isAdmin) && <span className="note">
      {' '}Không thay đổi trạng thái tài khoản ADMIN tại đây.
    </span>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}
