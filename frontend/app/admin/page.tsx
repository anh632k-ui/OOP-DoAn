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
    return <main className="container">
      <Link href="/account">← Tài khoản</Link>
    <p><Link href="/admin/audit">Xem nhật ký thao tác hệ thống</Link></p>
      <h1>Không có quyền quản trị</h1>
      <p role="alert">Chỉ tài khoản ADMIN được quản lý vai trò người dùng.</p>
    </main>;
  }
  return <main className="container">
    <Link href="/account">← Tài khoản</Link>
    <header>
      <p className="eyebrow">MED-06 · QUẢN TRỊ TÀI KHOẢN</p>
      <h1>Quản lý người dùng và phân quyền</h1>
      <p>Quản trị viên: {user.name}</p>
    </header>
    <UserDirectory currentUserId={user.id}/>
  </main>;
}
