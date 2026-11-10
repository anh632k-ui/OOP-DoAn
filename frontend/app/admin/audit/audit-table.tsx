'use client';

import { useEffect, useState } from 'react';

type AuditEntry = {
  id: string; actorName: string | null; action: string;
  createdAt: string; details: Record<string, unknown>;
};
type ApiError = { message?: string | string[] };
type AuditResult = {
  items: AuditEntry[]; total: number; page: number; pages: number;
};

const ACTIONS = [
  ['ALL','Tất cả'],
  ['CAP_NHAT_VAI_TRO','Cập nhật vai trò'],
  ['HUY_SU_KIEN','Hủy sự kiện'],
  ['HUY_SUAT','Hủy suất'],
  ['DANG_KY_FCFS_DUOC_VE','Cấp vé FCFS'],
  ['DANG_KY_VAO_DANH_SACH_CHO','Vào danh sách chờ'],
  ['DANG_KY_CHO_LOTTERY','Đăng ký Lottery'],
  ['HUY_DANG_KY','Hủy đăng ký'],
  ['PHAN_BO_LOTTERY','Phân bổ Lottery'],
  ['CHECKIN_THANH_CONG','Check-in thành công'],
  ['CHECKIN_TU_CHOI','Check-in bị từ chối'],
];

const ACTION_LABELS: Record<string, string> = {
  HUY_SU_KIEN: 'Hủy sự kiện',
  HUY_SUAT: 'Hủy suất',
  TAM_NGUNG_SU_KIEN: 'Tạm ngưng sự kiện',
  MO_LAI_SU_KIEN: 'Mở lại sự kiện',
  PHAN_BO_LOTTERY: 'Bốc thăm phân bổ vé',
  DANG_KY_CHO_LOTTERY: 'Nhận đăng ký chờ bốc thăm',
  DANG_KY_FCFS_DUOC_VE: 'Cấp vé cho người đăng ký sớm',
  DANG_KY_VAO_DANH_SACH_CHO: 'Đưa người tham dự vào danh sách chờ',
  HUY_DANG_KY: 'Hủy đăng ký',
  CHECKIN_THANH_CONG: 'Check-in thành công',
  CHECKIN_TU_CHOI: 'Từ chối check-in',
  CAP_NHAT_VAI_TRO: 'Cập nhật quyền người dùng',
  YEU_CAU_TO_CHUC: 'Gửi yêu cầu tổ chức sự kiện',
  DUYET_YEU_CAU_TO_CHUC: 'Xét duyệt Ban tổ chức',
};
function describe(entry: AuditEntry): string {
  const d = entry.details;
  if (entry.action === 'PHAN_BO_LOTTERY') {
    return `Đã xét ${Number(d.applicants ?? 0)} lượt đăng ký, cấp ${Number(d.winners ?? 0)} vé, đưa ${Number(d.waiting ?? 0)} người vào danh sách chờ.`;
  }
  if (entry.action === 'HUY_SU_KIEN' || entry.action === 'HUY_SUAT') {
    return `Đã vô hiệu ${Number(d.invalidatedTickets ?? 0)} vé và hủy ${Number(d.canceledRegistrations ?? 0)} đăng ký.`;
  }
  if (entry.action === 'DUYET_YEU_CAU_TO_CHUC') {
    return d.status === 'DA_DUYET' ? 'Đã duyệt quyền Ban tổ chức.' : 'Đã từ chối yêu cầu tổ chức.';
  }
  if (entry.action === 'TAM_NGUNG_SU_KIEN') return 'Đã dừng tiếp nhận đăng ký mới.';
  if (entry.action === 'MO_LAI_SU_KIEN') return 'Đã cho phép tiếp tục đăng ký theo thời hạn.';
  return 'Hoạt động đã được ghi nhận trong hệ thống.';
}

export default function AuditTable() {
  const [action, setAction] = useState('ALL');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    const query = new URLSearchParams({ action, page: String(page) });
    fetch('/api/admin/audit?' + query.toString(), { cache: 'no-store' })
      .then(async r => {
        const body = (await r.json()) as AuditResult & ApiError;
        if (!r.ok) throw new Error(Array.isArray(body.message)
          ? body.message.join(', ') : body.message ?? 'Không thể tải nhật ký');
        return body;
      })
      .then(body => { if (active) setData(body); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Lỗi máy chủ'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [action,page]);

  return <section className="panel">
    <label className="management-label">Loại thao tác
      <select value={action} onChange={event => {
        setAction(event.target.value); setPage(1);
      }}>
        {ACTIONS.map(([value,label]) => <option value={value} key={value}>{label}</option>)}
      </select>
    </label>
    {loading && <p role="status">Đang tải...</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    {data && <>
      <p>{data.total} bản ghi · Trang {data.page}/{Math.max(1,data.pages)}</p>
      {data.items.length === 0 ? <p>Chưa có nhật ký phù hợp.</p> :
        <ol className="audit-list">{data.items.map(entry =>
          <li key={entry.id}>
            <strong>{ACTION_LABELS[entry.action] ?? entry.action.replaceAll('_',' ')}</strong> · {entry.actorName ?? 'Hệ thống'}
            <p>{describe(entry)}</p>
            <p>{new Date(entry.createdAt).toLocaleString('vi-VN', {
              timeZone: 'Asia/Ho_Chi_Minh',
            })}</p>
            <details>
              <summary>Chi tiết kỹ thuật</summary>
              <pre>{JSON.stringify(entry.details,null,2)}</pre>
            </details>
          </li>)}</ol>}
      <nav className="insights-pager" aria-label="Phân trang nhật ký">
        <button type="button" disabled={loading || page <= 1}
          onClick={() => setPage(p => Math.max(1,p-1))}>Trang trước</button>
        <button type="button" disabled={loading || page >= data.pages}
          onClick={() => setPage(p => p+1)}>Trang sau</button>
      </nav>
    </>}
  </section>;
}
