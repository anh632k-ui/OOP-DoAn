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

  return <main id="main-content" className="container detail-page">
    <Link href="/#su-kien" className="back-link">← Tất cả sự kiện</Link>
    <section className="event-detail-hero" aria-labelledby="event-title">
      <div className="event-detail-copy">
        <p className="eyebrow">MED-06 · TRẢI NGHIỆM VĂN HÓA</p>
        <p className="event-type-tag">● Sự kiện miễn phí</p>
        <h1 id="event-title">{event.title}</h1>
        <p className="event-lead">{event.description}</p>
        <div className="detail-facts">
          <span><strong>{sessions.length}</strong> suất tổ chức</span>
          <span><strong>QR</strong> vé điện tử</span>
          <span><strong>UTC+7</strong> Hà Nội</span>
        </div>
        <a href="#cac-suat" className="button-primary detail-action">
          Chọn suất tham dự <span aria-hidden="true">↓</span>
        </a>
      </div>
      <div className="event-detail-art">
        {event.hasCover ?
          <img className="event-detail-photo" alt={'Ảnh giới thiệu ' + event.title}
            src={'/api/event-cover/' + event.id} width={720} height={520}/> :
          <div className="event-detail-placeholder" aria-hidden="true">
            <span className="detail-art-orbit"/><span className="detail-art-circle"/>
            <span className="detail-art-label">MED·06<br/>VĂN HÓA</span>
          </div>}
      </div>
    </section>

    <div className="detail-content-grid">
      <section id="cac-suat" className="panel session-section" aria-labelledby="sessions-heading">
        <div className="detail-section-heading">
          <p className="section-kicker">CHỌN THỜI GIAN PHÙ HỢP</p>
          <h2 id="sessions-heading">Các suất tổ chức</h2>
          <p className="note">Ngày giờ hiển thị theo giờ Hà Nội (UTC+7).</p>
        </div>
        {sessions.length === 0 ?
          <p className="state-message">Chưa có suất được công bố.</p> :
          <ul className="detail-session-list">
            {sessions.map((session, index) =>
              <li key={session.id} className="detail-session">
                <div className="detail-session-heading">
                  <span className="session-number">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{formatDate(session.startsAt)}</h3>
                    <span className="detail-session-status">{labelStatus(session.status)}</span>
                  </div>
                </div>
                <div className="detail-session-metadata">
                  <p><strong>Địa điểm</strong><span>{session.venue} · {session.address}</span></p>
                  <p><strong>Sức chứa</strong><span>{session.capacity} chỗ · Đã cấp {session.issuedSeats} vé</span></p>
                  <p><strong>Phân bổ vé</strong><span>{session.allocationMethod === 'FCFS'
                    ? 'Theo thứ tự đăng ký (FCFS)' : session.allocationMethod === 'LOTTERY'
                    ? 'Bốc thăm công bằng (Lottery)' : 'Chưa cấu hình'}</span></p>
                </div>
                <ScheduleNotice
                  previousStartsAt={session.previousStartsAt}
                  scheduleChangedAt={session.scheduleChangedAt}
                  scheduleChangeReason={session.scheduleChangeReason}/>
                <p className="note session-registration-window">
                  Thời gian đăng ký: {formatDate(session.registrationOpensAt)}
                  {' '}– {formatDate(session.registrationClosesAt)}
                </p>
                <div className="detail-session-actions">
                  <SessionRegisterButton sessionId={session.id} method={session.allocationMethod}
                    available={Date.now() >= new Date(session.registrationOpensAt).getTime()
                      && Date.now() < new Date(session.registrationClosesAt).getTime()
                      && new Date(session.startsAt).getTime() > Date.now()
                      && session.status !== 'DA_HUY'}/>
                </div>
              </li>)}
          </ul>}
      </section>

      <aside className="detail-sidebar">
        <section className="panel accessibility-panel" aria-labelledby="accessibility-heading">
          <span className="sidebar-icon" aria-hidden="true">✳</span>
          <h2 id="accessibility-heading">Khả năng tiếp cận</h2>
          <p className="note">Thông tin được ban tổ chức xác nhận.</p>
          {event.accessibility?.length ?
            <ul>{event.accessibility.map((item, index) =>
              <li key={index}><strong>{item.name}</strong>
                {item.note && <p>{item.note}</p>}</li>)}</ul> :
            <p>Chưa có đặc tính tiếp cận được xác nhận.</p>}
        </section>
        <section className="detail-guidance">
          <p className="eyebrow">THÔNG TIN VÉ</p>
          <h3>Một suất, một lượt đăng ký.</h3>
          <p>Mỗi tài khoản chỉ có một đăng ký còn hiệu lực cho mỗi suất.
            Nếu nhận được vé, bạn xuất trình QR khi vào cổng.</p>
          <Link href="/account">Xem tài khoản <span aria-hidden="true">↗</span></Link>
        </section>
      </aside>
    </div>
  </main>;
}
