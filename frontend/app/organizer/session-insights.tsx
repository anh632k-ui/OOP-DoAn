'use client';

import { useEffect, useState } from 'react';
import { formatVietnamDate } from '../../lib/vietnam-time';
import { labelStatus } from '../../lib/status-label';

type SessionOverview = {
  session: {
    id: string; eventTitle: string; status: string;
    method: string | null; capacity: number; startsAt: string;
  };
  summary: {
    registrations: number; confirmed: number; pendingLottery: number;
    waiting: number; canceled: number; rejected: number;
    activeTickets: number; usedTickets: number; rejectedScans: number;
  };
  registrations: {
    items: {
      id: string; attendeeName: string; registeredAt: string;
      status: string; waitingPosition: number | null;
      waitingStatus: string | null; ticketStatus: string | null;
    }[];
    total: number; page: number; pageSize: number; pages: number; status: string;
  };
};
type DrawReport = {
  roundId: string; drawnAt: string; roundCount: number;
  seedSha256: string; auditSeed: string; status: string;
  results: {
    registrationId: string; attendeeName: string;
    won: boolean; waitingPosition: number | null;
  }[];
};
type ApiError = { message?: string | string[] };
const FILTERS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'DA_XAC_NHAN', label: 'Đã xác nhận' },
  { value: 'DANH_SACH_CHO', label: 'Danh sách chờ' },
  { value: 'CHO_PHAN_BO', label: 'Đang chờ bốc thăm' },
  { value: 'DA_HUY', label: 'Đã hủy' },
  { value: 'TU_CHOI', label: 'Từ chối' },
];

function messageFrom(data: ApiError): string {
  return Array.isArray(data.message) ? data.message.join(', ')
    : data.message ?? 'Không tải được dữ liệu';
}

