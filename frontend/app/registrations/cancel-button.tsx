'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CancelButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function cancel() {
    if (!window.confirm('Xác nhận hủy đăng ký suất này?')) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/registrations/${id}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      });
      if (!response.ok) {
        const result = (await response.json()) as { message?: string };
        setError(result.message ?? 'Không thể hủy đăng ký');
      } else router.refresh();
    } catch { setError('Lỗi kết nối'); }
    finally { setBusy(false); }
  }
  return <div>
    <button type="button" onClick={cancel} disabled={busy}>
      {busy ? 'Đang hủy...' : 'Hủy đăng ký'}
    </button>
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}
