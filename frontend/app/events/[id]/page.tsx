import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type EventDetail = { id: string; title: string; description: string; accessibility: { name: string; note: string }[] };
type Session = {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  issuedSeats: number;
  status: string;
  allocationMethod: string | null;
  venue: string;
  address: string;
};
type SessionsResponse = { items: Session[] };

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';

async function loadEvent(id: string): Promise<EventDetail | null> {
  try {
    const response = await fetch(`${api}/api/events/${id}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return (await response.json()) as EventDetail;
  } catch {
    return null;
  }
}

async function loadSessions(id: string): Promise<Session[]> {
  try {
    const response = await fetch(`${api}/api/events/${id}/sessions`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return [];
    return ((await response.json()) as SessionsResponse).items ?? [];
  } catch {
    return [];
  }
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(date));
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) notFound();

  const [event, sessions] = await Promise.all([loadEvent(id), loadSessions(id)]);
  if (!event) notFound();

  return (
    <main className="container">
      <Link href="/">← Danh sách sự kiện</Link>
      <header>
        <p className="eyebrow">MED-06 · THÔNG TIN SỰ KIỆN</p>
        <h1>{event.title}</h1>
        <p>{event.description}</p>
      </header>

      <section className="panel" aria-labelledby="accessibility-heading">
        <h2 id="accessibility-heading">Khả năng tiếp cận</h2>
        {event.accessibility?.length ? (
          <ul>
            {event.accessibility.map((item, index) => (
              <li key={index}>{item.name}{item.note ? ` — ${item.note}` : ''}</li>
            ))}
          </ul>
        ) : (
          <p className="note">Chưa có đặc tính tiếp cận được xác nhận.</p>
        )}
      </section>

      <section className="panel" aria-labelledby="sessions-heading">
        <h2 id="sessions-heading">Các suất tổ chức</h2>
        {sessions.length === 0 ? (
          <p>Chưa có suất được công bố.</p>
        ) : (
          <ul className="event-list">
            {sessions.map((session) => (
              <li key={session.id} className="event-item">
                <h3>{formatDate(session.startsAt)}</h3>
                <p>{session.venue} · {session.address}</p>
                <p>
                  Sức chứa: {session.capacity} · Đã cấp: {session.issuedSeats}
                  {' '}· Phân bổ: {session.allocationMethod ?? 'Chưa cấu hình'}
                </p>
                <p className="note">Trạng thái: {session.status}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="note">
          Chức năng đăng ký và nhận vé sẽ được triển khai ở giai đoạn tiếp theo.
        </p>
      </section>
    </main>
  );
}
