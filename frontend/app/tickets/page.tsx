import Link from 'next/link';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { getAuthenticated } from '../../lib/backend';

export const dynamic = 'force-dynamic';

type Ticket = {
  id: string; sessionId: string; code: string; status: string;
  eventTitle: string; startsAt: string; venue: string; address: string;
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

  return <main className="container">
    <Link href="/account">← Tài khoản</Link>
    <header><p className="eyebrow">MED-06 · VÉ MIỄN PHÍ</p>
      <h1>Vé điện tử của tôi</h1></header>
    <p className="note">Không chia sẻ ảnh mã QR với người khác. Mỗi vé chỉ có thể check-in một lần.</p>
    {tickets.length === 0 ? (
      <section className="panel"><p>Bạn chưa có vé nào.</p>
        <Link href="/">Xem sự kiện</Link></section>
    ) : tickets.map(ticket => (
      <section className="panel ticket-card" key={ticket.id}>
        <h2>{ticket.eventTitle}</h2>
        <p>{new Date(ticket.startsAt).toLocaleString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
        })}</p>
        <p>{ticket.venue} · {ticket.address}</p>
        <p>Trạng thái: <strong>{ticket.status}</strong></p>
        {ticket.qr && <div>
          <img src={ticket.qr} alt="Mã QR vé điện tử để nhân viên quét" width={240} height={240} />
          <p className="note">Mã dự phòng (chỉ cung cấp cho nhân viên check-in):</p>
          <code className="ticket-code">{ticket.code}</code>
        </div>}
        {ticket.status === 'DA_SU_DUNG' && <p>Vé đã check-in thành công.</p>}
        {ticket.status === 'VO_HIEU' && <p>Vé này đã bị vô hiệu.</p>}
      </section>
    ))}
  </main>;
}
