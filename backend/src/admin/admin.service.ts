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
}
