'use client';

import { useEffect, useState } from 'react';

type Item = {
  id: string; userId: string; name: string; email: string;
  reason: string; status: string; createdAt: string;
};
export default function OrganizerRequestReview() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [pendingId, setPendingId] = useState('');

  useEffect(() => {
    let mounted = true;
    fetch('/api/admin/organizer-requests', { cache: 'no-store' })
      .then(async response => {
        const body = (await response.json()) as { items?: Item[]; message?: string };
        if (!response.ok || !body.items) throw new Error(body.message ?? 'Không thể tải yêu cầu');
        if (mounted) setItems(body.items);
      })
      .catch(e => { if (mounted) setError(e instanceof Error ? e.message : 'Lỗi máy chủ'); });
    return () => { mounted = false; };
  }, [revision]);

  async function review(item: Item, approve: boolean) {
    if (!window.confirm(approve
      ? 'Duyệt yêu cầu và cấp quyền Ban tổ chức cho ' + item.name + '?'
      : 'Từ chối yêu cầu của ' + item.name + '?')) return;
    setPendingId(item.id); setError(''); setNotice('');
    try {
      const response = await fetch('/api/admin/organizer-requests/' + item.id + '/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve }),
      });
      const body = (await response.json()) as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message)
        ? body.message.join(', ') : body.message ?? 'Xét duyệt thất bại');
      setNotice(approve ? 'Đã duyệt và cấp quyền Ban tổ chức.' : 'Đã từ chối yêu cầu.');
      setRevision(v => v + 1);
    } catch (e) { setError(e instanceof Error ? e.message : 'Lỗi máy chủ'); }
    finally { setPendingId(''); }
  }

  return <section className="panel">
    <h2>Danh sách yêu cầu</h2>
    {notice && <p className="success-note" role="status">{notice}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {items.length === 0 ? <p>Hiện chưa có yêu cầu.</p> :
      <div className="admin-user-list">{items.map(item =>
        <article className="admin-user" key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.email}</p>
          <p><strong>Trạng thái:</strong> {item.status === 'CHO_DUYET' ? 'Chờ duyệt'
            : item.status === 'DA_DUYET' ? 'Đã duyệt' : 'Từ chối'}</p>
          <p><strong>Nội dung:</strong> {item.reason}</p>
          {item.status === 'CHO_DUYET' && <div className="row-actions">
            <button type="button" disabled={!!pendingId}
              onClick={() => void review(item, true)}>Duyệt</button>{' '}
            <button type="button" disabled={!!pendingId}
              onClick={() => void review(item, false)}>Từ chối</button>
          </div>}
        </article>)}</div>}
  </section>;
}
