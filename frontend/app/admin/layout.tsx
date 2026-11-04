import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticated } from '../../lib/backend';

type AdminUser = { name: string; roles: string[] };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticated<AdminUser>('auth/me');
  if (!user) redirect('/account/login');
  if (!user.roles.includes('ADMIN')) redirect('/account');

  return (
    <div className="admin-workspace">
      <aside className="admin-workspace-sidebar" aria-label="Khu vực quản trị">
        <div className="admin-workspace-brand">
          <span>MED-06</span>
          <small>TRUNG TÂM QUẢN TRỊ</small>
        </div>
        <p className="admin-workspace-caption">Điều hướng</p>
        <nav className="admin-workspace-nav" aria-label="Điều hướng quản trị">
          <Link href="/admin">Tổng quan</Link>
          <Link href="/admin/users">Người dùng & phân quyền</Link>
          <Link href="/admin/audit">Nhật ký hệ thống</Link>
          <Link href="/organizer">Sự kiện & suất</Link>
          <Link href="/checkin">Kiểm tra vé</Link>
        </nav>
        <div className="admin-workspace-bottom">
          <span>Quản trị viên</span>
          <strong>{user.name}</strong>
          <Link href="/account">← Về tài khoản</Link>
        </div>
      </aside>
      <div className="admin-workspace-content">{children}</div>
    </div>
  );
}
