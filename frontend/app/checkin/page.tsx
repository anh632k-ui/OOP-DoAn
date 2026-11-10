import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticated } from '../../lib/backend';
import CheckinScanner from './scanner';

export const dynamic = 'force-dynamic';

type PublicUser = { id: string; name: string; roles: string[] };

export default async function CheckinPage() {
  const user = await getAuthenticated<PublicUser>('auth/me');
  if (!user) redirect('/account/login');
  if (!user.roles.some(role => role === 'CHECKIN' || role === 'ADMIN')) {
    return <main id="main-content" className="container checkin-page">
      <Link href="/account">← Tài khoản</Link>
      <h1>Không có quyền kiểm tra vé</h1>
      <p>Chỉ nhân viên CHECKIN hoặc ADMIN được sử dụng chức năng này.</p>
    </main>;
  }
  return <main id="main-content" className="container checkin-page">
    <Link href="/">← Danh sách sự kiện</Link>
    <header>
      <p className="eyebrow">MED-06 · KIỂM TRA VÉ</p>
      <h1>Quét vé điện tử</h1>
      <p>Nhân viên: {user.name}</p>
    </header>
    <CheckinScanner />
  </main>;
}
