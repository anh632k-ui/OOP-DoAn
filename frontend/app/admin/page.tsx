import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticated } from '../../lib/backend';
import UserDirectory from './user-directory';

export const dynamic = 'force-dynamic';
type CurrentUser = { id: string; name: string; email: string; roles: string[] };

export default async function AdminPage() {
  const user = await getAuthenticated<CurrentUser>('auth/me');
  if (!user) redirect('/account/login');
  if (!user.roles.includes('ADMIN')) {
    return <main id="main-content" className="container">
      <Link href="/account">← Tài khoản</Link>
      <h1>Không có quyền quản trị</h1>
      <p role="alert">Chỉ tài khoản ADMIN được quản lý vai trò người dùng.</p>
    </main>;
  }
  return <main id="main-content" className="container admin-page">
    <Link href="/account" className="back-link">← Tài khoản</Link>
    <header className="admin-page-heading">
      <div>
        <p className="eyebrow">MED-06 · QUẢN TRỊ HỆ THỐNG</p>
        <h1>Quản lý người dùng</h1>
        <p>Phân quyền và theo dõi trạng thái tài khoản. Quản trị viên: {user.name}.</p>
      </div>
      <Link className="button-secondary" href="/admin/audit">
        Nhật ký hệ thống <span aria-hidden="true">↗</span>
      </Link>
    </header>
    <UserDirectory currentUserId={user.id}/>
  </main>;
}
