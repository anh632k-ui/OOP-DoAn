import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticated } from '../../lib/backend';
import CancelButton from './cancel-button';
import ScheduleNotice from '../components/schedule-notice';
import { formatVietnamDate } from '../../lib/vietnam-time';
import { labelStatus } from '../../lib/status-label';

export const dynamic = 'force-dynamic';

type Registration = {
  id: string; sessionId: string; eventTitle: string;
  startsAt: string; status: string; waitingPosition: number | null;
  waitingStatus: string | null; ticketStatus: string | null;
  previousStartsAt: string | null;
  scheduleChangedAt: string | null;
  scheduleChangeReason: string | null;
};
type Response = { items: Registration[] };

export default async function RegistrationsPage() {
  const result = await getAuthenticated<Response>('registrations/mine');
  if (!result) redirect('/account/login');

  return <main className="container">
    <Link href="/account">← Tài khoản</Link>
    <header><p className="eyebrow">MED-06 · ĐĂNG KÝ</p>
      <h1>Đăng ký suất của tôi</h1></header>
    <section className="panel">
      {!result.items.length ? <p>Chưa có đăng ký nào.
        {' '}<Link href="/">Khám phá sự kiện</Link></p>
        : <ul className="event-list">{result.items.map(item =>
          <li className="event-item" key={item.id}>
            <h2>{item.eventTitle}</h2>
            <p>{formatVietnamDate(item.startsAt, 'short')}</p>
            <p>Trạng thái: <strong>{labelStatus(item.status)}</strong></p>
            <ScheduleNotice previousStartsAt={item.previousStartsAt}
              scheduleChangedAt={item.scheduleChangedAt}
              scheduleChangeReason={item.scheduleChangeReason}/>
            {item.waitingStatus === 'DANG_CHO' && (
              <p>Thứ tự danh sách chờ: {item.waitingPosition}</p>
            )}
            {item.ticketStatus && <p>Trạng thái vé: {labelStatus(item.ticketStatus)}
              {' · '}<Link href="/tickets">Xem vé điện tử</Link></p>}
            {!['DA_HUY','TU_CHOI'].includes(item.status)
              && <CancelButton id={item.id}/>}
          </li>
        )}</ul>}
    </section>
  </main>;
}
