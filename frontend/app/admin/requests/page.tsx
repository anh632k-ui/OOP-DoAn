import Link from 'next/link';
import OrganizerRequestReview from './request-review';

export const dynamic = 'force-dynamic';

export default function AdminOrganizerRequestsPage() {
  return <main id="main-content" className="container admin-page">
    <Link href="/admin" className="back-link">← Tổng quan quản trị</Link>
    <header className="admin-page-heading">
      <div><p className="eyebrow">MED-06 · XÉT DUYỆT</p>
      <h1>Đăng ký Ban tổ chức</h1>
      <p>Chỉ quản trị viên được phê duyệt cấp quyền tổ chức sự kiện.</p></div>
    </header>
    <OrganizerRequestReview />
  </main>;
}
