import Link from 'next/link';
import { formatVietnamDate } from '../lib/vietnam-time';
import { getAuthenticated } from '../lib/backend';

type EventSummary = {
  id: string;
  title: string;
  description: string;
  status: string;
  sessionCount: number;
  nextSessionAt: string | null;
  hasCover: boolean;
};

type CurrentUser = { name: string; roles: string[] };
type EventsResponse = { items: EventSummary[] };
type FeaturesResponse = { items: { id: string; name: string }[] };

export const dynamic = 'force-dynamic';

const api = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';

async function loadEvents(q: string, featureId: string): Promise<EventSummary[] | null> {
  try {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (featureId) params.set('featureId', featureId);
    const response = await fetch(`${api}/api/events?${params.toString()}`, {
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

async function getFeatures(): Promise<FeaturesResponse> {
  try {
    const response = await fetch(`${api}/api/events/accessibility/options`, {
      cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
    if (response.ok) return (await response.json()) as FeaturesResponse;
  } catch { /* no filters when API is temporarily unavailable */ }
  return { items: [] };
}

const formatDate = (value: string | null) => formatVietnamDate(value);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; featureId?: string }>;
}) {
  const filters = await searchParams;
  const q = typeof filters.q === 'string' ? filters.q.trim().slice(0, 100) : '';
  const featureId = typeof filters.featureId === 'string' ? filters.featureId : '';
  const [events, features, currentUser] = await Promise.all([
    loadEvents(q, featureId), getFeatures(), getAuthenticated<CurrentUser>('auth/me'),
  ]);

  return <main id="main-content" className="home-page">
    <section className="hero-section" aria-labelledby="home-title">
      <div className="hero-content">
        <p className="hero-kicker"><span className="hero-kicker-dot"/> CỔNG SỰ KIỆN VĂN HÓA · MED-06</p>
        <h1 id="home-title">Chạm vào<br/><em>văn hóa.</em><br/>Kết nối mọi người.</h1>
        <p className="hero-description">
          Khám phá triển lãm, âm nhạc và những trải nghiệm văn hóa đặc sắc.
          Gửi yêu cầu tham dự miễn phí và nhận vé điện tử khi được xác nhận.
        </p>
        <div className="hero-actions">
          <a href="#su-kien" className="button-primary">Khám phá sự kiện <span aria-hidden="true">↗</span></a>
          <a href="#huong-dan" className="button-secondary">Cách tham gia <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-details" aria-label="Thông tin sử dụng">
          <span><strong>100%</strong> vé miễn phí</span>
          <span className="hero-details-separator" aria-hidden="true"/>
          <span><strong>QR</strong> check-in nhanh</span>
          <span className="hero-details-separator" aria-hidden="true"/>
          <span><strong>UTC+7</strong> giờ Hà Nội</span>
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="hero-art-glow"/>
        <div className="hero-art-top"><span>MED·06 / CULTURE</span><span>2026</span></div>
        <div className="hero-art-figure">
          <span className="hero-ring hero-ring-one"/><span className="hero-ring hero-ring-two"/>
          <span className="hero-sun"/><span className="hero-wave hero-wave-one"/><span className="hero-wave hero-wave-two"/>
        </div>
        <div className="hero-art-bottom">
          <span>THƯỞNG THỨC<br/>VĂN HÓA</span>
          <span>FREE<br/>ENTRY</span>
        </div>
      </div>
    </section>

    <section id="su-kien" className="discover-section" aria-labelledby="event-list">
      <div className="section-heading">
        <div>
          <p className="section-kicker">SỰ KIỆN ĐANG DIỄN RA & SẮP TỚI</p>
          <h2 id="event-list">Khám phá <em>sự kiện</em></h2>
          <p>Tìm một trải nghiệm phù hợp và dành chỗ cho mình.</p>
        </div>
        <span className="heading-ornament" aria-hidden="true">✳</span>
      </div>

      <form method="GET" className="discover-search" role="search">
        <label className="search-query">
          <span>Tìm theo tên hoặc nội dung</span>
          <input type="search" name="q" defaultValue={q}
            placeholder="Nhập tên sự kiện, ví dụ: di sản..." maxLength={100}/>
        </label>
        <label className="search-accessibility">
          <span>Đặc tính tiếp cận</span>
          <select name="featureId" defaultValue={featureId}>
            <option value="">Tất cả các sự kiện</option>
            {features.items.map(feature =>
              <option key={feature.id} value={feature.id}>{feature.name}</option>)}
          </select>
        </label>
        <button type="submit" className="button-primary">Tìm sự kiện <span aria-hidden="true">→</span></button>
      </form>

      {events === null ? <div className="state-message" role="status">
        <strong>Chưa thể tải danh sách sự kiện</strong>
        <p>Vui lòng thử tải lại trang. Nếu tình trạng tiếp diễn, hãy kiểm tra kết nối máy chủ.</p>
      </div> : events.length === 0 ? <div className="state-message" role="status">
        <strong>Chưa tìm thấy sự kiện phù hợp</strong>
        <p>Hãy thử một từ khóa khác hoặc chọn lại bộ lọc.</p>
        <Link href="/#su-kien">Xem tất cả sự kiện</Link>
      </div> : (
        <ul className="discover-grid">
          {events.map((event,index) => (
            <li key={event.id} className="discover-card">
              <Link href={'/events/' + event.id} className="discover-card-link"
                aria-label={'Xem chi tiết ' + event.title}>
                <div className={'discover-poster poster-' + (index % 4)}>
                  {event.hasCover ? (
                    <img className="discover-cover-photo"
                      src={'/api/event-cover/' + event.id} width={420} height={320}
                      loading="lazy" alt={'Ảnh sự kiện ' + event.title}/>
                  ) : <>
                    <span className="discover-poster-label">MED · 06</span>
                    <span className="poster-graphic" aria-hidden="true"/>
                    <span className="discover-poster-bottom">SỰ KIỆN VĂN HÓA</span>
                  </>}
                </div>
                <div className="discover-card-body">
                  <span className="event-category"><span aria-hidden="true">●</span> {event.status === 'TAM_NGUNG' ? 'Tạm ngưng đăng ký' : 'Vé miễn phí'}</span>
                  <h3>{event.title}</h3>
                  <p className="discover-description">{event.description}</p>
                  <div className="discover-card-meta">
                    <span>{event.sessionCount} suất tổ chức</span>
                    <span>{formatDate(event.nextSessionAt)}</span>
                  </div>
                  <span className="discover-link">Xem chi tiết <span aria-hidden="true">↗</span></span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>

    <section id="huong-dan" className="steps-section" aria-labelledby="steps-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">CHỈ VỚI 3 BƯỚC</p>
          <h2 id="steps-title">Tham gia <em>thật dễ dàng</em></h2>
        </div>
      </div>
      <div className="steps-grid">
        <article><span className="step-number">01</span><h3>Khám phá</h3>
          <p>Chọn sự kiện văn hóa và xem suất tổ chức, địa điểm, thời gian phù hợp.</p></article>
        <article><span className="step-number">02</span><h3>Đăng ký miễn phí</h3>
          <p>Chọn thời gian phù hợp và gửi đăng ký. Kết quả được xác nhận ngay hoặc sau hạn đăng ký tùy từng suất.</p></article>
        <article><span className="step-number">03</span><h3>Nhận vé & check-in</h3>
          <p>Khi được cấp vé, xuất trình QR tại cổng. Mỗi vé chỉ check-in một lần.</p></article>
      </div>
    </section>

    <section className="join-section">
      <div>
        <p className="section-kicker">CÙNG THAM GIA</p>
        <h2>Hẹn gặp bạn tại<br/><em>sự kiện tiếp theo.</em></h2>
        <p>Vé miễn phí. Trải nghiệm văn hóa đáng nhớ.</p>
      </div>
      <Link href={currentUser ? '/account' : '/account/register'}
        className="button-primary">{currentUser ? 'Tài khoản của tôi' : 'Tạo tài khoản miễn phí'} <span aria-hidden="true">↗</span></Link>
    </section>
  </main>;
}
