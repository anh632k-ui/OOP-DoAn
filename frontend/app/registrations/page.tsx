import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticated } from '../../lib/backend';
import CancelButton from './cancel-button';

export const dynamic = 'force-dynamic';

type Registration = {
  id: string; sessionId: string; eventTitle: string;
  startsAt: string; status: string; waitingPosition: number | null;
  waitingStatus: string | null; ticketStatus: string | null;
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
            <p>{new Date(item.startsAt).toLocaleString('vi-VN', {
              timeZone: 'Asia/Ho_Chi_Minh',
            })}</p>
            <p>Trạng thái: <strong>{item.status}</strong></p>
            {item.waitingStatus === 'DANG_CHO' && (
              <p>Thứ tự danh sách chờ: {item.waitingPosition}</p>
            )}
            {item.ticketStatus && <p>Trạng thái vé: {item.ticketStatus}
              {' · '}<Link href="/tickets">Xem vé điện tử</Link></p>}
            {!['DA_HUY','TU_CHOI'].includes(item.status)
              && <CancelButton id={item.id}/>}
          </li>
        )}</ul>}
    </section>
  </main>;
}
