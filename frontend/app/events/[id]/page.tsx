import Link from 'next/link';
import { notFound } from 'next/navigation';
import SessionRegisterButton from './session-register-button';
import ScheduleNotice from '../../components/schedule-notice';
import { formatVietnamDate } from '../../../lib/vietnam-time';
import { labelStatus } from '../../../lib/status-label';

export const dynamic = 'force-dynamic';

type EventDetail = { id: string; title: string; description: string; hasCover: boolean; accessibility: { name: string; note: string }[] };
type Session = {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  issuedSeats: number;
  status: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  previousStartsAt: string | null;
  scheduleChangedAt: string | null;
  scheduleChangeReason: string | null;
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

const formatDate = (date: string) => formatVietnamDate(date, 'full');

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
        {event.hasCover && <img className="cover-image" alt={event.title}
          src={`/api/event-cover/${event.id}`} width={720} height={360}/>}
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
                <p className="note">Trạng thái: {labelStatus(session.status)}</p>
                <ScheduleNotice
                  previousStartsAt={session.previousStartsAt}
                  scheduleChangedAt={session.scheduleChangedAt}
                  scheduleChangeReason={session.scheduleChangeReason}
                />
                <p className="note">Đăng ký từ {formatDate(session.registrationOpensAt)}
                  {' '}đến {formatDate(session.registrationClosesAt)}</p>
                <SessionRegisterButton
                  sessionId={session.id}
                  method={session.allocationMethod}
                  available={Date.now() >= new Date(session.registrationOpensAt).getTime()
                    && Date.now() < new Date(session.registrationClosesAt).getTime()
                    && new Date(session.startsAt).getTime() > Date.now()
                    && session.status !== 'DA_HUY'}
                />
              </li>
            ))}
          </ul>
        )}
        <p className="note">
          Mỗi tài khoản chỉ được có một đăng ký còn hiệu lực cho một suất.
        </p>
      </section>
    </main>
  );
}
