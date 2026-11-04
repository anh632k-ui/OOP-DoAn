import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticated } from '../../../lib/backend';
import AuditTable from './audit-table';

export const dynamic = 'force-dynamic';
type User = { id: string; name: string; roles: string[] };

export default async function AuditPage() {
  const current = await getAuthenticated<User>('auth/me');
  if (!current) redirect('/account/login');
  if (!current.roles.includes('ADMIN')) {
    return <main className="container">
      <Link href="/account">← Tài khoản</Link>
      <h1>Không có quyền xem nhật ký</h1>
      <p role="alert">Chỉ ADMIN được xem nhật ký hệ thống.</p>
    </main>;
  }
  return <main className="container">
    <Link href="/admin">← Quản trị người dùng</Link>
    <header>
      <p className="eyebrow">MED-06 · NHẬT KÝ HỆ THỐNG</p>
      <h1>Lịch sử thao tác</h1>
      <p className="note">Theo dõi phân bổ vé, hủy đăng ký,
        cấp quyền và check-in. Không lưu mật khẩu hay mã QR vào nhật ký này.</p>
    </header>
    <AuditTable />
  </main>;
}
