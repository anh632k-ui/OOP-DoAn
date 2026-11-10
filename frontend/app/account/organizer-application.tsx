'use client';

import { FormEvent, useEffect, useState } from 'react';

type Application = { status: string; reason: string; createdAt: string };
export default function OrganizerApplication() {
  const [application, setApplication] = useState<Application | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/organizer-request', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Không tải được yêu cầu');
        return (await response.json()) as { application: Application | null };
      })
      .then(data => setApplication(data.application))
      .catch(() => setError('Không thể tải trạng thái yêu cầu tổ chức.'));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/organizer-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const body = (await response.json()) as { message?: string | string[]; status?: string };
      if (!response.ok) {
        throw new Error(Array.isArray(body.message) ? body.message.join(', ')
          : body.message ?? 'Không thể gửi yêu cầu');
      }
      setApplication({ reason, status: 'CHO_DUYET', createdAt: new Date().toISOString() });
      setMessage('Yêu cầu đã gửi. Quản trị viên sẽ xem xét và cấp quyền khi phù hợp.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể gửi yêu cầu');
    } finally { setBusy(false); }
  }

  return <section className="panel organizer-application" aria-labelledby="organizer-apply-title">
    <h2 id="organizer-apply-title">Đăng ký làm Ban tổ chức</h2>
    <p className="note">Muốn tổ chức một sự kiện văn hóa? Gửi thông tin để quản trị viên xét duyệt.
      Yêu cầu không tự cấp quyền cho tài khoản của bạn.</p>
    {application?.status === 'CHO_DUYET' && <p role="status">Yêu cầu của bạn đang chờ duyệt.</p>}
    {application?.status === 'DA_DUYET' && <p role="status">Yêu cầu đã được duyệt. Bạn có thể truy cập phần tổ chức sự kiện.</p>}
    {(application === null || application.status === 'TU_CHOI') && <form className="auth-form" onSubmit={submit}>
      {application?.status === 'TU_CHOI' && <p>Yêu cầu trước chưa được duyệt. Bạn có thể gửi lại với thông tin mới.</p>}
      <label>Mục đích và loại sự kiện dự kiến
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          minLength={10} maxLength={500} rows={3} required
          placeholder="Ví dụ: Tôi muốn tổ chức triển lãm tranh cộng đồng..." />
      </label>
      <button type="submit" disabled={busy}>{busy ? 'Đang gửi...' : 'Gửi yêu cầu xét duyệt'}</button>
    </form>}
    {message && <p className="success-note" role="status">{message}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
