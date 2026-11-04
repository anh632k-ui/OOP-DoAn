import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticated } from '../../../lib/backend';
import UserDirectory from '../user-directory';

export const dynamic = 'force-dynamic';

type CurrentUser = { id: string; name: string; roles: string[] };

export default async function AdminUsersPage() {
  const user = await getAuthenticated<CurrentUser>('auth/me');
  if (!user) redirect('/account/login');
  if (!user.roles.includes('ADMIN')) redirect('/account');

  return (
    <main id="main-content" className="container admin-page">
      <Link href="/admin" className="back-link">← Tổng quan quản trị</Link>
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">MED-06 · QUẢN TRỊ NGƯỜI DÙNG</p>
          <h1>Người dùng & phân quyền</h1>
          <p>Tìm tài khoản, khóa/mở khóa và cấp quyền theo phạm vi.</p>
        </div>
        <Link className="button-secondary" href="/admin/audit">
          Xem nhật ký <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <UserDirectory currentUserId={user.id} />
    </main>
  );
}
