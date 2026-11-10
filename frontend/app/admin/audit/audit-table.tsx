'use client';

import { FormEvent, useEffect, useState } from 'react';

type AuditEntry = {
  id: string; actorName: string | null; action: string;
  createdAt: string; details: Record<string, unknown>;
};
type ApiError = { message?: string | string[] };
type AuditResult = {
  items: AuditEntry[]; total: number; page: number; pages: number;
};


type DetailRow = { label: string; value: string };

const ACTIONS = [
  ['ALL','Tất cả'],
  ['CAP_NHAT_VAI_TRO','Cập nhật vai trò'],
  ['CAP_NHAT_TRANG_THAI_TAI_KHOAN','Khóa / mở khóa tài khoản'],
  ['YEU_CAU_TO_CHUC','Yêu cầu tổ chức sự kiện'],
  ['DUYET_YEU_CAU_TO_CHUC','Duyệt Ban tổ chức'],
  ['TAM_NGUNG_SU_KIEN','Tạm ngưng sự kiện'],
  ['MO_LAI_SU_KIEN','Mở lại sự kiện'],
  ['HUY_SU_KIEN','Hủy sự kiện'],
  ['HUY_SUAT','Hủy suất'],
  ['THAY_DOI_LICH_SUAT','Đổi lịch suất'],
  ['HOAN_TAT_SUAT','Hoàn tất suất'],
  ['DANG_KY_FCFS_DUOC_VE','Cấp vé FCFS'],
  ['DANG_KY_VAO_DANH_SACH_CHO','Vào danh sách chờ'],
  ['DANG_KY_CHO_LOTTERY','Đăng ký Lottery'],
  ['HUY_DANG_KY','Hủy đăng ký'],
  ['PHAN_BO_LOTTERY','Phân bổ Lottery'],
  ['PHAN_CONG_CHECKIN','Phân công kiểm tra vé'],
  ['THU_HOI_CHECKIN','Thu hồi phân công'],
  ['CHECKIN_THANH_CONG','Check-in thành công'],
  ['CHECKIN_TU_CHOI','Check-in bị từ chối'],
];

const ACTION_LABELS: Record<string, string> = {
  CAP_NHAT_VAI_TRO: 'Cập nhật quyền người dùng',
  CAP_NHAT_TRANG_THAI_TAI_KHOAN: 'Thay đổi trạng thái tài khoản',
  YEU_CAU_TO_CHUC: 'Gửi yêu cầu tổ chức sự kiện',
  DUYET_YEU_CAU_TO_CHUC: 'Xét duyệt Ban tổ chức',
  TAM_NGUNG_SU_KIEN: 'Tạm ngưng sự kiện',
  MO_LAI_SU_KIEN: 'Mở lại sự kiện',
  HUY_SU_KIEN: 'Hủy sự kiện',
  HUY_SUAT: 'Hủy suất',
  THAY_DOI_LICH_SUAT: 'Thay đổi lịch suất',
  HOAN_TAT_SUAT: 'Hoàn tất suất',
  PHAN_BO_LOTTERY: 'Bốc thăm phân bổ vé',
  DANG_KY_CHO_LOTTERY: 'Nhận đăng ký chờ bốc thăm',
  DANG_KY_FCFS_DUOC_VE: 'Cấp vé cho người đăng ký sớm',
  DANG_KY_VAO_DANH_SACH_CHO: 'Đưa người tham dự vào danh sách chờ',
  HUY_DANG_KY: 'Hủy đăng ký',
  PHAN_CONG_CHECKIN: 'Phân công nhân viên kiểm tra vé',
  THU_HOI_CHECKIN: 'Thu hồi phân công kiểm tra vé',
  CHECKIN_THANH_CONG: 'Check-in thành công',
  CHECKIN_TU_CHOI: 'Từ chối check-in',
};

function count(value: unknown): string {
  const number = typeof value === 'number' ? value
    : typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  return Number.isSafeInteger(number) && number >= 0
    ? number.toLocaleString('vi-VN') : 'Chưa có dữ liệu';
}

function roleState(value: unknown): string {
  return value === true ? 'Đang được cấp'
    : value === false ? 'Không được cấp' : 'Chưa có dữ liệu';
}

function accountState(value: unknown): string {
  if (value === 'HOAT_DONG') return 'Đang hoạt động';
  if (value === 'KHOA') return 'Đã khóa';
  return 'Chưa có dữ liệu';
}

