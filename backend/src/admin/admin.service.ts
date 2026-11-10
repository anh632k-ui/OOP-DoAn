import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PublicUser } from '../auth/auth.types';

type UserRow = {
  id: string; name: string; email: string; status: string;
  createdAt: Date; roles: string[];
};
type RoleChange = { organizer: boolean; checkin: boolean };

function pagination(value: unknown): number {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d{0,2}$/.test(value)) {
    throw new BadRequestException('Trang phải từ 1 đến 999');
  }
  return Number(value);
}

function parseRoles(value: unknown): RoleChange {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new BadRequestException('Dữ liệu vai trò không hợp lệ');
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.organizer !== 'boolean' || typeof obj.checkin !== 'boolean'
      || Object.keys(obj).some(key => key !== 'organizer' && key !== 'checkin')) {
    throw new BadRequestException('Chỉ cho phép cờ organizer và checkin dạng boolean');
  }
  return { organizer: obj.organizer, checkin: obj.checkin };
}

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}

  async listUsers(page?: unknown, q?: unknown) {
    const requestedPage = pagination(page);
    if (q !== undefined && (typeof q !== 'string' || q.length > 100)) {
      throw new BadRequestException('Từ khóa tìm kiếm tối đa 100 ký tự');
    }
    const needle = typeof q === 'string' ? q.trim().toLowerCase() : '';
    const filter = needle || null;
    const [count] = await this.db.queryRows<{ total: number }>(
      `SELECT count(*)::int AS total FROM nguoi_dung n
       WHERE ($1::text IS NULL
         OR strpos(lower(n.ho_ten),$1)>0 OR strpos(lower(n.email),$1)>0)`,
      [filter],
    );
    const pageSize = 50;
    const items = await this.db.queryRows<UserRow>(
      `SELECT n.ma_nguoi_dung AS id,n.ho_ten AS name,n.email,
        n.trang_thai AS status,n.tao_luc AS "createdAt",
        COALESCE(array_agg(v.ten_vai_tro ORDER BY v.ten_vai_tro)
           FILTER (WHERE v.ten_vai_tro IS NOT NULL),ARRAY[]::varchar[]) AS roles
      FROM nguoi_dung n
      LEFT JOIN nguoi_dung_vai_tro nv ON nv.ma_nguoi_dung=n.ma_nguoi_dung
      LEFT JOIN vai_tro v ON v.ma_vai_tro=nv.ma_vai_tro
      WHERE ($1::text IS NULL
        OR strpos(lower(n.ho_ten),$1)>0 OR strpos(lower(n.email),$1)>0)
      GROUP BY n.ma_nguoi_dung
      ORDER BY n.tao_luc DESC,n.ma_nguoi_dung DESC
      LIMIT $2 OFFSET $3`,
      [filter, pageSize, (requestedPage - 1) * pageSize],
    );
    return {
      items,
      page: requestedPage, pageSize,
      total: count.total,
      pages: Math.ceil(count.total / pageSize),
    };
  }

  async listAudit(page?: unknown, action?: unknown) {
    const requestedPage = pagination(page);
    const filter = action === undefined ? 'ALL' : action;
    if (typeof filter !== 'string' || (
      filter !== 'ALL' && !/^[A-Z_]{3,80}$/.test(filter)
    )) {
      throw new BadRequestException('Bộ lọc nhật ký không hợp lệ');
    }
    const [count] = await this.db.queryRows<{ total: number }>(
      `SELECT count(*)::int AS total FROM nhat_ky_he_thong
        WHERE ($1::text='ALL' OR hanh_dong=$1)`, [filter],
    );
    const pageSize = 50;
    const items = await this.db.queryRows<{
      id: string; action: string; createdAt: Date;
      details: Record<string, unknown>; actorName: string | null;
    }>(
      `SELECT a.ma_nhat_ky AS id,a.hanh_dong AS action,
         a.thoi_gian AS "createdAt",a.chi_tiet AS details,
         n.ho_ten AS "actorName"
       FROM nhat_ky_he_thong a
       LEFT JOIN nguoi_dung n ON n.ma_nguoi_dung=a.ma_nguoi_dung
       WHERE ($1::text='ALL' OR a.hanh_dong=$1)
       ORDER BY a.thoi_gian DESC,a.ma_nhat_ky DESC
       LIMIT $2 OFFSET $3`,
      [filter,pageSize,(requestedPage-1)*pageSize],
    );
    return {
      items, total: count.total, page: requestedPage, pageSize,
      pages: Math.ceil(count.total/pageSize), action: filter,
    };
  }

  async setAccountLocked(actor: PublicUser, userId: string, body: unknown) {
    if (userId === actor.id) {
      throw new ConflictException('Không được khóa tài khoản của chính mình');
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)
        || typeof (body as Record<string, unknown>).locked !== 'boolean'
        || Object.keys(body).some(k => k !== 'locked')) {
      throw new BadRequestException('Chỉ nhận locked dạng boolean');
    }
    const locked = (body as {locked: boolean}).locked;
    return this.db.transaction(async client => {
      const target = await client.query<{ id: string; status: string }>(
        `SELECT ma_nguoi_dung AS id,trang_thai AS status
          FROM nguoi_dung WHERE ma_nguoi_dung=$1 FOR UPDATE`, [userId],
      );
      if (!target.rows[0]) throw new NotFoundException('Không tìm thấy tài khoản');
      const isAdmin = await client.query(
        `SELECT 1 FROM nguoi_dung_vai_tro nv
         JOIN vai_tro r ON r.ma_vai_tro=nv.ma_vai_tro
         WHERE nv.ma_nguoi_dung=$1 AND r.ten_vai_tro='ADMIN' LIMIT 1`,
        [userId],
      );
      if (isAdmin.rowCount) {
        throw new ConflictException('Không khóa/mở khóa ADMIN qua giao diện này');
      }
      const nextStatus = locked ? 'KHOA' : 'HOAT_DONG';
      if (nextStatus === target.rows[0].status) {
        return { id:userId,status:nextStatus,changed:false };
      }
      await client.query(
        `UPDATE nguoi_dung SET trang_thai=$2 WHERE ma_nguoi_dung=$1`,
        [userId,nextStatus],
      );
      await client.query(
        `INSERT INTO nhat_ky_he_thong(ma_nguoi_dung,hanh_dong,chi_tiet)
          VALUES($1,'CAP_NHAT_TRANG_THAI_TAI_KHOAN',$2::jsonb)`,
        [actor.id,JSON.stringify({targetUserId:userId,from:target.rows[0].status,to:nextStatus})],
      );
      return { id:userId,status:nextStatus,changed:true };
    });
  }

  async updateRoles(actor: PublicUser, userId: string, value: unknown) {
    const desired = parseRoles(value);
    if (userId === actor.id) {
      throw new ConflictException('Không cho phép tự sửa vai trò của mình');
    }
    return this.db.transaction(async client => {
      const target = await client.query<{ id: string; status: string }>(
        `SELECT ma_nguoi_dung AS id,trang_thai AS status
           FROM nguoi_dung WHERE ma_nguoi_dung=$1 FOR UPDATE`,
        [userId],
      );
      if (!target.rows[0]) throw new NotFoundException('Không tìm thấy tài khoản');
      if (target.rows[0].status !== 'HOAT_DONG') {
        throw new ConflictException('Tài khoản đang bị khóa');
      }
      const roles = ['ORGANIZER','CHECKIN'].filter(role =>
        role === 'ORGANIZER' ? desired.organizer : desired.checkin,
      );
      // ADMIN and ATTENDEE are explicitly outside this mutation scope.
      await client.query(
        `DELETE FROM nguoi_dung_vai_tro nv
          USING vai_tro v WHERE nv.ma_vai_tro=v.ma_vai_tro
          AND nv.ma_nguoi_dung=$1 AND v.ten_vai_tro IN ('ORGANIZER','CHECKIN')`,
        [userId],
      );
      if (roles.length) {
        await client.query(
          `INSERT INTO nguoi_dung_vai_tro(ma_nguoi_dung,ma_vai_tro)
            SELECT $1,v.ma_vai_tro FROM vai_tro v
            WHERE v.ten_vai_tro=ANY($2::text[])
            ON CONFLICT DO NOTHING`,
          [userId,roles],
        );
      }
      await client.query(
        `INSERT INTO nhat_ky_he_thong(ma_nguoi_dung,hanh_dong,chi_tiet)
          VALUES($1,'CAP_NHAT_VAI_TRO',$2::jsonb)`,
        [actor.id,JSON.stringify({ targetUserId: userId, organizer: desired.organizer,
          checkin: desired.checkin })],
      );
      return { id: userId, organizer: desired.organizer, checkin: desired.checkin };
    });
  }
  async listOrganizerRequests() {
    const items = await this.db.queryRows<{
      id: string; userId: string; name: string; email: string;
      reason: string; status: string; createdAt: Date;
    }>(`SELECT q.ma_yeu_cau AS id,q.ma_nguoi_dung AS "userId",
        n.ho_ten AS name,n.email,q.ly_do AS reason,
        q.trang_thai AS status,q.tao_luc AS "createdAt"
      FROM yeu_cau_to_chuc q JOIN nguoi_dung n ON n.ma_nguoi_dung=q.ma_nguoi_dung
      ORDER BY (q.trang_thai='CHO_DUYET') DESC,q.tao_luc DESC LIMIT 200`);
    return { items };
  }

  async reviewOrganizerRequest(actor: PublicUser, applicationId: string, body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body)
        || typeof (body as Record<string, unknown>).approve !== 'boolean'
        || Object.keys(body).some(k => k !== 'approve')) {
      throw new BadRequestException('Chỉ cho phép approve dạng boolean');
    }
    const approve = (body as { approve: boolean }).approve;
    return this.db.transaction(async client => {
      const [application] = (await client.query<{ userId: string; status: string }>(
        `SELECT ma_nguoi_dung AS "userId",trang_thai AS status
         FROM yeu_cau_to_chuc WHERE ma_yeu_cau=$1 FOR UPDATE`, [applicationId],
      )).rows;
      if (!application) throw new NotFoundException('Không tìm thấy yêu cầu');
      if (application.status !== 'CHO_DUYET') {
        throw new ConflictException('Yêu cầu này đã được xử lý');
      }
      if (application.userId === actor.id) {
        throw new ConflictException('Không được tự phê duyệt yêu cầu của mình');
      }
      const [target] = (await client.query<{ status: string }>(
        `SELECT trang_thai AS status FROM nguoi_dung
         WHERE ma_nguoi_dung=$1 FOR UPDATE`, [application.userId],
      )).rows;
      if (!target || target.status !== 'HOAT_DONG') {
        throw new ConflictException('Tài khoản không còn hoạt động');
      }
      if (approve) {
        await client.query(
          `INSERT INTO nguoi_dung_vai_tro(ma_nguoi_dung,ma_vai_tro)
           SELECT $1,ma_vai_tro FROM vai_tro WHERE ten_vai_tro='ORGANIZER'
           ON CONFLICT DO NOTHING`, [application.userId],
        );
      }
      const status = approve ? 'DA_DUYET' : 'TU_CHOI';
      await client.query(
        `UPDATE yeu_cau_to_chuc SET trang_thai=$2,xu_ly_luc=now(),
         ma_nguoi_duyet=$3 WHERE ma_yeu_cau=$1`,
        [applicationId,status,actor.id],
      );
      await client.query(
        `INSERT INTO nhat_ky_he_thong(ma_nguoi_dung,hanh_dong,chi_tiet)
         VALUES($1,'DUYET_YEU_CAU_TO_CHUC',$2::jsonb)`,
        [actor.id,JSON.stringify({applicationId,targetUserId:application.userId,status})],
      );
      return { id:applicationId, status };
    });
  }

}
