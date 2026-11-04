import Link from 'next/link';
import { formatVietnamDate } from '../lib/vietnam-time';

type EventSummary = {
  id: string;
  title: string;
  description: string;
  sessionCount: number;
  nextSessionAt: string | null;
};

type HealthResponse = { status?: string; database?: string };
type EventsResponse = { items: EventSummary[] };
type FeaturesResponse = { items: { id: string; name: string }[] };

export const dynamic = 'force-dynamic';

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';

async function checkBackend(): Promise<boolean> {
  try {
    const response = await fetch(`${api}/api/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as HealthResponse;
    return data.status === 'ok' && data.database === 'connected';
  } catch {
    return false;
  }
}

async function loadEvents(q: string, featureId: string): Promise<EventSummary[] | null> {
  try {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (featureId) params.set('featureId', featureId);
    const response = await fetch(`${api}/api/events?${params.toString()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as EventsResponse;
    return Array.isArray(data.items) ? data.items : null;
  } catch {
    return null;
  }
}

async function getFeatures(): Promise<FeaturesResponse> {
  try {
    const response = await fetch(`${api}/api/events/accessibility/options`, {
      cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
    if (response.ok) return (await response.json()) as FeaturesResponse;
  } catch { /* no filters when API is temporarily unavailable */ }
  return { items: [] };
}

const formatDate = (value: string | null) => formatVietnamDate(value);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; featureId?: string }>;
}) {
  const filters = await searchParams;
  const q = typeof filters.q === 'string' ? filters.q.trim().slice(0, 100) : '';
  const featureId = typeof filters.featureId === 'string' ? filters.featureId : '';
  const [connected, events, features] = await Promise.all([
    checkBackend(), loadEvents(q, featureId), getFeatures(),
  ]);

  return (
    <main className="container">
      <header>
        <p className="eyebrow">MED-06 · GIAI ĐOẠN 3</p>
        <h1>Cổng quản lý sự kiện văn hóa và vé miễn phí</h1>
        <p>Khám phá chương trình và những suất tổ chức miễn phí.</p>
        <nav className="auth-nav" aria-label="Tài khoản">
          <Link href="/account/login">Đăng nhập</Link>
          <Link href="/account/register">Đăng ký</Link>
          <Link href="/account">Tài khoản của tôi</Link>
          <Link href="/organizer">Quản lý sự kiện</Link>
          <Link href="/registrations">Đăng ký của tôi</Link>
          <Link href="/tickets">Vé của tôi</Link>
          <Link href="/checkin">Check-in</Link>
        </nav>
      </header>

      <section className="panel" aria-labelledby="system-status">
        <h2 id="system-status">Trạng thái hệ thống</h2>
        <p>
          <span className={connected ? 'status ok' : 'status error'}>
            {connected ? 'Đã kết nối' : 'Chưa kết nối'}
          </span>
          {' '}NestJS API và PostgreSQL
        </p>
      </section>

      <section className="panel" aria-labelledby="event-list">
        <h2 id="event-list">Sự kiện đã công bố</h2>
        <form method="GET" className="search-form" role="search">
          <label>Tìm kiếm tên hoặc mô tả
            <input type="search" name="q" defaultValue={q}
              placeholder="Ví dụ: di sản, dân gian" maxLength={100}/>
          </label>
          <label>Đặc tính tiếp cận đã xác nhận
            <select name="featureId" defaultValue={featureId}>
              <option value="">Tất cả</option>
              {features.items.map(feature => <option key={feature.id} value={feature.id}>
                {feature.name}
              </option>)}
            </select>
          </label>
          <button type="submit">Tìm sự kiện</button>
        </form>
        {events === null ? (
          <p role="status">Chưa tải được danh sách sự kiện. Kiểm tra backend.</p>
        ) : events.length === 0 ? (
          <p role="status">
            Chưa có sự kiện. Có thể nạp dữ liệu minh họa bằng lệnh
            {' '}<code>docker compose --profile seed run --rm seed</code>.
          </p>
        ) : (
          <ul className="event-list">
            {events.map((event) => (
              <li key={event.id} className="event-item">
                <h3>
                  <Link href={`/events/${event.id}`}>
                    {event.title}
                  </Link>
                </h3>
                <p>{event.description}</p>
                <p className="note">
                  {event.sessionCount} suất · Suất đầu tiên: {formatDate(event.nextSessionAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel" aria-labelledby="next-steps">
        <h2 id="next-steps">Chức năng tiếp theo</h2>
        <p>Tiếp theo: quản lý sự kiện, đăng ký suất, FCFS/Lottery và check-in.</p>
      </section>
    </main>
  );
}