function localTime(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return 'Chưa có dữ liệu';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Chưa có dữ liệu'
    : parsed.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function detailRows(entry: AuditEntry): DetailRow[] {
  const d = entry.details ?? {};
  switch (entry.action) {
    case 'CAP_NHAT_VAI_TRO':
      return [
        { label: 'Quyền Ban tổ chức sau cập nhật', value: roleState(d.organizer) },
        { label: 'Quyền Kiểm tra vé sau cập nhật', value: roleState(d.checkin) },
      ];
    case 'CAP_NHAT_TRANG_THAI_TAI_KHOAN':
      return [
        { label: 'Trạng thái trước', value: accountState(d.from) },
        { label: 'Trạng thái sau', value: accountState(d.to) },
      ];
    case 'YEU_CAU_TO_CHUC':
      return [{ label: 'Kết quả', value: 'Đã gửi yêu cầu trở thành Ban tổ chức; đang chờ quản trị viên xét duyệt.' }];
    case 'DUYET_YEU_CAU_TO_CHUC':
      return [{ label: 'Kết quả', value: d.status === 'DA_DUYET'
        ? 'Yêu cầu đã được chấp thuận; tài khoản được cấp quyền Ban tổ chức.'
        : d.status === 'TU_CHOI' ? 'Yêu cầu trở thành Ban tổ chức đã bị từ chối.'
          : 'Chưa có dữ liệu về kết quả xét duyệt.' }];
    case 'TAM_NGUNG_SU_KIEN':
      return [{ label: 'Trạng thái mới', value: 'Sự kiện tạm ngưng; không tiếp nhận đăng ký mới.' }];
    case 'MO_LAI_SU_KIEN':
      return [{ label: 'Trạng thái mới', value: 'Sự kiện đã công bố trở lại; việc đăng ký tiếp tục phụ thuộc thời hạn và điều kiện của từng suất.' }];
    case 'HUY_SU_KIEN':
    case 'HUY_SUAT':
      return [
        { label: 'Vé đã vô hiệu', value: count(d.invalidatedTickets) },
        { label: 'Đăng ký đã hủy', value: count(d.canceledRegistrations) },
        { label: 'Vị trí chờ đã đóng', value: count(d.withdrawnWaiters) },
        ...(entry.action === 'HUY_SU_KIEN' && Array.isArray(d.sessionIds)
          ? [{ label: 'Số suất bị ảnh hưởng', value: count(d.sessionIds.length) }] : []),
      ];
    case 'THAY_DOI_LICH_SUAT':
      return [
        { label: 'Bắt đầu trước thay đổi', value: localTime(d.previousStartsAt) },
        { label: 'Kết thúc trước thay đổi', value: localTime(d.previousEndsAt) },
        { label: 'Bắt đầu sau thay đổi', value: localTime(d.nextStartsAt) },
        { label: 'Kết thúc sau thay đổi', value: localTime(d.nextEndsAt) },
        { label: 'Số đăng ký bị ảnh hưởng', value: count(d.affectedRegistrations) },
        ...(typeof d.reason === 'string' && d.reason.trim()
          ? [{ label: 'Lý do', value: d.reason }] : []),
      ];
    case 'HOAN_TAT_SUAT':
      return [
        { label: 'Đăng ký chờ đã kết thúc', value: count(d.expiredRegistrations) },
        { label: 'Vị trí danh sách chờ đã đóng', value: count(d.closedWaitingPositions) },
      ];
    case 'DANG_KY_FCFS_DUOC_VE':
      return [{ label: 'Kết quả', value: 'Đăng ký đã được xác nhận và hệ thống đã cấp vé theo thứ tự đăng ký.' }];
    case 'DANG_KY_VAO_DANH_SACH_CHO':
      return [
        { label: 'Kết quả', value: 'Chưa được cấp vé; đăng ký đã chuyển vào danh sách chờ.' },
        { label: 'Vị trí khi tham gia', value: count(d.waitingPosition) },
      ];
    case 'DANG_KY_CHO_LOTTERY':
      return [{ label: 'Kết quả', value: 'Đã nhận đăng ký tham gia bốc thăm; chưa xác định người nhận vé.' }];
    case 'HUY_DANG_KY':
      return [
        { label: 'Kết quả', value: 'Đăng ký tham dự đã được hủy.' },
        { label: 'Xử lý danh sách chờ', value: d.promoted === true
          ? 'Đã đôn một người từ danh sách chờ lên nhận vé.'
          : d.promoted === false ? 'Không có lượt đôn chờ thành công.'
            : 'Chưa có dữ liệu.' },
      ];
    case 'PHAN_BO_LOTTERY':
      return [
        { label: 'Số lượt đăng ký được xét', value: count(d.applicants) },
        { label: 'Số vé đã cấp', value: count(d.winners) },
        { label: 'Số người vào danh sách chờ', value: count(d.waiting) },
      ];
    case 'PHAN_CONG_CHECKIN':
      return [{ label: 'Kết quả', value: 'Nhân viên đã được phân công kiểm tra vé cho một suất sự kiện.' }];
    case 'THU_HOI_CHECKIN':
      return [{ label: 'Kết quả', value: 'Đã thu hồi phân công kiểm tra vé của nhân viên tại suất sự kiện.' }];
    case 'CHECKIN_THANH_CONG':
      return [{ label: 'Kết quả', value: 'Vé hợp lệ đã được chấp nhận và chuyển sang trạng thái đã sử dụng.' }];
    case 'CHECKIN_TU_CHOI':
      return [{ label: 'Lý do từ chối', value: typeof d.reason === 'string' && d.reason.trim()
        ? d.reason : 'Chưa có thông tin về lý do từ chối.' }];
    default:
      return [{ label: 'Thông tin', value: 'Chưa có mô tả chi tiết cho loại thao tác này.' }];
  }
}

function describe(entry: AuditEntry): string {
  switch (entry.action) {
    case 'CAP_NHAT_VAI_TRO': return 'Đã lưu trạng thái quyền của tài khoản sau cập nhật.';
    case 'CAP_NHAT_TRANG_THAI_TAI_KHOAN': return entry.details?.to === 'KHOA'
      ? 'Đã khóa tài khoản.' : entry.details?.to === 'HOAT_DONG'
        ? 'Đã mở khóa tài khoản.' : 'Đã cập nhật trạng thái tài khoản.';
    case 'YEU_CAU_TO_CHUC': return 'Người dùng đã gửi yêu cầu trở thành Ban tổ chức.';
    case 'DUYET_YEU_CAU_TO_CHUC': return entry.details?.status === 'DA_DUYET'
      ? 'Đã chấp thuận yêu cầu tổ chức sự kiện.'
      : entry.details?.status === 'TU_CHOI'
        ? 'Đã từ chối yêu cầu tổ chức sự kiện.' : 'Đã xử lý yêu cầu tổ chức.';
    case 'TAM_NGUNG_SU_KIEN': return 'Đã tạm ngưng sự kiện.';
    case 'MO_LAI_SU_KIEN': return 'Đã mở lại sự kiện.';
    case 'HUY_SU_KIEN': return 'Đã hủy sự kiện và xử lý các đăng ký, vé liên quan.';
    case 'HUY_SUAT': return 'Đã hủy suất và xử lý các đăng ký, vé liên quan.';
    case 'THAY_DOI_LICH_SUAT': return 'Đã thay đổi thời gian tổ chức suất.';
    case 'HOAN_TAT_SUAT': return 'Đã hoàn tất suất và đóng các lượt chờ còn lại.';
    case 'DANG_KY_FCFS_DUOC_VE': return 'Người tham dự đăng ký thành công và được cấp vé FCFS.';
    case 'DANG_KY_VAO_DANH_SACH_CHO': return 'Đăng ký được đưa vào danh sách chờ.';
    case 'DANG_KY_CHO_LOTTERY': return 'Đã tiếp nhận đăng ký chờ phân bổ vé Lottery.';
    case 'HUY_DANG_KY': return 'Đã hủy đăng ký tham dự.';
    case 'PHAN_BO_LOTTERY': return 'Đã bốc thăm và ghi nhận kết quả phân bổ vé.';
    case 'PHAN_CONG_CHECKIN': return 'Đã phân công nhân viên kiểm tra vé.';
    case 'THU_HOI_CHECKIN': return 'Đã thu hồi phân công nhân viên kiểm tra vé.';
    case 'CHECKIN_THANH_CONG': return 'Vé đã được kiểm tra và sử dụng thành công.';
    case 'CHECKIN_TU_CHOI': return 'Lượt kiểm tra vé đã bị từ chối.';
    default: return 'Một thao tác hệ thống đã được ghi nhận.';
  }
}

export default function AuditTable() {
  const [action, setAction] = useState('ALL');
  const [typedQuery, setTypedQuery] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [data, setData] = useState<AuditResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setData(null);
    const params = new URLSearchParams({ action, page: String(page) });
    if (query) params.set('q', query);
    fetch('/api/admin/audit?' + params.toString(), { cache: 'no-store' })
      .then(async response => {
        const body = (await response.json()) as AuditResult & ApiError;
        if (!response.ok) throw new Error(Array.isArray(body.message)
          ? body.message.join(', ') : body.message ?? 'Không thể tải nhật ký');
        return body;
      })
      .then(result => { if (active) setData(result); })
      .catch(err => {
        if (active) setError(err instanceof Error ? err.message : 'Lỗi máy chủ');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [action, page, query]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(typedQuery.trim().slice(0, 100));
    setExpandedId(null);
    setPage(1);
  }

  return <section className="panel audit-workspace">
    <div className="audit-workspace-heading">
      <div>
        <p className="eyebrow">NHẬT KÝ QUẢN TRỊ</p>
        <h2>Tra cứu hoạt động</h2>
        <p className="note">Thời gian hiển thị theo giờ Hà Nội (UTC+7).</p>
      </div>
      <span className="audit-record-count">
        {data ? data.total.toLocaleString('vi-VN') + ' bản ghi' : 'Nhật ký'}
      </span>
    </div>
    <form className="audit-filters" role="search" onSubmit={search}>
      <label className="management-label">Người thao tác
        <input type="search" value={typedQuery} maxLength={100}
          onChange={event => setTypedQuery(event.target.value)}
          placeholder="Tìm theo tên người thực hiện"/>
      </label>
      <label className="management-label">Loại thao tác
        <select value={action} onChange={event => {
          setAction(event.target.value); setExpandedId(null); setPage(1);
        }}>
          {ACTIONS.map(([value,label]) => <option value={value} key={value}>{label}</option>)}
        </select>
      </label>
      <button type="submit" disabled={loading}>Tìm kiếm</button>
    </form>
    {loading && <p role="status" className="audit-loading">Đang tải nhật ký...</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    {data && <>
      {data.items.length === 0
        ? <p className="state-message">Chưa có nhật ký phù hợp với điều kiện tìm kiếm.</p>
        : <div className="table-scroll audit-table-scroll">
          <table className="audit-data-table">
            <thead><tr>
              <th scope="col">Thời gian</th>
              <th scope="col">Người thực hiện</th>
              <th scope="col">Hành động</th>
              <th scope="col">Nội dung</th>
              <th scope="col">Chi tiết</th>
            </tr></thead>
            {data.items.map(entry => <tbody key={entry.id}>
              <tr>
                <td className="audit-when">
                  <time dateTime={entry.createdAt}>
                    {new Date(entry.createdAt).toLocaleString('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short',
                    })}
                  </time>
                </td>
                <td><strong>{entry.actorName ?? 'Hệ thống'}</strong></td>
                <td><span className="audit-action-pill">
                  {ACTION_LABELS[entry.action] ?? 'Thao tác hệ thống'}
                </span></td>
                <td className="audit-description">{describe(entry)}</td>
                <td><button type="button" className="button-secondary audit-detail-button"
                  aria-expanded={expandedId === entry.id}
                  aria-controls={'audit-detail-' + entry.id}
                  onClick={() => setExpandedId(previous => previous === entry.id ? null : entry.id)}>
                  {expandedId === entry.id ? 'Đóng' : 'Xem'}
                </button></td>
              </tr>
              {expandedId === entry.id && <tr className="audit-expanded-row">
                <td colSpan={5} id={'audit-detail-' + entry.id}>
                  <div className="audit-detail-panel">
                    <h3>Chi tiết thao tác</h3>
                    <dl>{detailRows(entry).map((row,index) =>
                      <div key={index}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
                    </dl>
                  </div>
                </td>
              </tr>}
            </tbody>)}
          </table>
        </div>}
      <div className="audit-table-footer">
        <span>Trang {data.page}/{Math.max(1, data.pages)} · {data.total.toLocaleString('vi-VN')} bản ghi</span>
        <nav className="insights-pager" aria-label="Phân trang nhật ký">
          <button type="button" disabled={loading || data.page <= 1}
            onClick={() => { setExpandedId(null); setPage(Math.max(1,data.page-1)); }}>
            Trang trước
          </button>
          <button type="button" disabled={loading || data.page >= data.pages}
            onClick={() => { setExpandedId(null); setPage(data.page+1); }}>
            Trang sau
          </button>
        </nav>
      </div>
    </>}
  </section>;
}
