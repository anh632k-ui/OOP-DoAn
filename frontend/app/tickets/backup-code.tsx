'use client';

import { useState } from 'react';

export default function BackupCode({ code }: { code: string }) {
  const [message, setMessage] = useState('');
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage('Đã sao chép nguyên mã vé.');
    } catch {
      setMessage('Không thể tự động sao chép. Bạn có thể chọn và sao chép mã trong ô.');
    }
  }
  return <details className="ticket-backup">
    <summary>Hiển thị mã dự phòng cho nhân viên check-in</summary>
    <p className="ticket-backup-note">Chỉ sử dụng khi không thể quét QR.
      Không chia sẻ mã với người khác.</p>
    <div className="ticket-backup-tools">
      <code className="ticket-code">{code}</code>
      <button type="button" className="button-secondary" onClick={copyCode}>
        Sao chép mã
      </button>
    </div>
    {message && <p className="ticket-copy-feedback" role="status">{message}</p>}
  </details>;
}
