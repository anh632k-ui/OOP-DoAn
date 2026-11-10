'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sections = [
  { href: '/admin', label: 'Tổng quan' },
  { href: '/admin/users', label: 'Người dùng & phân quyền' },
  { href: '/admin/audit', label: 'Nhật ký hệ thống' },
  { href: '/admin/organizer', label: 'Sự kiện & suất' },
  { href: '/admin/checkin', label: 'Kiểm tra vé' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-workspace-nav" aria-label="Điều hướng quản trị">
      {sections.map(section => (
        <Link key={section.href} href={section.href}
          aria-current={pathname === section.href ? 'page' : undefined}>
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
