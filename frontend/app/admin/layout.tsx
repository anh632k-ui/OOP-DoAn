import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticated } from '../../lib/backend';
import AdminNav from './admin-nav';

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
        <AdminNav />
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
