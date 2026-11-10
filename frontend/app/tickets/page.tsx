import Link from 'next/link';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import BackupCode from './backup-code';
import ScheduleNotice from '../components/schedule-notice';
import { getAuthenticated } from '../../lib/backend';
import { formatVietnamDate } from '../../lib/vietnam-time';
import { labelStatus } from '../../lib/status-label';

export const dynamic = 'force-dynamic';

type Ticket = {
  id: string; sessionId: string; code: string; status: string;
  eventTitle: string; startsAt: string; endsAt: string;
  venue: string; address: string;
  previousStartsAt: string | null;
  scheduleChangedAt: string | null;
  scheduleChangeReason: string | null;
};
type Response = { items: Ticket[] };
type Tab = 'active' | 'history';

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const response = await getAuthenticated<Response>('tickets/mine');
  if (!response) redirect('/account/login');
  const params = await searchParams;
  const now = Date.now();
  const tickets = await Promise.all(response.items.map(async ticket => {
    const usable = ticket.status === 'CHUA_SU_DUNG'
      && new Date(ticket.endsAt).getTime() >= now;
    return {
      ...ticket, usable,
      qr: usable ? await QRCode.toDataURL(ticket.code, { margin: 2, width: 240 }) : null,
    };
  }));
  const groups = {
    active: tickets.filter(ticket => ticket.usable),
    history: tickets.filter(ticket => !ticket.usable),
  };
  const active: Tab = params.tab === 'history' || params.tab === 'active'
    ? params.tab : groups.active.length ? 'active' : 'history';

  return (
    <main id="main-content" className="container tickets-page">
      <Link href="/account" className="back-link">← Tài khoản</Link>
      <header>
        <p className="eyebrow">MED-06 · VÉ THAM DỰ</p>
        <h1>Ví vé của tôi</h1>
        <p>Giữ vé trong một nơi, sẵn sàng xuất trình khi đến sự kiện.</p>
      </header>
      <p className="ticket-security-note">Mã QR là thông tin riêng của vé.
        Không chia sẻ mã với người khác. Mỗi vé chỉ được check-in một lần.</p>

      <nav className="wallet-tabs" aria-label="Lọc vé theo trạng thái">
        <Link href="/tickets?tab=active"
          className={active === 'active' ? 'wallet-tab active' : 'wallet-tab'}
          aria-current={active === 'active' ? 'page' : undefined}>
          Vé còn hiệu lực <span>{groups.active.length}</span>
        </Link>
        <Link href="/tickets?tab=history"
          className={active === 'history' ? 'wallet-tab active' : 'wallet-tab'}
          aria-current={active === 'history' ? 'page' : undefined}>
          Đã sử dụng / hết hạn <span>{groups.history.length}</span>
        </Link>
      </nav>

      {groups[active].length === 0 ? (
        <section className="panel state-message wallet-empty">
          <h2>Chưa có vé trong mục này</h2>
          <p>{active === 'active'
            ? 'Khi được cấp vé hợp lệ, mã QR sẽ xuất hiện tại đây.'
            : 'Vé đã qua sử dụng, hết hạn hoặc bị vô hiệu sẽ được lưu tại đây.'}</p>
          <Link className="button-primary" href="/#su-kien">
            Khám phá sự kiện <span aria-hidden="true">↗</span>
          </Link>
        </section>
      ) : (
        <div className="ticket-wallet">
          {groups[active].map(ticket => (
            <article className="ticket-pass" key={ticket.id}>
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
                    <strong className="ticket-status">
                      {ticket.usable ? 'Có thể xuất trình' : ticket.status === 'CHUA_SU_DUNG'
                        ? 'Đã qua thời gian sử dụng' : labelStatus(ticket.status)}
                    </strong>
                  </div>
                  <ScheduleNotice previousStartsAt={ticket.previousStartsAt}
                    scheduleChangedAt={ticket.scheduleChangedAt}
                    scheduleChangeReason={ticket.scheduleChangeReason}/>
                  {ticket.status === 'DA_SU_DUNG' &&
                    <p className="success-note">Vé đã check-in thành công.</p>}
                  {ticket.status === 'VO_HIEU' &&
                    <p className="form-error">Vé đã bị vô hiệu.</p>}
                </div>
                <div className="ticket-pass-qr">
                  {ticket.qr ? <>
                    <img src={ticket.qr} alt="Mã QR vé điện tử để nhân viên quét"
                      width={220} height={220}/>
                    <span>QUÉT TẠI CỔNG VÀO</span>
                  </> : (
                    <div className="ticket-pass-inactive">
                      <span>QR không còn hiệu lực</span>
                      <p>{ticket.status === 'CHUA_SU_DUNG'
                        ? 'Suất đã kết thúc' : labelStatus(ticket.status)}</p>
                    </div>
                  )}
                </div>
              </div>
              {ticket.qr && <BackupCode code={ticket.code}/>}
              <div className="ticket-pass-footer">
                <span>Vé điện tử · MED-06</span><span>Giờ Hà Nội (UTC+7)</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
