import type { Metadata } from 'next';
import SiteHeader from './components/site-header';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'MED-06 | Sự kiện văn hóa miễn phí', template: '%s | MED-06' },
  description: 'Khám phá sự kiện văn hóa, đăng ký suất miễn phí và nhận vé điện tử.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi">
    <body>
      <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
      <SiteHeader/>
      {children}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div><strong>MED·06</strong><span>Không gian văn hóa dành cho tất cả mọi người.</span></div>
          <span>Vé miễn phí · Giờ Hà Nội (UTC+7)</span>
        </div>
      </footer>
    </body>
  </html>;
}
