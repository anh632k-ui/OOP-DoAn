import {
  ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { PublicUser } from '../auth/auth.types';

type Session = {
  id: string;
  status: string;
  eventStatus: string;
  startsAt: Date;
  opensAt: Date;
  closesAt: Date;
  capacity: number;
  method: 'FCFS' | 'LOTTERY';
};

type RegisterResult = {
  id: string; sessionId: string;
  status: 'DA_XAC_NHAN' | 'DANH_SACH_CHO' | 'CHO_PHAN_BO';
  method: 'FCFS' | 'LOTTERY';
  ticketId?: string; waitingPosition?: number;
};

@Injectable()
export class RegistrationsService {
  constructor(private readonly db: DatabaseService) {}

  private newCode(): string {
    return randomBytes(32).toString('base64url');
  }

  async issueTicket(client: PoolClient, id: string, sessionId: string): Promise<string> {
    const result = await client.query<{ id: string }>(
      `INSERT INTO ve(ma_dang_ky,ma_suat,ma_xac_thuc)
        VALUES($1,$2,$3) RETURNING ma_ve AS id`,
      [id, sessionId, this.newCode()],
    );
    return result.rows[0].id;
  }

  private async lockSession(client: PoolClient, sessionId: string): Promise<Session> {
    const result = await client.query<Session>(
      `SELECT s.ma_suat AS id, s.trang_thai AS status,
         e.trang_thai AS "eventStatus",
         s.bat_dau AS "startsAt",s.mo_dang_ky AS "opensAt",
         s.dong_dang_ky AS "closesAt", s.suc_chua AS capacity,
         c.phuong_thuc AS method
       FROM suat_su_kien s
       JOIN su_kien e ON e.ma_su_kien=s.ma_su_kien
       JOIN chinh_sach_phan_bo c ON c.ma_suat=s.ma_suat
       WHERE s.ma_suat=$1 FOR UPDATE OF s`,
      [sessionId],
    );
    if (!result.rows[0]) throw new NotFoundException('Không tìm thấy suất tổ chức');
    return result.rows[0];
  }

  async register(user: PublicUser, sessionId: string): Promise<RegisterResult> {
    return this.db.transaction(async client => {
      const s = await this.lockSession(client, sessionId);
      const now = new Date();
      if (s.eventStatus !== 'DA_CONG_BO'
        || s.status === 'DA_HUY' || s.status === 'HOAN_TAT'
        || now < s.opensAt || now >= s.closesAt || now >= s.startsAt) {
        throw new ConflictException('Suất chưa mở hoặc đã đóng đăng ký');
      }
      const already = await client.query(
        `SELECT 1 FROM dang_ky WHERE ma_suat=$1 AND ma_nguoi_dung=$2
           AND trang_thai NOT IN ('DA_HUY','TU_CHOI') LIMIT 1`,
        [sessionId, user.id],
      );
      if (already.rowCount) {
        throw new ConflictException('Bạn đã đăng ký suất này');
      }

      const initialStatus = s.method === 'LOTTERY' ? 'CHO_PHAN_BO' : 'DA_XAC_NHAN';
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO dang_ky(ma_nguoi_dung,ma_suat,trang_thai)
          VALUES($1,$2,$3) RETURNING ma_dang_ky AS id`,
        [user.id, sessionId, initialStatus],
      );
      const id = inserted.rows[0].id;
      if (s.method === 'LOTTERY') {
        return { id, sessionId, status: 'CHO_PHAN_BO', method: s.method };
      }

      const count = await client.query<{ seats: number }>(
        `SELECT count(*)::int AS seats FROM ve
           WHERE ma_suat=$1 AND trang_thai IN ('CHUA_SU_DUNG','DA_SU_DUNG')`,
        [sessionId],
      );
      const pending = await client.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM muc_danh_sach_cho w
           JOIN dang_ky d ON d.ma_dang_ky=w.ma_dang_ky
           WHERE d.ma_suat=$1 AND w.trang_thai='DANG_CHO'`,
        [sessionId],
      );
      if (count.rows[0].seats < s.capacity && pending.rows[0].count === 0) {
        const ticketId = await this.issueTicket(client, id, sessionId);
        return { id, sessionId, status: 'DA_XAC_NHAN', method: s.method, ticketId };
      }
      const maxPosition = await client.query<{ last: number }>(
        `SELECT COALESCE(max(w.thu_tu),0)::int AS last FROM muc_danh_sach_cho w
           JOIN dang_ky d ON d.ma_dang_ky=w.ma_dang_ky WHERE d.ma_suat=$1`,
        [sessionId],
      );
      const waitingPosition = maxPosition.rows[0].last + 1;
      await client.query(
        `UPDATE dang_ky SET trang_thai='DANH_SACH_CHO' WHERE ma_dang_ky=$1`,
        [id],
      );
      await client.query(
        `INSERT INTO muc_danh_sach_cho(ma_dang_ky,thu_tu)
          VALUES($1,$2)`, [id, waitingPosition],
      );
      return { id, sessionId, status: 'DANH_SACH_CHO', method: s.method, waitingPosition };
    });
  }

  async myRegistrations(user: PublicUser) {
    const items = await this.db.queryRows(
      `SELECT d.ma_dang_ky AS id,d.ma_suat AS "sessionId",
         e.ten_su_kien AS "eventTitle",s.bat_dau AS "startsAt",
         d.trang_thai AS status,d.thoi_gian_dang_ky AS "registeredAt",
         w.thu_tu AS "waitingPosition",w.trang_thai AS "waitingStatus",
         v.ma_ve AS "ticketId",v.trang_thai AS "ticketStatus"
       FROM dang_ky d
       JOIN suat_su_kien s ON s.ma_suat=d.ma_suat
       JOIN su_kien e ON e.ma_su_kien=s.ma_su_kien
       LEFT JOIN muc_danh_sach_cho w ON w.ma_dang_ky=d.ma_dang_ky
       LEFT JOIN ve v ON v.ma_dang_ky=d.ma_dang_ky
       WHERE d.ma_nguoi_dung=$1
       ORDER BY d.thoi_gian_dang_ky DESC LIMIT 200`,
      [user.id],
    );
    return { items };
  }

  async myTickets(user: PublicUser) {
    const items = await this.db.queryRows(
      `SELECT v.ma_ve AS id, v.ma_suat AS "sessionId",
        v.ma_xac_thuc AS code,v.trang_thai AS status,
        v.ngay_cap AS "issuedAt",s.bat_dau AS "startsAt",
        s.ket_thuc AS "endsAt",e.ten_su_kien AS "eventTitle",
        dd.ten_dia_diem AS venue,dd.dia_chi AS address
      FROM ve v
      JOIN dang_ky d ON d.ma_dang_ky=v.ma_dang_ky
      JOIN suat_su_kien s ON s.ma_suat=v.ma_suat
      JOIN su_kien e ON e.ma_su_kien=s.ma_su_kien
      JOIN dia_diem dd ON dd.ma_dia_diem=s.ma_dia_diem
      WHERE d.ma_nguoi_dung=$1
      ORDER BY v.ngay_cap DESC LIMIT 200`, [user.id],
    );
    return { items };
  }

  private async promoteNext(client: PoolClient, sessionId: string): Promise<void> {
    const waiting = await client.query<{ id: string; waitId: string }>(
      `SELECT d.ma_dang_ky AS id,w.ma_muc_cho AS "waitId"
       FROM muc_danh_sach_cho w
       JOIN dang_ky d ON d.ma_dang_ky=w.ma_dang_ky
       WHERE d.ma_suat=$1 AND d.trang_thai='DANH_SACH_CHO'
         AND w.trang_thai='DANG_CHO'
       ORDER BY w.thu_tu,w.ma_muc_cho
       LIMIT 1 FOR UPDATE OF d,w`, [sessionId],
    );
    if (!waiting.rowCount) return;
    const chosen = waiting.rows[0];
    await this.issueTicket(client, chosen.id, sessionId);
    await client.query(
      `UPDATE dang_ky SET trang_thai='DA_XAC_NHAN' WHERE ma_dang_ky=$1`,
      [chosen.id],
    );
    await client.query(
      `UPDATE muc_danh_sach_cho SET trang_thai='DA_DON_LEN'
        WHERE ma_muc_cho=$1`, [chosen.waitId],
    );
  }

  async cancel(user: PublicUser, id: string) {
    return this.db.transaction(async client => {
      const found = await client.query<{ sessionId: string }>(
        `SELECT ma_suat AS "sessionId" FROM dang_ky
          WHERE ma_dang_ky=$1 AND ma_nguoi_dung=$2`, [id, user.id],
      );
      if (!found.rows[0]) throw new NotFoundException('Không tìm thấy đăng ký của bạn');
      const sessionId = found.rows[0].sessionId;
      const session = await this.lockSession(client, sessionId);
      if (new Date() >= session.startsAt) {
        throw new ConflictException('Suất đã bắt đầu, không thể hủy');
      }
      const reg = await client.query<{ status: string }>(
        `SELECT trang_thai AS status FROM dang_ky
          WHERE ma_dang_ky=$1 AND ma_nguoi_dung=$2 FOR UPDATE`,
        [id, user.id],
      );
      if (!reg.rows[0] || reg.rows[0].status === 'DA_HUY'
        || reg.rows[0].status === 'TU_CHOI') {
        throw new ConflictException('Đăng ký đã hủy hoặc không còn hiệu lực');
      }
      const ticket = await client.query<{ status: string }>(
        `SELECT trang_thai AS status FROM ve WHERE ma_dang_ky=$1 FOR UPDATE`, [id],
      );
      if (ticket.rows[0]?.status === 'DA_SU_DUNG') {
        throw new ConflictException('Vé đã sử dụng không thể hủy');
      }
      if (ticket.rows[0]?.status === 'CHUA_SU_DUNG') {
        await client.query(`UPDATE ve SET trang_thai='VO_HIEU'
          WHERE ma_dang_ky=$1`, [id]);
      }
      await client.query(
        `UPDATE dang_ky SET trang_thai='DA_HUY' WHERE ma_dang_ky=$1`, [id],
      );
      await client.query(
        `UPDATE muc_danh_sach_cho SET trang_thai='DA_RUT'
          WHERE ma_dang_ky=$1 AND trang_thai='DANG_CHO'`, [id],
      );
      if (ticket.rows[0]?.status === 'CHUA_SU_DUNG') {
        await this.promoteNext(client, sessionId);
      }
      return { id, status: 'DA_HUY' };
    });
  }
}
