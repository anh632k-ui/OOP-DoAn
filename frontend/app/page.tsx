import Link from 'next/link';

type EventSummary = {
  id: string;
  title: string;
  description: string;
  sessionCount: number;
  nextSessionAt: string | null;
};

type HealthResponse = { status?: string; database?: string };
type EventsResponse = { items: EventSummary[] };

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

async function loadEvents(): Promise<EventSummary[] | null> {
  try {
    const response = await fetch(`${api}/api/events`, {
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

function formatDate(value: string | null): string {
  if (!value) return 'Chưa có lịch';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

export default async function Home() {
  const [connected, events] = await Promise.all([checkBackend(), loadEvents()]);

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
