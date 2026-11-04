import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PublicUser } from '../auth/auth.types';

type SessionHead = {
  id: string; eventId: string; eventTitle: string; organizerId: string;
  status: string; method: 'FCFS' | 'LOTTERY' | null;
  capacity: number; startsAt: Date;
};
type Summary = {
  registrations: number; confirmed: number; pendingLottery: number;
  waiting: number; canceled: number; rejected: number;
  activeTickets: number; usedTickets: number; rejectedScans: number;
};
type Registration = {
  id: string; attendeeName: string; registeredAt: Date;
  status: string; waitingPosition: number | null;
  waitingStatus: string | null; ticketStatus: string | null;
};
const STATUSES = new Set([
  'ALL', 'CHO_PHAN_BO', 'DANH_SACH_CHO', 'DA_XAC_NHAN', 'DA_HUY', 'TU_CHOI',
]);

function pageNumber(value: unknown): number {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d{0,3}$/.test(value)
      || Number(value) > 1000) {
    throw new BadRequestException('Trang phải là số nguyên từ 1 đến 1000');
  }
  return Number(value);
}
function registrationStatus(value: unknown): string {
  if (value === undefined) return 'ALL';
  if (typeof value !== 'string' || !STATUSES.has(value)) {
    throw new BadRequestException('Bộ lọc trạng thái không hợp lệ');
  }
  return value;
}

@Injectable()
export class OrganizerInsightsService {
  constructor(private readonly db: DatabaseService) {}

  async overview(user: PublicUser, sessionId: string, page?: unknown, status?: unknown) {
    const pageValue = pageNumber(page);
    const statusValue = registrationStatus(status);
    const [session] = await this.db.queryRows<SessionHead>(
      `SELECT s.ma_suat AS id, s.ma_su_kien AS "eventId",
         e.ten_su_kien AS "eventTitle", e.ma_nguoi_to_chuc AS "organizerId",
         s.trang_thai AS status, s.suc_chua AS capacity, s.bat_dau AS "startsAt",
         p.phuong_thuc AS method
       FROM suat_su_kien s
       JOIN su_kien e ON e.ma_su_kien=s.ma_su_kien
       LEFT JOIN chinh_sach_phan_bo p ON p.ma_suat=s.ma_suat
       WHERE s.ma_suat=$1`, [sessionId],
    );
    if (!session) throw new NotFoundException('Không tìm thấy suất tổ chức');
    if (!user.roles.includes('ADMIN') && session.organizerId !== user.id) {
      throw new ForbiddenException('Bạn không quản lý suất tổ chức này');
    }
    const [summary] = await this.db.queryRows<Summary>(
      `SELECT
         (SELECT count(*)::int FROM dang_ky d WHERE d.ma_suat=$1) AS registrations,
         (SELECT count(*)::int FROM dang_ky d WHERE d.ma_suat=$1
           AND d.trang_thai='DA_XAC_NHAN') AS confirmed,
         (SELECT count(*)::int FROM dang_ky d WHERE d.ma_suat=$1
           AND d.trang_thai='CHO_PHAN_BO') AS "pendingLottery",
         (SELECT count(*)::int FROM dang_ky d WHERE d.ma_suat=$1
           AND d.trang_thai='DANH_SACH_CHO') AS waiting,
         (SELECT count(*)::int FROM dang_ky d WHERE d.ma_suat=$1
           AND d.trang_thai='DA_HUY') AS canceled,
         (SELECT count(*)::int FROM dang_ky d WHERE d.ma_suat=$1
           AND d.trang_thai='TU_CHOI') AS rejected,
         (SELECT count(*)::int FROM ve v WHERE v.ma_suat=$1
           AND v.trang_thai IN ('CHUA_SU_DUNG','DA_SU_DUNG')) AS "activeTickets",
         (SELECT count(*)::int FROM ve v WHERE v.ma_suat=$1
           AND v.trang_thai='DA_SU_DUNG') AS "usedTickets",
         (SELECT count(*)::int FROM ban_ghi_check_in c WHERE c.ma_suat=$1
           AND c.ket_qua='TU_CHOI') AS "rejectedScans"`, [sessionId],
    );
    const [total] = await this.db.queryRows<{ total: number }>(
      `SELECT count(*)::int AS total FROM dang_ky
       WHERE ma_suat=$1 AND ($2::text='ALL' OR trang_thai=$2)`,
      [sessionId, statusValue],
    );
    const pageSize = 50;
    const rows = await this.db.queryRows<Registration>(
      `SELECT d.ma_dang_ky AS id, n.ho_ten AS "attendeeName",
         d.thoi_gian_dang_ky AS "registeredAt", d.trang_thai AS status,
         w.thu_tu AS "waitingPosition", w.trang_thai AS "waitingStatus",
         v.trang_thai AS "ticketStatus"
       FROM dang_ky d
       JOIN nguoi_dung n ON n.ma_nguoi_dung=d.ma_nguoi_dung
       LEFT JOIN muc_danh_sach_cho w ON w.ma_dang_ky=d.ma_dang_ky
       LEFT JOIN ve v ON v.ma_dang_ky=d.ma_dang_ky
       WHERE d.ma_suat=$1
         AND ($2::text='ALL' OR d.trang_thai=$2)
       ORDER BY d.thoi_gian_dang_ky DESC,d.ma_dang_ky DESC
       LIMIT $3 OFFSET $4`,
      [sessionId, statusValue, pageSize, (pageValue - 1) * pageSize],
    );
    return {
      session: { id: session.id, eventId: session.eventId,
        eventTitle: session.eventTitle, status: session.status,
        method: session.method, capacity: session.capacity, startsAt: session.startsAt },
      summary,
      registrations: {
        items: rows, total: total.total, page: pageValue, pageSize,
        pages: Math.ceil(total.total / pageSize), status: statusValue,
      },
    };
  }
}
