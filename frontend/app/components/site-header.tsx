import Link from 'next/link';
import { getAuthenticated } from '../../lib/backend';

type User = { name: string; roles: string[] };

export default async function SiteHeader() {
  const user = await getAuthenticated<User>('auth/me');
  const canOrganize = user?.roles.some(role => role === 'ADMIN' || role === 'ORGANIZER');
  const canCheckin = user?.roles.some(role => role === 'ADMIN' || role === 'CHECKIN');

  return <header className="site-header">
    <div className="site-header-inner">
      <Link href="/" className="site-brand" aria-label="MED-06 - Trang chủ">
        <span aria-hidden="true" className="brand-mark"><i/><i/><i/></span>
        <span className="brand-name">MED<span>·</span>06<small>VĂN HÓA CHO MỌI NGƯỜI</small></span>
      </Link>
      <nav className="site-navigation" aria-label="Điều hướng chính">
        <Link href="/#su-kien">Khám phá</Link>
        {user && <Link href="/registrations">Đăng ký của tôi</Link>}
        {user && <Link href="/tickets">Vé điện tử</Link>}
        {canOrganize && <Link href="/organizer">Tổ chức sự kiện</Link>}
        {canCheckin && <Link href="/checkin">Check-in</Link>}
        {user?.roles.includes('ADMIN') && <Link href="/admin">Quản trị</Link>}
      </nav>
      <div className="site-header-actions">
        {user
          ? <Link className="header-account" href="/account" title={user.name}>
              <span className="account-avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
              <span className="header-account-label">Tài khoản</span>
            </Link>
          : <>
              <Link href="/account/login" className="header-signin">Đăng nhập</Link>
              <Link href="/account/register" className="header-register">Tạo tài khoản</Link>
            </>}
      </div>
    </div>
  </header>;
}
