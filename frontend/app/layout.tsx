import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MED-06 | Cổng sự kiện văn hóa',
  description: 'Cổng quản lý sự kiện văn hóa và vé miễn phí',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
