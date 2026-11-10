import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticated } from '../../lib/backend';

export const dynamic = 'force-dynamic';
type User = { name: string; roles: string[] };
type Overview = {
  users: number; events: number; sessions: number;
  pendingRequests: number; auditEntries: number;
};
type AuditEntry = {
  id: string; action: string; actorName: string | null; createdAt: string;
};
type RecentAudit = { items: AuditEntry[] };
const sections = [
  {
    path: '/admin/users', tag: '01 · TÀI KHOẢN',
    title: 'Người dùng & phân quyền',
    description: 'Tìm kiếm, cấp quyền, khóa và mở khóa tài khoản.',
  },
  {
    path: '/admin/organizer', tag: '02 · SỰ KIỆN',
    title: 'Sự kiện & suất tổ chức',
    description: 'Theo dõi chương trình, thời gian và các chính sách phân bổ.',
  },
  {
    path: '/admin/audit', tag: '03 · NHẬT KÝ',
    title: 'Nhật ký hệ thống',
    description: 'Tra cứu các thao tác cấp vé, check-in và phân quyền.',
  },
  {
    path: '/admin/checkin', tag: '04 · VẬN HÀNH',
    title: 'Giám sát Check-in',
    description: 'Kiểm tra vé và số lượt ra vào tại những suất được phân quyền.',
  },
];
const auditLabels: Record<string, string> = {
  CAP_NHAT_VAI_TRO: 'Cập nhật vai trò',
  CAP_NHAT_TRANG_THAI_TAI_KHOAN: 'Thay đổi trạng thái tài khoản',
  YEU_CAU_TO_CHUC: 'Yêu cầu làm Ban tổ chức',
  DUYET_YEU_CAU_TO_CHUC: 'Xét duyệt Ban tổ chức',
  PHAN_BO_LOTTERY: 'Phân bổ vé bốc thăm',
  DANG_KY_FCFS_DUOC_VE: 'Cấp vé theo thứ tự',
  DANG_KY_CHO_LOTTERY: 'Nhận đăng ký chờ bốc thăm',
  DANG_KY_VAO_DANH_SACH_CHO: 'Tham gia danh sách chờ',
  CHECKIN_THANH_CONG: 'Check-in thành công',
  CHECKIN_TU_CHOI: 'Từ chối check-in',
  HUY_DANG_KY: 'Hủy đăng ký',
  HUY_SUAT: 'Hủy suất',
  HUY_SU_KIEN: 'Hủy sự kiện',
};

export default async function AdminPage() {
  const user = await getAuthenticated<User>('auth/me');
  if (!user) redirect('/account/login');
  if (!user.roles.includes('ADMIN')) redirect('/account');

  const [overview, audit] = await Promise.all([
    getAuthenticated<Overview>('admin/overview'),
    getAuthenticated<RecentAudit>('admin/audit?page=1'),
  ]);
  const metrics = [
    { label: 'Người dùng', value: overview?.users, detail: 'Tài khoản trong hệ thống' },
    { label: 'Sự kiện', value: overview?.events, detail: 'Tất cả trạng thái' },
    { label: 'Suất tổ chức', value: overview?.sessions, detail: 'Trên toàn hệ thống' },
    { label: 'Chờ xét duyệt', value: overview?.pendingRequests,
      detail: 'Yêu cầu Ban tổ chức', href: '/admin/requests' },
  ];

  return <main id="main-content" className="container admin-dashboard">
    <header className="admin-dashboard-intro">
      <p className="eyebrow">ADMIN / DASHBOARD HỆ THỐNG</p>
      <h1>Trung tâm quản trị</h1>
      <p>Theo dõi tài khoản, sự kiện và các hoạt động quan trọng. Mọi số liệu được lấy từ hệ thống.</p>
    </header>

    <section className="admin-dashboard-overview" aria-labelledby="admin-overview-title">
      <h2 id="admin-overview-title">Tổng quan hệ thống</h2>
      <div className="admin-dashboard-metrics">
        {metrics.map(item => <div key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value === undefined ? '—' : item.value.toLocaleString('vi-VN')}</strong>
          <small>{item.detail}</small>
          {'href' in item && item.href && <Link href={item.href}>Xem yêu cầu →</Link>}
        </div>)}
      </div>
      {!overview && <p className="note" role="status">
        Chưa tải được thống kê từ máy chủ; không hiển thị dữ liệu minh họa.
      </p>}
    </section>

    <section className="admin-dashboard-section" aria-labelledby="admin-modules-title">
      <div className="admin-dashboard-section-heading">
        <div>
          <p className="eyebrow">KHU VỰC QUẢN TRỊ</p>
          <h2 id="admin-modules-title">Công cụ quản lý</h2>
        </div>
        <Link href="/admin/requests" className="button-secondary">Duyệt yêu cầu tổ chức →</Link>
      </div>
      <div className="admin-dashboard-grid">
        {sections.map(item => <Link key={item.path} href={item.path}
          className="admin-dashboard-card">
          <span>{item.tag}</span>
          <strong>{item.title}</strong>
          <p>{item.description}</p>
          <b aria-hidden="true">↗</b>
        </Link>)}
      </div>
    </section>

    <section className="admin-recent-section panel" aria-labelledby="recent-heading">
      <div className="admin-recent-heading">
        <div>
          <p className="eyebrow">THEO DÕI HOẠT ĐỘNG</p>
          <h2 id="recent-heading">Nhật ký thao tác gần đây</h2>
        </div>
        <Link href="/admin/audit">Xem tất cả →</Link>
      </div>
      {audit === null ? <p role="status">Chưa tải được nhật ký.</p>
        : audit.items.length === 0 ? <p className="note">Chưa có thao tác nào được ghi nhận.</p>
        : <ul className="admin-recent-list">
          {audit.items.slice(0, 5).map(item => <li key={item.id}>
            <strong>{auditLabels[item.action] ?? 'Thao tác hệ thống'}</strong>
            <span>{item.actorName ?? 'Hệ thống'}</span>
            <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('vi-VN', {
              timeZone: 'Asia/Ho_Chi_Minh',
            })}</time>
          </li>)}
        </ul>}
    </section>
  </main>;
}
