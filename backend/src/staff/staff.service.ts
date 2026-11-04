import {
  BadRequestException, ConflictException, ForbiddenException,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { PublicUser } from '../auth/auth.types';
import { appendAudit } from '../audit/audit';

type Owner = { eventId: string; ownerId: string; status: string };
type StaffRecord = { id: string; name: string; email: string; assignedAt: Date };

function exactEmail(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Dữ liệu phân công không hợp lệ');
  }
  const value = body as Record<string, unknown>;
  if (Object.keys(value).some(k => k !== 'email')
    || typeof value.email !== 'string') {
    throw new BadRequestException('Vui lòng nhập email nhân viên');
  }
  const email = value.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException('Email nhân viên không hợp lệ');
  }
  return email;
}

@Injectable()
export class StaffService {
  constructor(private readonly db: DatabaseService) {}

  private async assertOwner(
    client: PoolClient, user: PublicUser, sessionId: string,
  ): Promise<Owner> {
    const result = await client.query<Owner>(
      `SELECT s.ma_su_kien AS "eventId",e.ma_nguoi_to_chuc AS "ownerId",
        s.trang_thai AS status
        FROM suat_su_kien s JOIN su_kien e ON e.ma_su_kien=s.ma_su_kien
        WHERE s.ma_suat=$1 FOR SHARE OF s,e`, [sessionId],
    );
    const session = result.rows[0];
    if (!session) throw new NotFoundException('Không tìm thấy suất');
    if (!user.roles.includes('ADMIN') && session.ownerId !== user.id) {
      throw new ForbiddenException('Bạn không quản lý suất này');
    }
    if (session.status === 'DA_HUY' || session.status === 'HOAN_TAT') {
      throw new ConflictException('Không thể phân công cho suất đã đóng');
    }
    return session;
  }

  async assigned(user: PublicUser, sessionId: string) {
    return this.db.transaction(async client => {
      await this.assertOwner(client,user,sessionId);
      const result = await client.query<StaffRecord>(
        `SELECT n.ma_nguoi_dung AS id,n.ho_ten AS name,n.email,
          a.thoi_gian AS "assignedAt"
         FROM phan_cong_check_in a
         JOIN nguoi_dung n ON n.ma_nguoi_dung=a.ma_nguoi_dung
         WHERE a.ma_suat=$1 ORDER BY n.ho_ten,n.ma_nguoi_dung`,
        [sessionId],
      );
      return { items: result.rows };
    });
  }

  async assign(user: PublicUser, sessionId: string, body: unknown) {
    const email = exactEmail(body);
    return this.db.transaction(async client => {
      await this.assertOwner(client,user,sessionId);
      const found = await client.query<{ id: string; name: string }>(
        `SELECT n.ma_nguoi_dung AS id,n.ho_ten AS name
         FROM nguoi_dung n
         WHERE lower(n.email)=$1 AND n.trang_thai='HOAT_DONG'
         AND EXISTS (
           SELECT 1 FROM nguoi_dung_vai_tro nv
           JOIN vai_tro r ON r.ma_vai_tro=nv.ma_vai_tro
           WHERE nv.ma_nguoi_dung=n.ma_nguoi_dung AND r.ten_vai_tro='CHECKIN'
         ) FOR SHARE OF n`, [email],
      );
      if (!found.rows[0]) {
        throw new NotFoundException('Không tìm thấy nhân viên CHECKIN đang hoạt động với email này');
      }
      const staffId = found.rows[0].id;
      const inserted = await client.query(
        `INSERT INTO phan_cong_check_in(ma_suat,ma_nguoi_dung,ma_nguoi_phan_cong)
         VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
        [sessionId,staffId,user.id],
      );
      if (inserted.rowCount === 0) {
        throw new ConflictException('Nhân viên đã được phân công');
      }
      await appendAudit(client,user.id,'PHAN_CONG_CHECKIN',{sessionId,staffId});
      return {sessionId,staffId,name:found.rows[0].name};
    });
  }

  async revoke(user: PublicUser, sessionId: string, staffId: string) {
    return this.db.transaction(async client => {
      await this.assertOwner(client,user,sessionId);
      const removed = await client.query(
        `DELETE FROM phan_cong_check_in
          WHERE ma_suat=$1 AND ma_nguoi_dung=$2`, [sessionId,staffId],
      );
      if (!removed.rowCount) throw new NotFoundException('Không tìm thấy phân công');
      await appendAudit(client,user.id,'THU_HOI_CHECKIN',{sessionId,staffId});
      return {sessionId,staffId,removed:true};
    });
  }

  // Row share lock keeps assignment stable until its scan transaction ends.
  async assertCheckinScope(client: PoolClient, operator: PublicUser, sessionId: string) {
    if (operator.roles.includes('ADMIN')) return;
    const matched = await client.query(
      `SELECT 1 FROM phan_cong_check_in
         WHERE ma_suat=$1 AND ma_nguoi_dung=$2 FOR SHARE`,
      [sessionId,operator.id],
    );
    if (!matched.rowCount) {
      throw new ForbiddenException('Bạn chưa được phân công check-in suất này');
    }
  }

  async mySessions(operator: PublicUser) {
    const items = await this.db.queryRows<{
      id: string; title: string; venue: string; startsAt: Date; endsAt: Date; status: string;
    }>(
      `SELECT s.ma_suat AS id,e.ten_su_kien AS title,d.ten_dia_diem AS venue,
         s.bat_dau AS "startsAt",s.ket_thuc AS "endsAt",s.trang_thai AS status
       FROM suat_su_kien s
       JOIN su_kien e ON e.ma_su_kien=s.ma_su_kien
       JOIN dia_diem d ON d.ma_dia_diem=s.ma_dia_diem
       WHERE e.trang_thai='DA_CONG_BO' AND s.trang_thai <> 'DA_HUY'
         AND ($1::boolean OR EXISTS (
           SELECT 1 FROM phan_cong_check_in a
           WHERE a.ma_suat=s.ma_suat AND a.ma_nguoi_dung=$2
         ))
       ORDER BY s.bat_dau DESC LIMIT 100`,
      [operator.roles.includes('ADMIN'),operator.id],
    );
    return { items };
  }
}