export default function SessionInsights({ sessionId, refreshVersion }: {
  sessionId: string; refreshVersion: number;
}) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('ALL');
  const [overview, setOverview] = useState<SessionOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<DrawReport | null>(null);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    setPage(1);
    setStatus('ALL');
    setReport(null);
    setReportError('');
  }, [sessionId]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    setOverview(null);
    const params = new URLSearchParams({ page: String(page), status });
    fetch('/api/manage/sessions/' + sessionId + '/overview?' + params.toString(), {
      cache: 'no-store',
    }).then(async response => {
      const body = (await response.json()) as SessionOverview & ApiError;
      if (!response.ok) throw new Error(messageFrom(body));
      return body;
    }).then(body => {
      if (current) setOverview(body);
    }).catch(err => {
      if (current) setError(err instanceof Error ? err.message : 'Lỗi máy chủ');
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [sessionId, refreshVersion, page, status]);

  async function fetchReport() {
    setReportError('');
    try {
      const response = await fetch('/api/manage/sessions/' + sessionId + '/draw', {
        cache: 'no-store',
      });
      const data = (await response.json()) as DrawReport & ApiError;
      if (response.status === 404) {
        setReport(null);
        setReportError('Suất này chưa có đợt bốc thăm.');
        return;
      }
      if (!response.ok) throw new Error(messageFrom(data));
      setReport(data);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Không đọc được kết quả');
    }
  }

  return <div className="session-insights">
    <h3>Tình hình đăng ký và vé</h3>
    {loading && <p role="status">Đang tải dữ liệu...</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    {overview && <>
      <p className="note">
        {overview.session.method ?? 'Chưa chọn phương thức'}
        {' · '}Sức chứa: {overview.session.capacity}
        {' · '}Suất: {formatVietnamDate(overview.session.startsAt,'short')}
      </p>
      <dl className="insight-metrics">
        {([
          ['Lượt đăng ký', overview.summary.registrations],
          ['Đã xác nhận', overview.summary.confirmed],
          ['Chờ Lottery', overview.summary.pendingLottery],
          ['Danh sách chờ', overview.summary.waiting],
          ['Vé còn hiệu lực', overview.summary.activeTickets],
          ['Đã check-in', overview.summary.usedTickets],
          ['Đã hủy', overview.summary.canceled],
          ['Quét bị từ chối', overview.summary.rejectedScans],
        ] as const).map(([label, count]) => (
          <div key={label}><dt>{label}</dt><dd>{count}</dd></div>
        ))}
      </dl>

      {(overview.session.method === 'LOTTERY' || overview.session.method === 'MIXED') && (
        <div className="report-panel">
          <button type="button" onClick={() => void fetchReport()}>
            {report ? 'Cập nhật biên bản' : 'Xem biên bản bốc thăm'}
          </button>
          {reportError && <p role="status">{reportError}</p>}
          {report && <section className="draw-report" aria-label="Biên bản bốc thăm">
            <div className="draw-report-heading">
              <div>
                <p className="draw-report-eyebrow">KẾT QUẢ PHÂN BỔ VÉ</p>
                <h4>Biên bản bốc thăm</h4>
                <p className="note">Mã đợt (rút gọn): <strong>{report.roundId.slice(0, 8).toUpperCase()}</strong>
                  {' · '}Thực hiện: {formatVietnamDate(report.drawnAt, 'short')}</p>
              </div>
              <span className={report.status === 'HOAN_TAT' ? 'draw-report-status is-complete' : 'draw-report-status'}>
                {report.status === 'HOAN_TAT' ? 'Đã hoàn tất' : labelStatus(report.status)}
              </span>
            </div>
            <dl className="draw-report-summary">
              <div><dt>Đăng ký xét duyệt</dt><dd>{report.results.length}</dd></div>
              <div><dt>Được cấp vé</dt><dd>{report.results.filter(item => item.won).length}</dd></div>
              <div><dt>Danh sách dự phòng</dt><dd>{report.results.filter(item => !item.won).length}</dd></div>
              <div><dt>Đợt đã ghi nhận</dt><dd>{report.roundCount}</dd></div>
            </dl>
            <h5>Danh sách kết quả bốc thăm</h5>
            <div className="table-scroll">
              <table className="draw-results-table">
                <thead><tr><th>STT</th><th>Người tham dự</th><th>Mã đăng ký</th><th>Kết quả</th></tr></thead>
                <tbody>{report.results.map((item, index) => (
                  <tr key={item.registrationId}>
                    <td>{index + 1}</td>
                    <td className="draw-attendee-name">{item.attendeeName}</td>
                    <td><code title={item.registrationId}>{item.registrationId.slice(0, 8).toUpperCase()}</code></td>
                    <td><span className={item.won ? 'draw-result-badge won' : 'draw-result-badge standby'}>
                      {item.won ? 'Được cấp vé' : 'Dự phòng số ' + item.waitingPosition}
                    </span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <p className="draw-report-note">Biên bản lưu kết quả tại thời điểm bốc thăm.
              Thông tin vé hiện tại được theo dõi ở danh sách đăng ký phía dưới.</p>
            <details className="draw-report-technical">
              <summary>Thông tin kiểm chứng kỹ thuật</summary>
              <p><strong>Mã đợt đầy đủ:</strong> <code className="ticket-code">{report.roundId}</code></p>
              <p><strong>SHA-256 của seed:</strong> <code className="ticket-code">{report.seedSha256}</code></p>
              <p><strong>Seed kiểm chứng:</strong> <code className="ticket-code">{report.auditSeed}</code></p>
              <p className="note">Mã đăng ký đầy đủ (đối chiếu khi cần):</p>
              <ol>{report.results.map(item => (
                <li key={item.registrationId}>{item.attendeeName}: <code>{item.registrationId}</code></li>
              ))}</ol>
            </details>
          </section>}
        </div>
      )}

      <h3>Danh sách người tham dự</h3>
      <p className="note">Chỉ hiện họ tên, trạng thái và thứ tự chờ;
        không hiển thị email, mã vé hoặc token.</p>
      <label className="management-label">Lọc trạng thái
        <select value={status} onChange={event => {
          setStatus(event.target.value);
          setPage(1);
        }}>
          {FILTERS.map(filter => <option key={filter.value} value={filter.value}>
            {filter.label}
          </option>)}
        </select>
      </label>
      <p>{overview.registrations.total} bản ghi · Trang {overview.registrations.page}
        / {Math.max(1,overview.registrations.pages)}</p>
      {overview.registrations.items.length === 0 ? (
        <p className="note">Không có đăng ký phù hợp.</p>
      ) : <div className="table-scroll">
        <table className="registration-table">
          <thead><tr><th>Người tham dự</th><th>Thời gian</th>
            <th>Đăng ký</th><th>Chờ</th><th>Vé</th></tr></thead>
          <tbody>{overview.registrations.items.map(item =>
            <tr key={item.id}>
              <td>{item.attendeeName}</td>
              <td>{formatVietnamDate(item.registeredAt,'short')}</td>
              <td>{labelStatus(item.status)}</td>
              <td>{item.waitingStatus === 'DANG_CHO'
                ? item.waitingPosition ?? '—' : '—'}</td>
              <td>{item.ticketStatus ? labelStatus(item.ticketStatus) : '—'}</td>
            </tr>)}</tbody>
        </table>
      </div>}
      <nav className="insights-pager" aria-label="Phân trang đăng ký">
        <button type="button" disabled={loading || page <= 1}
          onClick={() => setPage(p => Math.max(1,p - 1))}>Trang trước</button>
        <button type="button" disabled={loading || page >= overview.registrations.pages}
          onClick={() => setPage(p => p + 1)}>Trang tiếp</button>
      </nav>
    </>}
  </div>;
}
