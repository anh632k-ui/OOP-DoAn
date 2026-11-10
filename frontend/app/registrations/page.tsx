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
type Tab = 'confirmed' | 'pending' | 'history';

function groupOf(item: Registration): Tab {
  if (item.status === 'DA_XAC_NHAN') {
    return item.ticketStatus === 'DA_SU_DUNG' || item.ticketStatus === 'VO_HIEU'
      ? 'history' : 'confirmed';
  }
  if (item.status === 'CHO_PHAN_BO' || item.status === 'DANH_SACH_CHO') return 'pending';
  return 'history';
}

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const response = await getAuthenticated<Response>('registrations/mine');
  if (!response) redirect('/account/login');
  const params = await searchParams;

  const groups: Record<Tab, Registration[]> = {
    confirmed: [], pending: [], history: [],
  };
  for (const item of response.items) groups[groupOf(item)].push(item);
  const tabs: { key: Tab; title: string }[] = [
    { key: 'confirmed', title: 'Đã xác nhận' },
    { key: 'pending', title: 'Đang chờ' },
    { key: 'history', title: 'Lịch sử' },
  ];
  const requested = params.tab;
  const active: Tab = requested === 'confirmed' || requested === 'pending' || requested === 'history'
    ? requested : groups.confirmed.length ? 'confirmed' : groups.pending.length ? 'pending' : 'history';
  const content = groups[active];

  return (
    <main id="main-content" className="container registrations-page">
      <Link href="/account" className="back-link">← Tài khoản</Link>
      <header>
        <p className="eyebrow">MED-06 · HOẠT ĐỘNG CỦA TÔI</p>
        <h1>Đăng ký của tôi</h1>
        <p>Theo dõi kết quả, vị trí chờ và những lượt đăng ký đã kết thúc.</p>
      </header>

      <nav className="wallet-tabs" aria-label="Lọc đăng ký theo trạng thái">
        {tabs.map(tab => (
          <Link key={tab.key} href={`/registrations?tab=${tab.key}`}
            className={active === tab.key ? 'wallet-tab active' : 'wallet-tab'}
            aria-current={active === tab.key ? 'page' : undefined}>
            {tab.title} <span>{groups[tab.key].length}</span>
          </Link>
        ))}
      </nav>

      <div className="registration-content-grid">
      <section className="panel wallet-panel" aria-live="polite">
        {content.length === 0 ? (
          <div className="wallet-empty">
            <h2>Chưa có đăng ký trong mục này</h2>
            <p>{active === 'pending'
              ? 'Khi một đăng ký đang chờ kết quả hoặc danh sách chờ, thông tin sẽ hiển thị ở đây.'
              : active === 'confirmed'
                ? 'Khi nhận được vé, lượt đăng ký sẽ được hiển thị tại đây.'
                : 'Các lượt đã hủy, không được cấp vé hoặc đã hoàn tất sẽ xuất hiện tại đây.'}</p>
            <Link href="/#su-kien">Khám phá sự kiện <span aria-hidden="true">↗</span></Link>
          </div>
        ) : (
          <ul className="registration-cards">
            {content.map(item => (
              <li className="registration-card" key={item.id}>
                <div className="registration-card-top">
                  <div>
                    <h2>{item.eventTitle}</h2>
                    <p>{formatVietnamDate(item.startsAt, 'short')} · Giờ Hà Nội (UTC+7)</p>
                  </div>
                  <span className="registration-card-status">{labelStatus(item.status)}</span>
                </div>
                <ScheduleNotice previousStartsAt={item.previousStartsAt}
                  scheduleChangedAt={item.scheduleChangedAt}
                  scheduleChangeReason={item.scheduleChangeReason}/>
                {item.waitingStatus === 'DANG_CHO' && item.waitingPosition != null && (
                  <p className="registration-wait">Vị trí trong danh sách chờ: <strong>{item.waitingPosition}</strong></p>
                )}
                {item.status === 'CHO_PHAN_BO' && (
                  <p className="note">Yêu cầu đã được tiếp nhận. Kết quả cấp vé sẽ có sau khi kết thúc đăng ký.</p>
                )}
                {item.ticketStatus && (
                  <p className="note">Vé: <strong>{labelStatus(item.ticketStatus)}</strong></p>
                )}
                <div className="registration-card-actions">
                  {item.ticketStatus === 'CHUA_SU_DUNG' && (
                    <Link className="button-secondary" href="/tickets">Xem vé của tôi <span aria-hidden="true">↗</span></Link>
                  )}
                  {!['DA_HUY', 'TU_CHOI'].includes(item.status)
                    && item.ticketStatus !== 'DA_SU_DUNG'
                    && new Date(item.startsAt).getTime() > Date.now()
                    && <CancelButton id={item.id}/>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <aside className="registration-state-guide" aria-label="Giải thích trạng thái đăng ký">
        <h2>Trạng thái cần biết</h2>
        <dl>
          <div><dt><span className="state-dot confirmed"/>Đã xác nhận</dt>
            <dd>Đã có vé hợp lệ, xuất trình QR tại cổng.</dd></div>
          <div><dt><span className="state-dot pending"/>Chờ phân bổ</dt>
            <dd>Đăng ký đã được ghi nhận, đang đợi kết quả cấp vé.</dd></div>
          <div><dt><span className="state-dot waiting"/>Danh sách chờ</dt>
            <dd>Chờ bổ sung vé khi có chỗ trống.</dd></div>
          <div><dt><span className="state-dot canceled"/>Đã hủy / từ chối</dt>
            <dd>Đăng ký chỉ còn trong lịch sử và không có vé sử dụng.</dd></div>
        </dl>
        <Link href="/registrations?tab=history">Xem lịch sử đăng ký →</Link>
      </aside>
      </div>
    </main>
  );
}
