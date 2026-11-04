import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import OrganizerDashboard from './organizer-dashboard';
import { labelRole } from '../../lib/status-label';

export const dynamic = 'force-dynamic';

export type ManagedEvent = {
  id: string; title: string; description: string;
  status: string; organizerId: string;
};
export type ManagedVenue = {
  id: string; name: string; address: string; description: string;
};
export type AccessibilityFeature = {
  id: string; name: string; description: string;
};
type PublicUser = { id: string; name: string; roles: string[] };

const backend = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';

async function getJson<T>(path: string, token: string): Promise<T | null> {
  try {
    const response = await fetch(`${backend}/api/${path}`, {
      cache: 'no-store', headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(7000),
    });
    return response.ok ? (await response.json()) as T : null;
  } catch { return null; }
}

export default async function OrganizerPage() {
  const token = (await cookies()).get('med06_session')?.value;
  if (!token) redirect('/account/login');
  const user = await getJson<PublicUser>('auth/me', token);
  if (!user) redirect('/account/login');

  if (!user.roles.some(r => r === 'ORGANIZER' || r === 'ADMIN')) {
    return (
      <main className="container">
        <Link href="/account">← Tài khoản</Link>
        <h1>Chưa được cấp quyền tổ chức</h1>
        <p role="status">Tài khoản hiện có vai trò {user.roles.map(labelRole).join(', ')}.
          Chỉ ORGANIZER hoặc ADMIN được quản lý sự kiện.</p>
        <p className="note">Việc cấp quyền phải do quản trị viên thực hiện, không được tự cấp trên giao diện.</p>
      </main>
    );
  }

  const [events, venues, accessibility] = await Promise.all([
    getJson<{ items: ManagedEvent[] }>('manage/events', token),
    getJson<{ items: ManagedVenue[] }>('manage/venues', token),
    getJson<{ items: AccessibilityFeature[] }>('manage/accessibility/options', token),
  ]);
  if (!events || !venues || !accessibility) {
    return <main className="container"><h1>Chưa tải được dữ liệu quản lý</h1>
      <p>Kiểm tra NestJS và PostgreSQL.</p></main>;
  }

  return (
    <main className="container">
      <Link href="/">← Trang sự kiện</Link>
      <header>
        <p className="eyebrow">MED-06 · QUẢN LÝ SỰ KIỆN</p>
        <h1>Quản lý sự kiện</h1>
        <p>Đang đăng nhập: {user.name} · {user.roles.map(labelRole).join(', ')}</p>
      </header>
      <OrganizerDashboard
        events={events.items}
        venues={venues.items}
        features={accessibility.items}
      />
    </main>
  );
}
