import {
  BadRequestException, ConflictException, ForbiddenException,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { PublicUser } from '../auth/auth.types';
import {
  allocationMethod, asObject, description, optionalPatch,
  requiredText, sessionInput, verifiedAccessibility,
} from './management.validation';

type EventRow = {
  id: string; title: string; description: string;
  status: string; organizerId: string;
};
type IdRow = { id: string };
type Venue = { id: string; name: string; address: string; description: string };

@Injectable()
export class ManagementService {
  constructor(private readonly db: DatabaseService) {}

  private async lockEvent(
    client: PoolClient, user: PublicUser, id: string, draftOnly = true,
  ): Promise<EventRow> {
    const result = await client.query<EventRow>(
      `SELECT ma_su_kien AS id, ten_su_kien AS title,
        mo_ta AS description, trang_thai AS status,
        ma_nguoi_to_chuc AS "organizerId"
      FROM su_kien WHERE ma_su_kien=$1 FOR UPDATE`, [id],
    );
    const event = result.rows[0];
    if (!event) throw new NotFoundException('Không tìm thấy sự kiện');
    if (!user.roles.includes('ADMIN') && event.organizerId !== user.id) {
      throw new ForbiddenException('Bạn không quản lý sự kiện này');
    }
    if (draftOnly && event.status !== 'NHAP') {
      throw new ConflictException('Chỉ được chỉnh sửa sự kiện ở trạng thái NHAP');
    }
    return event;
  }

  async listEvents(user: PublicUser): Promise<{ items: EventRow[] }> {
    const isAdmin = user.roles.includes('ADMIN');
    const items = await this.db.queryRows<EventRow>(
      `SELECT ma_su_kien AS id, ten_su_kien AS title,
        mo_ta AS description, trang_thai AS status,
        ma_nguoi_to_chuc AS "organizerId"
      FROM su_kien WHERE ($1::boolean OR ma_nguoi_to_chuc=$2)
      ORDER BY tao_luc DESC, ma_su_kien DESC LIMIT 200`,
      [isAdmin, user.id],
    );
    return { items };
  }

  async createEvent(user: PublicUser, body: unknown): Promise<EventRow> {
    const obj = asObject(body);
    const title = requiredText(obj, 'title', 200);
    const desc = description(obj);
    const [event] = await this.db.queryRows<EventRow>(
      `INSERT INTO su_kien(ma_nguoi_to_chuc,ten_su_kien,mo_ta)
         VALUES($1,$2,$3)
         RETURNING ma_su_kien AS id, ten_su_kien AS title,
         mo_ta AS description, trang_thai AS status,
         ma_nguoi_to_chuc AS "organizerId"`,
      [user.id, title, desc],
    );
    return event;
  }

  async updateEvent(user: PublicUser, id: string, body: unknown): Promise<EventRow> {
    const patch = optionalPatch(asObject(body));
    return this.db.transaction(async client => {
      const previous = await this.lockEvent(client, user, id);
      const result = await client.query<EventRow>(
        `UPDATE su_kien SET ten_su_kien=$2,mo_ta=$3
         WHERE ma_su_kien=$1
         RETURNING ma_su_kien AS id, ten_su_kien AS title,
         mo_ta AS description, trang_thai AS status,
         ma_nguoi_to_chuc AS "organizerId"`,
        [id, patch.title ?? previous.title, patch.description ?? previous.description],
      );
      return result.rows[0];
    });
  }

  async publishEvent(user: PublicUser, id: string) {
    return this.db.transaction(async client => {
      await this.lockEvent(client, user, id);
      const count = await client.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM suat_su_kien s
           WHERE s.ma_su_kien=$1 AND s.trang_thai='NHAP'
             AND s.bat_dau>now()
             AND EXISTS (SELECT 1 FROM chinh_sach_phan_bo c WHERE c.ma_suat=s.ma_suat)`,
        [id],
      );
      const total = await client.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM suat_su_kien WHERE ma_su_kien=$1`, [id],
      );
      if (!total.rows[0]?.count || count.rows[0].count !== total.rows[0].count) {
        throw new ConflictException('Mỗi suất cần lịch tương lai và chính sách FCFS/LOTTERY trước khi công bố');
      }
      await client.query(
        `UPDATE suat_su_kien
        SET trang_thai=CASE
          WHEN mo_dang_ky<=now() AND dong_dang_ky>now() THEN 'MO_DANG_KY'
          ELSE 'NHAP' END
        WHERE ma_su_kien=$1`, [id],
      );
      await client.query(
        `UPDATE su_kien SET trang_thai='DA_CONG_BO' WHERE ma_su_kien=$1`, [id],
      );
      return { id, status: 'DA_CONG_BO' };
    });
  }

  async cancelEmptyEvent(user: PublicUser, id: string) {
    return this.db.transaction(async client => {
      const event = await this.lockEvent(client, user, id, false);
      if (event.status === 'DA_HUY') throw new ConflictException('Sự kiện đã hủy');
      const used = await client.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM dang_ky d
           JOIN suat_su_kien s ON s.ma_suat=d.ma_suat WHERE s.ma_su_kien=$1`,
        [id],
      );
      if (used.rows[0]?.count) {
        throw new ConflictException('Sự kiện đã có đăng ký; xử lý hoàn vé ở giai đoạn sau');
      }
      await client.query(
        `UPDATE suat_su_kien SET trang_thai='DA_HUY' WHERE ma_su_kien=$1`, [id],
      );
      await client.query(
        `UPDATE su_kien SET trang_thai='DA_HUY' WHERE ma_su_kien=$1`, [id],
      );
      return { id, status: 'DA_HUY' };
    });
  }

  async listVenues(): Promise<{ items: Venue[] }> {
    return { items: await this.db.queryRows<Venue>(
      `SELECT ma_dia_diem AS id,ten_dia_diem AS name,
        dia_chi AS address,mo_ta AS description
      FROM dia_diem ORDER BY ten_dia_diem LIMIT 200`,
    ) };
  }

  async createVenue(body: unknown): Promise<Venue> {
    const obj = asObject(body);
    const name = requiredText(obj, 'name', 200);
    const address = requiredText(obj, 'address', 1000);
    const desc = description(obj);
    const [venue] = await this.db.queryRows<Venue>(
      `INSERT INTO dia_diem(ten_dia_diem,dia_chi,mo_ta)
        VALUES($1,$2,$3)
        RETURNING ma_dia_diem AS id,ten_dia_diem AS name,
          dia_chi AS address,mo_ta AS description`,
      [name, address, desc],
    );
    return venue;
  }

  async listSessions(user: PublicUser, eventId: string) {
    return this.db.transaction(async client => {
      await this.lockEvent(client, user, eventId, false);
      const result = await client.query(
        `SELECT s.ma_suat AS id, s.bat_dau AS "startsAt", s.ket_thuc AS "endsAt",
          s.suc_chua AS capacity, s.trang_thai AS status,
          s.mo_dang_ky AS "registrationOpensAt",
          s.dong_dang_ky AS "registrationClosesAt",
          s.ma_dia_diem AS "venueId", c.phuong_thuc AS method
        FROM suat_su_kien s
        LEFT JOIN chinh_sach_phan_bo c ON c.ma_suat=s.ma_suat
        WHERE s.ma_su_kien=$1 ORDER BY s.bat_dau`, [eventId],
      );
      return { items: result.rows };
    });
  }

  async createSession(user: PublicUser, eventId: string, body: unknown) {
    const data = sessionInput(body);
    return this.db.transaction(async client => {
      await this.lockEvent(client, user, eventId);
      const venue = await client.query(
        `SELECT 1 FROM dia_diem WHERE ma_dia_diem=$1`, [data.venueId],
      );
      if (!venue.rowCount) throw new NotFoundException('Địa điểm không tồn tại');
      const result = await client.query<IdRow>(
        `INSERT INTO suat_su_kien(
          ma_su_kien,ma_dia_diem,bat_dau,ket_thuc,suc_chua,
          mo_dang_ky,dong_dang_ky)
          VALUES($1,$2,$3,$4,$5,$6,$7)
          RETURNING ma_suat AS id`,
        [eventId,data.venueId,data.startsAt,data.endsAt,data.capacity,
          data.registrationOpensAt,data.registrationClosesAt],
      );
      return { id: result.rows[0].id, status: 'NHAP' };
    });
  }

  async setPolicy(user: PublicUser, sessionId: string, body: unknown) {
    const method = allocationMethod(body);
    return this.db.transaction(async client => {
      const parent = await client.query<{ eventId: string }>(
        `SELECT ma_su_kien AS "eventId" FROM suat_su_kien
          WHERE ma_suat=$1`, [sessionId],
      );
      if (!parent.rows[0]) throw new NotFoundException('Không tìm thấy suất');
      await this.lockEvent(client, user, parent.rows[0].eventId);
      await client.query(
        `INSERT INTO chinh_sach_phan_bo(ma_suat,phuong_thuc,cau_hinh)
          VALUES($1,$2,'{}'::jsonb)
          ON CONFLICT(ma_suat) DO UPDATE SET
            phuong_thuc=EXCLUDED.phuong_thuc,
            cau_hinh=EXCLUDED.cau_hinh`,
        [sessionId,method],
      );
      return { sessionId, method };
    });
  }

  async accessibilityOptions() {
    return { items: await this.db.queryRows(
      `SELECT ma_dac_tinh AS id,ten_dac_tinh AS name,
        mo_ta AS description FROM dac_tinh_tiep_can
        ORDER BY ten_dac_tinh LIMIT 100`,
    ) };
  }

  async setAccessibility(user: PublicUser, eventId: string, body: unknown) {
    const { ids, note } = verifiedAccessibility(body);
    return this.db.transaction(async client => {
      await this.lockEvent(client, user, eventId);
      const valid = await client.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM dac_tinh_tiep_can
          WHERE ma_dac_tinh = ANY($1::uuid[])`, [ids],
      );
      if (valid.rows[0].count !== ids.length) {
        throw new BadRequestException('Một hoặc nhiều đặc tính tiếp cận không tồn tại');
      }
      await client.query(
        `DELETE FROM su_kien_dac_tinh WHERE ma_su_kien=$1`, [eventId],
      );
      if (ids.length) {
        await client.query(
          `INSERT INTO su_kien_dac_tinh(ma_su_kien,ma_dac_tinh,ghi_chu)
            SELECT $1,unnest($2::uuid[]),$3`, [eventId,ids,note],
        );
      }
      return { eventId, verifiedFeatures: ids.length };
    });
  }
}
