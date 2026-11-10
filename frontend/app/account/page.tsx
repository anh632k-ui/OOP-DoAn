import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { labelRole } from '../../lib/status-label';
import OrganizerApplication from './organizer-application';

export const dynamic = 'force-dynamic';

type PublicUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
};

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';

export default async function AccountPage() {
  const token = (await cookies()).get('med06_session')?.value;
  if (!token) redirect('/account/login');

  let user: PublicUser | null = null;
  try {
    const response = await fetch(`${api}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    if (response.ok) user = (await response.json()) as PublicUser;
  } catch {
    // Display login when backend cannot confirm a session.
  }
  if (!user) redirect('/account/login');

  return <main id="main-content" className="container account-page">
    <Link href="/#su-kien" className="back-link">← Khám phá sự kiện</Link>
    <header>
      <p className="eyebrow">MED-06 · TRANG CÁ NHÂN</p>
      <h1>Tài khoản của bạn</h1>
      <p>Quản lý vé, đăng ký và các chức năng phù hợp với vai trò của bạn.</p>
    </header>
    <section className="account-profile">
      <div className="account-profile-heading">
        <span className="account-profile-avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
        <div>
          <p className="eyebrow">THÔNG TIN THÀNH VIÊN</p>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      </div>
      <div className="account-role-list" aria-label="Vai trò tài khoản">
        {user.roles.map(role => <span key={role}>{labelRole(role)}</span>)}
      </div>
      <form method="POST" action="/api/auth/logout">
        <button className="account-logout" type="submit">Đăng xuất</button>
      </form>
    </section>

    <section className="account-actions" aria-labelledby="account-actions-title">
      <div className="section-heading">
        <div><p className="section-kicker">KHÔNG GIAN CỦA BẠN</p>
          <h2 id="account-actions-title">Truy cập nhanh</h2>
        </div>
      </div>
      <nav className="account-action-grid" aria-label="Các chức năng của tôi">
        <Link href="/registrations">
          <span className="account-action-icon" aria-hidden="true">01</span>
          <strong>Đăng ký của tôi</strong>
          <span>Xem tình trạng đăng ký và danh sách chờ.</span>
          <b aria-hidden="true">↗</b>
        </Link>
        <Link href="/tickets">
          <span className="account-action-icon" aria-hidden="true">02</span>
          <strong>Vé điện tử</strong>
          <span>Tra cứu vé QR đã được cấp cho bạn.</span>
          <b aria-hidden="true">↗</b>
        </Link>
        {user.roles.some(role => role === 'ORGANIZER' || role === 'ADMIN') &&
          <Link href="/organizer">
            <span className="account-action-icon" aria-hidden="true">03</span>
            <strong>Quản lý sự kiện</strong>
            <span>Tổ chức suất và xem tình hình đăng ký.</span>
            <b aria-hidden="true">↗</b>
          </Link>}
        {user.roles.some(role => role === 'CHECKIN' || role === 'ADMIN') &&
          <Link href="/checkin">
            <span className="account-action-icon" aria-hidden="true">04</span>
            <strong>Kiểm tra vé</strong>
            <span>Quét QR tại các suất được phân công.</span>
            <b aria-hidden="true">↗</b>
          </Link>}
        {user.roles.includes('ADMIN') &&
          <Link href="/admin">
            <span className="account-action-icon" aria-hidden="true">05</span>
            <strong>Quản trị hệ thống</strong>
            <span>Quản lý tài khoản và phân quyền nhân viên.</span>
            <b aria-hidden="true">↗</b>
          </Link>}
      </nav>
    </section>
    {!user.roles.includes('ORGANIZER') && !user.roles.includes('ADMIN') &&
      <OrganizerApplication />}
  </main>;
}
