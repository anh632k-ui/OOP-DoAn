import {
  BadRequestException, Injectable, NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

type CheckinBody = { sessionId: string; code: string };
type Session = { startsAt: Date; endsAt: Date; status: string; eventStatus: string };
type FoundTicket = { id: string; status: string; registrationStatus: string };

function validateBody(body: unknown): CheckinBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Phải gửi đối tượng JSON');
  }
  const record = body as Record<string, unknown>;
  if (typeof record.sessionId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.sessionId)) {
    throw new BadRequestException('sessionId không hợp lệ');
  }
  if (typeof record.code !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(record.code)) {
    throw new BadRequestException('Mã vé không hợp lệ');
  }
  return { sessionId: record.sessionId, code: record.code };
}

@Injectable()
export class CheckinService {
  constructor(private readonly db: DatabaseService) {}

  async scan(value: unknown) {
    const { sessionId, code } = validateBody(value);
    return this.db.transaction(async client => {
      const s = await client.query<Session>(
        `SELECT s.bat_dau AS "startsAt",s.ket_thuc AS "endsAt",
           s.trang_thai AS status,e.trang_thai AS "eventStatus"
        FROM suat_su_kien s JOIN su_kien e ON e.ma_su_kien=s.ma_su_kien
        WHERE s.ma_suat=$1 FOR SHARE OF s`, [sessionId],
      );
      if (!s.rows[0]) throw new NotFoundException('Không tìm thấy suất');
      const now = new Date();
      const timeOk = now.getTime() >= s.rows[0].startsAt.getTime()-30*60*1000
        && now <= s.rows[0].endsAt;
      const active = s.rows[0].eventStatus === 'DA_CONG_BO'
        && s.rows[0].status !== 'DA_HUY';

      const t = await client.query<FoundTicket>(
        `SELECT v.ma_ve AS id,v.trang_thai AS status,
           d.trang_thai AS "registrationStatus"
        FROM ve v
        JOIN dang_ky d ON d.ma_dang_ky=v.ma_dang_ky
        WHERE v.ma_xac_thuc=$1 AND v.ma_suat=$2
        FOR UPDATE OF v`, [code, sessionId],
      );
      const ticket = t.rows[0];
      let reason: string | null = null;
      if (!active) reason = 'Sự kiện hoặc suất không hoạt động';
      else if (!timeOk) reason = 'Ngoài khung giờ check-in';
      else if (!ticket) reason = 'Không tìm thấy vé cho suất này';
      else if (ticket.status !== 'CHUA_SU_DUNG') reason = 'Vé đã dùng hoặc vô hiệu';
      else if (ticket.registrationStatus !== 'DA_XAC_NHAN') {
        reason = 'Đăng ký không hợp lệ';
      }

      if (reason) {
        await client.query(
          `INSERT INTO ban_ghi_check_in(ma_ve,ma_suat,ket_qua,ly_do)
            VALUES($1,$2,'TU_CHOI',$3)`,
          [ticket?.id ?? null,sessionId,reason],
        );
        return { accepted: false, message: reason, sessionId };
      }
      // A DB trigger and unique index atomically consume this ticket once.
      await client.query(
        `INSERT INTO ban_ghi_check_in(ma_ve,ma_suat,ket_qua)
          VALUES($1,$2,'THANH_CONG')`,
        [ticket!.id,sessionId],
      );
      return { accepted: true, message: 'Check-in thành công', ticketId: ticket!.id, sessionId };
    });
  }

  async stats(id: string) {
    const [session] = await this.db.queryRows<{ id: string; capacity: number; startsAt: Date }>(
      `SELECT ma_suat AS id,suc_chua AS capacity,bat_dau AS "startsAt"
        FROM suat_su_kien WHERE ma_suat=$1`, [id],
    );
    if (!session) throw new NotFoundException('Không tìm thấy suất');
    const [stats] = await this.db.queryRows<{
      tickets: number; used: number; rejected: number;
    }>(
      `SELECT
        (SELECT count(*)::int FROM ve WHERE ma_suat=$1
           AND trang_thai IN ('CHUA_SU_DUNG','DA_SU_DUNG')) AS tickets,
        (SELECT count(*)::int FROM ban_ghi_check_in WHERE ma_suat=$1
           AND ket_qua='THANH_CONG') AS used,
        (SELECT count(*)::int FROM ban_ghi_check_in WHERE ma_suat=$1
           AND ket_qua='TU_CHOI') AS rejected`, [id],
    );
    return { ...session, ...stats };
  }
}
