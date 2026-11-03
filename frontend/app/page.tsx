type HealthResponse = {
  status?: string;
  database?: string;
};

export const dynamic = 'force-dynamic';

async function checkBackend(): Promise<boolean> {
  const endpoint =
    process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001';

  try {
    const response = await fetch(`${endpoint}/api/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return false;

    const data = (await response.json()) as HealthResponse;
    return data.status === 'ok' && data.database === 'connected';
  } catch {
    return false;
  }
}

export default async function Home() {
  const connected = await checkBackend();

  return (
    <main className="container">
      <header>
        <p className="eyebrow">MED-06 · GIAI ĐOẠN 1</p>
        <h1>Cổng quản lý sự kiện văn hóa và vé miễn phí</h1>
        <p>
          Nền tảng quản lý chương trình, suất tổ chức, đăng ký,
          danh sách chờ và check-in.
        </p>
      </header>

      <section className="panel" aria-labelledby="system-status">
        <h2 id="system-status">Trạng thái hệ thống</h2>
        <p>
          <span className={connected ? 'status ok' : 'status error'}>
            {connected ? 'Đã kết nối' : 'Chưa kết nối'}
          </span>
          {' '}NestJS API và PostgreSQL
        </p>
        <p className="note">
          {connected
            ? 'Môi trường đã sẵn sàng để phát triển các chức năng.'
            : 'Kiểm tra backend, PostgreSQL và lệnh docker compose ps.'}
        </p>
      </section>

      <section className="panel" aria-labelledby="next-steps">
        <h2 id="next-steps">Các nghiệp vụ sẽ triển khai</h2>
        <ul>
          <li>Tài khoản và phân quyền</li>
          <li>Quản lý sự kiện, địa điểm và suất</li>
          <li>Đăng ký, FCFS, Lottery và danh sách chờ</li>
          <li>Vé điện tử và check-in một lần</li>
          <li>Khả năng tiếp cận, tìm kiếm và thống kê</li>
        </ul>
      </section>
    </main>
  );
}
