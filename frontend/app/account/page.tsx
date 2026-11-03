import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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

  return (
    <main className="container">
      <Link href="/">← Danh sách sự kiện</Link>
      <header>
        <p className="eyebrow">MED-06 · GIAI ĐOẠN 3</p>
        <h1>Tài khoản của bạn</h1>
      </header>
      <section className="panel">
        <h2>Thông tin người dùng</h2>
        <p><strong>Họ tên:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Vai trò:</strong> {user.roles.join(', ') || 'Chưa có'}</p>
        <form method="POST" action="/api/auth/logout">
          <button type="submit">Đăng xuất</button>
        </form>
      </section>
      <p className="note">
        Chức năng đăng ký vé sẽ được bổ sung sau khi hoàn thiện quản lý suất.
      </p>
    </main>
  );
}
