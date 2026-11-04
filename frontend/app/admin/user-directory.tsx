'use client';

import { FormEvent, useEffect, useState } from 'react';
import AccountStatusButton from './user-status-button';
import { labelRole, labelStatus } from '../../lib/status-label';

type User = {
  id: string; name: string; email: string;
  status: string; createdAt: string; roles: string[];
};
type DirectoryResponse = {
  items: User[]; total: number; page: number; pageSize: number; pages: number;
};
type ApiError = { message?: string | string[] };

function errorText(result: ApiError) {
  return Array.isArray(result.message) ? result.message.join(', ')
    : result.message ?? 'Yêu cầu thất bại';
}
function RoleEditor({ user, currentUserId, onSaved }: {
  user: User; currentUserId: string; onSaved: () => void;
}) {
  const [organizer, setOrganizer] = useState(user.roles.includes('ORGANIZER'));
  const [checkin, setCheckin] = useState(user.roles.includes('CHECKIN'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const sameUser = user.id === currentUserId;
  const disabled = saving || sameUser || user.status !== 'HOAT_DONG';

  async function save() {
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/admin/users/' + user.id + '/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizer, checkin }),
      });
      const data = (await response.json()) as ApiError;
      if (!response.ok) throw new Error(errorText(data));
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu vai trò');
    } finally { setSaving(false); }
  }

  return <div className="admin-role-editor">
    <label><input type="checkbox" checked={organizer} disabled={disabled}
      onChange={e => setOrganizer(e.target.checked)} /> Ban tổ chức</label>
    <label><input type="checkbox" checked={checkin} disabled={disabled}
      onChange={e => setCheckin(e.target.checked)} /> Nhân viên check-in</label>
    <button type="button" disabled={disabled} onClick={() => void save()}>
      {saving ? 'Đang lưu...' : 'Lưu quyền'}
    </button>
    {sameUser && <small>Không tự sửa quyền của mình.</small>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}

export default function UserDirectory({ currentUserId }: { currentUserId: string }) {
  const [typedQuery, setTypedQuery] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<DirectoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.set('q', query);
    fetch('/api/admin/users?' + params.toString(), { cache: 'no-store' })
      .then(async response => {
        const data = (await response.json()) as DirectoryResponse & ApiError;
        if (!response.ok) throw new Error(errorText(data));
        return data;
      })
      .then(data => { if (active) setResult(data); })
      .catch(err => {
        if (active) setError(err instanceof Error ? err.message : 'Lỗi kết nối');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, query, revision]);

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(1);
    setQuery(typedQuery.trim().slice(0, 100));
  }

  return <section className="panel">
    <h2>Tài khoản đã đăng ký</h2>
    <p className="note">Chỉ ADMIN có thể cấp hoặc thu hồi vai trò ORGANIZER/CHECKIN.
      Quyền ADMIN và ATTENDEE không được thay đổi tại đây. Mỗi thay đổi được ghi nhật ký.</p>
    <form className="search-form" onSubmit={search}>
      <label>Tìm theo tên hoặc email
        <input type="search" maxLength={100} value={typedQuery}
          onChange={event => setTypedQuery(event.target.value)}
          placeholder="Nhập tên hoặc email"/>
      </label>
      <button type="submit">Tìm tài khoản</button>
    </form>
    {loading && <p role="status">Đang tải danh sách...</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    {result && <>
      <p>{result.total} tài khoản · Trang {result.page}/{Math.max(1,result.pages)}</p>
      {result.items.length === 0 && <p>Không có tài khoản phù hợp.</p>}
      <div className="admin-user-list">
        {result.items.map(user => (
          <article key={user.id} className="admin-user">
            <h3>{user.name}</h3>
            <p>{user.email} · {labelStatus(user.status)}</p>
            <p>Vai trò hiện tại: {user.roles.map(labelRole).join(', ') || 'Chưa có'}</p>
            <AccountStatusButton
              id={user.id} name={user.name} status={user.status}
              isSelf={user.id === currentUserId} isAdmin={user.roles.includes('ADMIN')}
              onSaved={() => setRevision(v => v+1)}
            />
            <RoleEditor
              key={user.id + ':' + user.roles.join('-')}
              user={user}
              currentUserId={currentUserId}
              onSaved={() => setRevision(v => v + 1)}
            />
          </article>
        ))}
      </div>
      <nav className="insights-pager" aria-label="Phân trang tài khoản">
        <button type="button" disabled={loading || page <= 1}
          onClick={() => setPage(p => Math.max(1,p - 1))}>Trang trước</button>
        <button type="button" disabled={loading || page >= result.pages}
          onClick={() => setPage(p => p + 1)}>Trang sau</button>
      </nav>
    </>}
  </section>;
}
