import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticated } from '../../lib/backend';

export const dynamic = 'force-dynamic';
type User = { name: string; roles: string[] };
type CountResponse = { total: number };

const sections = [
  {
    path: '/admin/users',
    tag: '01 · TÀI KHOẢN',
    title: 'Người dùng & phân quyền',
    description: 'Tra cứu thành viên, quản lý trạng thái và phân công vai trò.',
  },
  {
    path: '/admin/organizer',
    tag: '02 · SỰ KIỆN',
    title: 'Quản lý sự kiện',
    description: 'Tạo chương trình, thiết lập suất, sức chứa và chính sách phân bổ.',
  },
  {
    path: '/admin/checkin',
    tag: '03 · VẬN HÀNH',
    title: 'Kiểm tra vé',
    description: 'Truy cập công cụ quét QR và giám sát check-in của suất.',
  },
  {
    path: '/admin/audit',
    tag: '04 · KIỂM SOÁT',
    title: 'Nhật ký hệ thống',
    description: 'Xem hoạt động quan trọng và kiểm tra dấu vết thay đổi.',
  },
];

export default async function AdminPage() {
  const user = await getAuthenticated<User>('auth/me');
  if (!user) redirect('/account/login');
  if (!user.roles.includes('ADMIN')) redirect('/account');

  const [users, audits] = await Promise.all([
    getAuthenticated<CountResponse>('admin/users?page=1'),
    getAuthenticated<CountResponse>('admin/audit?page=1'),
  ]);

  return (
    <main id="main-content" className="container admin-dashboard">
      <header className="admin-dashboard-intro">
        <p className="eyebrow">MED-06 · TRUNG TÂM ĐIỀU HÀNH</p>
        <h1>Tổng quan quản trị</h1>
        <p>Chào {user.name}. Theo dõi hệ thống và truy cập từng khu vực quản lý từ đây.</p>
      </header>

      <section className="admin-dashboard-overview" aria-labelledby="admin-overview-title">
        <h2 id="admin-overview-title">Thông tin hệ thống</h2>
        <div className="admin-dashboard-metrics">
          <div><span>Tổng tài khoản</span><strong>{users ? users.total : '—'}</strong>
            <small>{users ? 'Đang có trong hệ thống' : 'Chưa tải được thống kê'}</small></div>
          <div><span>Bản ghi nhật ký</span><strong>{audits ? audits.total : '—'}</strong>
            <small>{audits ? 'Hoạt động đã ghi nhận' : 'Chưa tải được thống kê'}</small></div>
          <div><span>Kiểm soát truy cập</span><strong>ADMIN</strong>
            <small>Chỉ tài khoản được cấp quyền</small></div>
        </div>
      </section>

      <section className="admin-dashboard-section" aria-labelledby="admin-modules-title">
        <div className="admin-dashboard-section-heading">
          <div>
            <p className="eyebrow">CÁC PHÂN HỆ</p>
            <h2 id="admin-modules-title">Công cụ quản lý</h2>
          </div>
          <Link href="/account">Tài khoản của tôi <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="admin-dashboard-grid">
          {sections.map(item => (
            <Link key={item.path} href={item.path} className="admin-dashboard-card">
              <span>{item.tag}</span>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
              <b aria-hidden="true">↗</b>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
