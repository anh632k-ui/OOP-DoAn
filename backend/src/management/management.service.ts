import {
  BadRequestException, ConflictException, ForbiddenException,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { PublicUser } from '../auth/auth.types';
import {
  allocationPolicy, asObject, description, optionalPatch,
  requiredText, sessionInput, verifiedAccessibility,
} from './management.validation';
import { rescheduleInput } from './reschedule.validation';

type EventRow = {
  id: string; title: string; description: string;
  status: string; organizerId: string; hasCover: boolean;
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
        ma_nguoi_to_chuc AS "organizerId",
        (anh_bia_key IS NOT NULL) AS "hasCover"
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
        ma_nguoi_to_chuc AS "organizerId",
        (anh_bia_key IS NOT NULL) AS "hasCover"
      FROM su_kien WHERE ($1::boolean OR ma_nguoi_to_chuc=$2)
      ORDER BY (trang_thai='DA_HUY') ASC, tao_luc DESC, ma_su_kien DESC LIMIT 200`,
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
         ma_nguoi_to_chuc AS "organizerId",
        (anh_bia_key IS NOT NULL) AS "hasCover"`,
      [user.id, title, desc],
    );
    return event;
  }

  async updateEvent(user: PublicUser, id: string, body: unknown): Promise<EventRow> {
    const patch = optionalPatch(asObject(body));
    return this.db.transaction(async client => {
      const previous = await this.lockEvent(client, user, id, false);
      if (!['NHAP', 'DA_CONG_BO', 'TAM_NGUNG'].includes(previous.status)) {
        throw new ConflictException('Không thể chỉnh sửa sự kiện đã hủy');
      }
      const result = await client.query<EventRow>(
        `UPDATE su_kien SET ten_su_kien=$2,mo_ta=$3
         WHERE ma_su_kien=$1
         RETURNING ma_su_kien AS id, ten_su_kien AS title,
         mo_ta AS description, trang_thai AS status,
         ma_nguoi_to_chuc AS "organizerId",
        (anh_bia_key IS NOT NULL) AS "hasCover"`,
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

  async pauseEvent(user: PublicUser, id: string) {
    return this.db.transaction(async client => {
      const event = await this.lockEvent(client, user, id, false);
      if (event.status !== 'DA_CONG_BO') {
        throw new ConflictException('Chỉ tạm ngưng sự kiện đã công bố');
      }
      await client.query(`UPDATE su_kien SET trang_thai='TAM_NGUNG' WHERE ma_su_kien=$1`, [id]);
      await client.query(`INSERT INTO nhat_ky_he_thong(ma_nguoi_dung,hanh_dong,chi_tiet)
        VALUES($1,'TAM_NGUNG_SU_KIEN',$2::jsonb)`, [user.id, JSON.stringify({eventId:id})]);
      return { id, status: 'TAM_NGUNG' };
    });
  }

  async resumeEvent(user: PublicUser, id: string) {
    return this.db.transaction(async client => {
      const event = await this.lockEvent(client, user, id, false);
      if (event.status !== 'TAM_NGUNG') {
        throw new ConflictException('Chỉ mở lại sự kiện đang tạm ngưng');
      }
      await client.query(`UPDATE su_kien SET trang_thai='DA_CONG_BO' WHERE ma_su_kien=$1`, [id]);
      await client.query(`INSERT INTO nhat_ky_he_thong(ma_nguoi_dung,hanh_dong,chi_tiet)
        VALUES($1,'MO_LAI_SU_KIEN',$2::jsonb)`, [user.id, JSON.stringify({eventId:id})]);
      return { id, status: 'DA_CONG_BO' };
    });
  }

  private async invalidateRegistrations(
    client: PoolClient, sessionIds: string[],
  ) {
    if (sessionIds.length === 0) {
      return { invalidatedTickets: 0, canceledRegistrations: 0, withdrawnWaiters: 0 };
    }
    const tickets = await client.query(
      `UPDATE ve SET trang_thai='VO_HIEU'
         WHERE ma_suat=ANY($1::uuid[]) AND trang_thai='CHUA_SU_DUNG'`,
      [sessionIds],
    );
    const registrations = await client.query(
      `UPDATE dang_ky SET trang_thai='DA_HUY'
         WHERE ma_suat=ANY($1::uuid[])
           AND trang_thai IN ('CHO_PHAN_BO','DANH_SACH_CHO','DA_XAC_NHAN')`,
      [sessionIds],
    );
    const waiting = await client.query(
      `UPDATE muc_danh_sach_cho w SET trang_thai='DA_RUT'
         FROM dang_ky d
         WHERE w.ma_dang_ky=d.ma_dang_ky
           AND d.ma_suat=ANY($1::uuid[])
           AND w.trang_thai='DANG_CHO'`,
      [sessionIds],
    );
    return {
      invalidatedTickets: tickets.rowCount ?? 0,
      canceledRegistrations: registrations.rowCount ?? 0,
      withdrawnWaiters: waiting.rowCount ?? 0,
    };
  }

  private async assertCancelable(client: PoolClient, sessionIds: string[],
    sessions: Array<{ startsAt: Date }>) {
    if (sessions.some(s => s.startsAt.getTime() <= Date.now() + 30 * 60 * 1000)) {
      throw new ConflictException(
        'Không thể hủy khi còn dưới 30 phút đến giờ bắt đầu hoặc suất đã diễn ra',
      );
    }
    if (sessionIds.length === 0) return;
    const used = await client.query(
      `SELECT 1 FROM ve WHERE ma_suat=ANY($1::uuid[])
        AND trang_thai='DA_SU_DUNG' LIMIT 1`,
      [sessionIds],
    );
    if (used.rowCount) {
      throw new ConflictException('Đã có vé được sử dụng; không thể hủy');
    }
  }

  private async writeCancellationAudit(
    client: PoolClient, user: PublicUser, action: string,
    eventId: string, sessionIds: string[],
    affected: { invalidatedTickets: number; canceledRegistrations: number; withdrawnWaiters: number },
  ) {
    await client.query(
      `INSERT INTO nhat_ky_he_thong(ma_nguoi_dung,hanh_dong,chi_tiet)
        VALUES($1,$2,$3::jsonb)`,
      [user.id, action, JSON.stringify({ eventId, sessionIds, ...affected })],
    );
  }

  async cancelEmptyEvent(user: PublicUser, id: string) {
    return this.db.transaction(async client => {
      const event = await this.lockEvent(client, user, id, false);
      if (event.status === 'DA_HUY') throw new ConflictException('Sự kiện đã hủy');
      const allSessions = await client.query<{ id: string; startsAt: Date; status: string }>(
        `SELECT ma_suat AS id,bat_dau AS "startsAt",trang_thai AS status
          FROM suat_su_kien WHERE ma_su_kien=$1 ORDER BY ma_suat FOR UPDATE`,
        [id],
      );
      const active = allSessions.rows.filter(s => s.status !== 'DA_HUY');
      const sessionIds = active.map(s => s.id);
      await this.assertCancelable(client, sessionIds, active);
      const affected = await this.invalidateRegistrations(client, sessionIds);
      await client.query(
        `UPDATE suat_su_kien SET trang_thai='DA_HUY'
           WHERE ma_su_kien=$1 AND trang_thai<>'DA_HUY'`, [id],
      );
      await client.query(
        `UPDATE su_kien SET trang_thai='DA_HUY' WHERE ma_su_kien=$1`, [id],
      );
      await this.writeCancellationAudit(
        client, user, 'HUY_SU_KIEN', id, sessionIds, affected,
      );
      return { id, status: 'DA_HUY', ...affected };
    });
  }

  async cancelSession(user: PublicUser, sessionId: string) {
    return this.db.transaction(async client => {
      const parent = await client.query<{ eventId: string }>(
        `SELECT ma_su_kien AS "eventId" FROM suat_su_kien WHERE ma_suat=$1`,
        [sessionId],
      );
      if (!parent.rows[0]) throw new NotFoundException('Không tìm thấy suất');
      const event = await this.lockEvent(client, user, parent.rows[0].eventId, false);
      if (event.status === 'DA_HUY') throw new ConflictException('Sự kiện đã hủy');
      const locked = await client.query<{ status: string; startsAt: Date }>(
        `SELECT trang_thai AS status,bat_dau AS "startsAt"
          FROM suat_su_kien WHERE ma_suat=$1 FOR UPDATE`,
        [sessionId],
      );
      if (locked.rows[0].status === 'DA_HUY') {
        throw new ConflictException('Suất này đã hủy');
      }
      await this.assertCancelable(client, [sessionId], [locked.rows[0]]);
      const affected = await this.invalidateRegistrations(client, [sessionId]);
      await client.query(
        `UPDATE suat_su_kien SET trang_thai='DA_HUY' WHERE ma_suat=$1`,
        [sessionId],
      );
      await this.writeCancellationAudit(
        client, user, 'HUY_SUAT', event.id, [sessionId], affected,
      );
      return { id: sessionId, status: 'DA_HUY', ...affected };
    });
  }

  async rescheduleSession(user: PublicUser, sessionId: string, body: unknown) {
    const input = rescheduleInput(body);
    return this.db.transaction(async client => {
      const parent = await client.query<{ eventId: string }>(
        `SELECT ma_su_kien AS "eventId" FROM suat_su_kien WHERE ma_suat=$1`,
        [sessionId],
      );
      if (!parent.rows[0]) throw new NotFoundException('Không tìm thấy suất');
      const event = await this.lockEvent(client,user,parent.rows[0].eventId,false);
      if (event.status !== 'NHAP' && event.status !== 'DA_CONG_BO') {
        throw new ConflictException('Sự kiện đã bị hủy');
      }
      const [session] = (await client.query<{
        status: string; startsAt: Date; endsAt: Date; closesAt: Date;
      }>(
        `SELECT trang_thai AS status,bat_dau AS "startsAt",
          ket_thuc AS "endsAt",dong_dang_ky AS "closesAt"
         FROM suat_su_kien WHERE ma_suat=$1 FOR UPDATE`, [sessionId],
      )).rows;
      if (!session || ['DA_HUY','HOAN_TAT'].includes(session.status)) {
        throw new ConflictException('Suất không còn cho phép đổi lịch');
      }
      const now = Date.now();
      if (session.startsAt.getTime() <= now + 30*60*1000) {
        throw new ConflictException('Không đổi lịch khi đã vào khung giờ check-in');
      }
      if (input.startsAt <= session.closesAt) {
        throw new BadRequestException('Giờ bắt đầu mới phải sau giờ đóng đăng ký hiện tại');
      }
      if (input.startsAt.getTime() === session.startsAt.getTime()
          && input.endsAt.getTime() === session.endsAt.getTime()) {
        throw new ConflictException('Lịch mới trùng lịch hiện tại');
      }
      const [participation] = (await client.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM dang_ky
          WHERE ma_suat=$1 AND trang_thai NOT IN ('DA_HUY','TU_CHOI')`,
        [sessionId],
      )).rows;
      const advance = participation.count > 0 ? 24*60*60*1000 : 60*60*1000;
      if (input.startsAt.getTime() <= now + advance) {
        throw new ConflictException(participation.count > 0
          ? 'Có người đăng ký: cần thông báo trước ít nhất 24 giờ'
          : 'Suất mới cần bắt đầu sau ít nhất 60 phút');
      }
      const result = await client.query<{
        id: string; startsAt: Date; endsAt: Date; scheduleChangedAt: Date;
      }>(
        `UPDATE suat_su_kien
        SET bat_dau_cu=bat_dau,ket_thuc_cu=ket_thuc,
            bat_dau=$2,ket_thuc=$3,doi_lich_luc=now(),ly_do_doi_lich=$4
        WHERE ma_suat=$1
        RETURNING ma_suat AS id,bat_dau AS "startsAt",
          ket_thuc AS "endsAt",doi_lich_luc AS "scheduleChangedAt"`,
        [sessionId,input.startsAt,input.endsAt,input.reason],
      );
      await client.query(
        `INSERT INTO nhat_ky_he_thong(ma_nguoi_dung,hanh_dong,chi_tiet)
          VALUES($1,'THAY_DOI_LICH_SUAT',$2::jsonb)`,
        [user.id,JSON.stringify({
          eventId:event.id,sessionId,
          previousStartsAt:session.startsAt,previousEndsAt:session.endsAt,
          nextStartsAt:input.startsAt,nextEndsAt:input.endsAt,
          reason:input.reason,affectedRegistrations:participation.count,
        })],
      );
      return {
        ...result.rows[0],reason:input.reason,
        affectedRegistrations:participation.count,
      };
    });
  }

  async completeSession(user: PublicUser, sessionId: string) {
    return this.db.transaction(async client => {
      const parent = await client.query<{ eventId: string }>(
        `SELECT ma_su_kien AS "eventId" FROM suat_su_kien
           WHERE ma_suat=$1`, [sessionId],
      );
      if (!parent.rows[0]) throw new NotFoundException('Không tìm thấy suất');
      const event = await this.lockEvent(client,user,parent.rows[0].eventId,false);
      if (event.status !== 'DA_CONG_BO') {
        throw new ConflictException('Chỉ hoàn tất suất của sự kiện đã công bố');
      }
      const [session] = (await client.query<{ status: string; endsAt: Date }>(
        `SELECT trang_thai AS status,ket_thuc AS "endsAt"
          FROM suat_su_kien WHERE ma_suat=$1 FOR UPDATE`, [sessionId],
      )).rows;
      if (!session || session.status === 'DA_HUY' || session.status === 'HOAN_TAT') {
        throw new ConflictException('Suất đã hoàn tất hoặc đã hủy');
      }
      if (Date.now() < session.endsAt.getTime()) {
        throw new ConflictException('Chưa đến giờ kết thúc suất');
      }
      const waiting = await client.query(
        `UPDATE dang_ky SET trang_thai='TU_CHOI'
           WHERE ma_suat=$1 AND trang_thai IN ('CHO_PHAN_BO','DANH_SACH_CHO')`,
        [sessionId],
      );
      const queue = await client.query(
        `UPDATE muc_danh_sach_cho w SET trang_thai='DA_RUT'
          FROM dang_ky d WHERE w.ma_dang_ky=d.ma_dang_ky
          AND d.ma_suat=$1 AND w.trang_thai='DANG_CHO'`,
        [sessionId],
      );
      await client.query(
        `UPDATE suat_su_kien SET trang_thai='HOAN_TAT'
          WHERE ma_suat=$1`, [sessionId],
      );
      const expiredRegistrations = waiting.rowCount ?? 0;
      const closedWaitingPositions = queue.rowCount ?? 0;
      await client.query(
        `INSERT INTO nhat_ky_he_thong(ma_nguoi_dung,hanh_dong,chi_tiet)
           VALUES($1,'HOAN_TAT_SUAT',$2::jsonb)`,
        [user.id,JSON.stringify({
          eventId:event.id,sessionId,expiredRegistrations,closedWaitingPositions,
        })],
      );
      return {
        id:sessionId,status:'HOAN_TAT',
        expiredRegistrations,closedWaitingPositions,
      };
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
          s.ma_dia_diem AS "venueId", c.phuong_thuc AS method,
          (c.cau_hinh->>'fcfsQuota')::int AS "fcfsQuota"
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
      const event = await this.lockEvent(client, user, eventId, false);
      if (!['NHAP','DA_CONG_BO'].includes(event.status)) {
        throw new ConflictException('Sự kiện đã hủy hoặc tạm ngưng, không thể thêm suất');
      }
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
    const { method, fcfsQuota } = allocationPolicy(body);
    return this.db.transaction(async client => {
      const parent = await client.query<{ eventId: string }>(
        `SELECT ma_su_kien AS "eventId" FROM suat_su_kien
          WHERE ma_suat=$1`, [sessionId],
      );
      if (!parent.rows[0]) throw new NotFoundException('Không tìm thấy suất');
      const event = await this.lockEvent(client, user, parent.rows[0].eventId, false);
      if (!['NHAP','DA_CONG_BO'].includes(event.status)) {
        throw new ConflictException('Không thể đổi chính sách khi sự kiện đã tạm ngưng hoặc hủy');
      }
      const locked = await client.query<{ capacity: number; opensAt: Date; status: string }>(
        `SELECT suc_chua AS capacity, mo_dang_ky AS "opensAt", trang_thai AS status
         FROM suat_su_kien WHERE ma_suat=$1 FOR UPDATE`, [sessionId],
      );
      const session = locked.rows[0];
      if (session.status === 'DA_HUY' || session.status === 'HOAN_TAT') {
        throw new ConflictException('Không thể cấu hình suất đã hủy hoặc hoàn tất');
      }
      if (method === 'MIXED' && (fcfsQuota === null || fcfsQuota >= session.capacity)) {
        throw new BadRequestException('Vé FCFS phải ít hơn sức chứa để còn vé bốc thăm');
      }
      if (event.status === 'DA_CONG_BO') {
        const existing = await client.query(
          `SELECT 1 FROM dang_ky WHERE ma_suat=$1 LIMIT 1`, [sessionId],
        );
        if (existing.rowCount) {
          throw new ConflictException('Đã có người đăng ký: không được thay đổi chính sách');
        }
      }
      const config = method === 'MIXED' ? { fcfsQuota } : {};
      await client.query(
        `INSERT INTO chinh_sach_phan_bo(ma_suat,phuong_thuc,cau_hinh)
          VALUES($1,$2,$3::jsonb)
          ON CONFLICT(ma_suat) DO UPDATE SET
            phuong_thuc=EXCLUDED.phuong_thuc,
            cau_hinh=EXCLUDED.cau_hinh`,
        [sessionId,method,JSON.stringify(config)],
      );
      if (event.status === 'DA_CONG_BO' && session.status === 'NHAP') {
        await client.query(
          `UPDATE suat_su_kien SET trang_thai=CASE
            WHEN mo_dang_ky<=now() AND dong_dang_ky>now() THEN 'MO_DANG_KY'
            ELSE 'NHAP' END
          WHERE ma_suat=$1`, [sessionId],
        );
      }
      return { sessionId, method, fcfsQuota };
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
