import Link from 'next/link';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import ScheduleNotice from '../components/schedule-notice';
import { getAuthenticated } from '../../lib/backend';
import { formatVietnamDate } from '../../lib/vietnam-time';
import { labelStatus } from '../../lib/status-label';

export const dynamic = 'force-dynamic';

type Ticket = {
  id: string; sessionId: string; code: string; status: string;
  eventTitle: string; startsAt: string; venue: string; address: string;
  previousStartsAt: string | null;
  scheduleChangedAt: string | null;
  scheduleChangeReason: string | null;
};
type Response = { items: Ticket[] };

export default async function TicketsPage() {
  const response = await getAuthenticated<Response>('tickets/mine');
  if (!response) redirect('/account/login');
  const tickets = await Promise.all(response.items.map(async ticket => ({
    ...ticket,
    qr: ticket.status === 'CHUA_SU_DUNG'
      ? await QRCode.toDataURL(ticket.code, { margin: 2, width: 240 }) : null,
  })));

  return <main id="main-content" className="container tickets-page">
    <Link href="/account" className="back-link">← Tài khoản</Link>
    <header>
      <p className="eyebrow">MED-06 · VÉ ĐIỆN TỬ MIỄN PHÍ</p>
      <h1>Vé của tôi</h1>
      <p>Giữ vé của bạn trong một nơi, sẵn sàng xuất trình khi tham dự sự kiện.</p>
    </header>
    <p className="ticket-security-note">Mã QR là thông tin riêng của vé.
      Không chia sẻ mã với người khác. Mỗi vé chỉ được check-in một lần.</p>
    {tickets.length === 0 ? <section className="panel state-message">
      <h2>Chưa có vé điện tử</h2>
      <p>Khám phá các suất miễn phí và đăng ký để bắt đầu.</p>
      <Link className="button-primary" href="/#su-kien">Xem sự kiện <span aria-hidden="true">↗</span></Link>
    </section> : <div className="ticket-wallet">
      {tickets.map(ticket => <article className="ticket-pass" key={ticket.id}>
        <div className="ticket-pass-heading">
          <span>MED·06 <small>VÉ THAM DỰ</small></span>
          <span>FREE ENTRY</span>
        </div>
        <div className="ticket-pass-main">
          <div className="ticket-pass-details">
            <span className="ticket-pass-kicker">SỰ KIỆN VĂN HÓA</span>
            <h2>{ticket.eventTitle}</h2>
            <div className="ticket-info-row">
              <span>Thời gian</span>
              <strong>{formatVietnamDate(ticket.startsAt, 'short')} · UTC+7</strong>
            </div>
            <div className="ticket-info-row">
              <span>Địa điểm</span>
              <strong>{ticket.venue}<small>{ticket.address}</small></strong>
            </div>
            <div className="ticket-info-row">
              <span>Trạng thái</span>
              <strong className="ticket-status">{labelStatus(ticket.status)}</strong>
            </div>
            <ScheduleNotice previousStartsAt={ticket.previousStartsAt}
              scheduleChangedAt={ticket.scheduleChangedAt}
              scheduleChangeReason={ticket.scheduleChangeReason}/>
            {ticket.status === 'DA_SU_DUNG' && <p className="success-note">Vé đã check-in thành công.</p>}
            {ticket.status === 'VO_HIEU' && <p className="form-error">Vé đã bị vô hiệu.</p>}
          </div>
          <div className="ticket-pass-qr">
            {ticket.qr ? <>
              <img src={ticket.qr} alt="Mã QR vé điện tử để nhân viên quét"
                width={220} height={220}/>
              <span>QUÉT TẠI CỔNG VÀO</span>
            </> : <div className="ticket-pass-inactive">
              <span>QR không còn hiệu lực</span>
              <p>{labelStatus(ticket.status)}</p>
            </div>}
          </div>
        </div>
        {ticket.qr && <details className="ticket-backup">
          <summary>Hiển thị mã dự phòng cho nhân viên check-in</summary>
          <code className="ticket-code">{ticket.code}</code>
        </details>}
        <div className="ticket-pass-footer">
          <span>Vé điện tử · MED-06</span><span>Giờ Hà Nội (UTC+7)</span>
        </div>
      </article>)}
    </div>}
  </main>;
}
