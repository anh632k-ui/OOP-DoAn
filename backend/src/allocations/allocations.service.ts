import {
  ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { PublicUser } from '../auth/auth.types';
import { appendAudit } from '../audit/audit';
import { RegistrationsService } from '../registrations/registrations.service';
import { lotteryOrder } from './lottery';

type DrawSession = {
  id: string; eventId: string; organizerId: string;
  status: string; eventStatus: string;
  startsAt: Date; closesAt: Date; capacity: number;
  method: 'FCFS' | 'LOTTERY' | 'MIXED';
};
type Pending = { id: string };
type Seats = { seats: number };
type DrawInfo = {
  id: string; seed: string; sha256: string; status: string; drawnAt: Date;
};
type DrawResult = {
  registrationId: string; attendeeName: string;
  won: boolean; waitingPosition: number | null;
};

@Injectable()
export class AllocationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AllocationsService.name);
  private drawTimer: ReturnType<typeof setInterval> | null = null;
  private checking = false;

  onModuleInit() {
    void this.drawDueSessions();
    this.drawTimer = setInterval(() => void this.drawDueSessions(), 60_000);
    this.drawTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.drawTimer) clearInterval(this.drawTimer);
  }

  // Work is performed by the backend, even when no organizer is logged in.
  // A session row lock and one-round rule prevent duplicate allocation.
  private async drawDueSessions() {
    if (this.checking) return;
    this.checking = true;
    try {
      const due = await this.db.queryRows<{ id: string }>(
        `SELECT s.ma_suat AS id FROM suat_su_kien s
         JOIN su_kien e ON e.ma_su_kien=s.ma_su_kien
         JOIN chinh_sach_phan_bo c ON c.ma_suat=s.ma_suat
         WHERE e.trang_thai='DA_CONG_BO'
           AND s.trang_thai NOT IN ('DA_HUY','HOAN_TAT')
           AND c.phuong_thuc IN ('LOTTERY','MIXED')
           AND s.dong_dang_ky<=now() AND s.bat_dau>now()
           AND NOT EXISTS(SELECT 1 FROM dot_phan_bo d WHERE d.ma_suat=s.ma_suat)
         ORDER BY s.dong_dang_ky LIMIT 20`,
      );
      for (const { id } of due) {
        try { await this.draw(null,id); }
        catch (e) { this.logger.warn(`Bốc thăm tự động thất bại cho suất ${id}: ${String(e)}`); }
      }
    } catch (e) { this.logger.warn('Không thể kiểm tra lịch bốc thăm: ' + String(e)); }
    finally { this.checking = false; }
  }

  constructor(
    private readonly db: DatabaseService,
    private readonly registrations: RegistrationsService,
  ) {}

  async draw(user: PublicUser | null, sessionId: string) {
    return this.db.transaction(async client => {
      const result = await client.query<DrawSession>(
        `SELECT s.ma_suat AS id, s.ma_su_kien AS "eventId",
          e.ma_nguoi_to_chuc AS "organizerId",s.trang_thai AS status,
          e.trang_thai AS "eventStatus",s.bat_dau AS "startsAt",
          s.dong_dang_ky AS "closesAt",s.suc_chua AS capacity,
          c.phuong_thuc AS method
        FROM suat_su_kien s
        JOIN su_kien e ON e.ma_su_kien=s.ma_su_kien
        JOIN chinh_sach_phan_bo c ON c.ma_suat=s.ma_suat
        WHERE s.ma_suat=$1 FOR UPDATE OF s`, [sessionId],
      );
      const session = result.rows[0];
      if (!session) throw new NotFoundException('Không tìm thấy suất');
      if (user && !user.roles.includes('ADMIN') && session.organizerId !== user.id) {
        throw new ForbiddenException('Không được phân bổ vé cho suất này');
      }
      if (session.method !== 'LOTTERY' && session.method !== 'MIXED') {
        throw new ConflictException('Suất này không sử dụng bốc thăm');
      }
      const now = new Date();
      if (session.eventStatus !== 'DA_CONG_BO' || session.status === 'DA_HUY'
        || now < session.closesAt || now >= session.startsAt) {
        throw new ConflictException('Chỉ bốc thăm sau hạn đăng ký và trước giờ diễn ra');
      }
      const previous = await client.query(
        `SELECT 1 FROM dot_phan_bo WHERE ma_suat=$1 LIMIT 1`, [sessionId],
      );
      if (previous.rowCount) {
        throw new ConflictException('Suất này đã được phân bổ, không thể bốc thăm lại');
      }
      const registered = await client.query<Pending>(
        `SELECT ma_dang_ky AS id FROM dang_ky
          WHERE ma_suat=$1 AND trang_thai='CHO_PHAN_BO'
          ORDER BY thoi_gian_dang_ky,ma_dang_ky FOR UPDATE`, [sessionId],
      );
      const occupied = await client.query<Seats>(
        `SELECT count(*)::int AS seats FROM ve
          WHERE ma_suat=$1 AND trang_thai IN ('CHUA_SU_DUNG','DA_SU_DUNG')`,
        [sessionId],
      );
      const available = Math.max(0, session.capacity - occupied.rows[0].seats);
      const seed = randomBytes(32).toString('hex');
      const sha256 = createHash('sha256').update(Buffer.from(seed, 'hex')).digest('hex');
      const round = await client.query<{ id: string }>(
        `INSERT INTO dot_phan_bo(ma_suat,audit_seed,seed_sha256)
          VALUES($1,$2,$3) RETURNING ma_dot AS id`, [sessionId,seed,sha256],
      );
      const roundId = round.rows[0].id;
      const order = lotteryOrder(registered.rows.map(r => r.id), seed);
      const winners = Math.min(order.length, available);

      for (let i = 0; i < order.length; i++) {
        const id = order[i], won = i < winners;
        await client.query(
          `INSERT INTO ket_qua_phan_bo(ma_dot,ma_dang_ky,duoc_cap_ve,thu_tu_du_phong)
            VALUES($1,$2,$3,$4)`,
          [roundId,id,won,won ? null : i-winners+1],
        );
        if (won) {
          await this.registrations.issueTicket(client,id,sessionId);
          await client.query(
            `UPDATE dang_ky SET trang_thai='DA_XAC_NHAN'
              WHERE ma_dang_ky=$1`, [id],
          );
        } else {
          await client.query(
            `UPDATE dang_ky SET trang_thai='DANH_SACH_CHO'
              WHERE ma_dang_ky=$1`, [id],
          );
          await client.query(
            `INSERT INTO muc_danh_sach_cho(ma_dang_ky,thu_tu)
              VALUES($1,$2)`, [id,i-winners+1],
          );
        }
      }
      await client.query(
        `UPDATE dot_phan_bo SET trang_thai='HOAN_TAT' WHERE ma_dot=$1`,
        [roundId],
      );
      await client.query(
        `UPDATE suat_su_kien SET trang_thai='DONG_DANG_KY'
          WHERE ma_suat=$1`, [sessionId],
      );
      await appendAudit(client,user?.id ?? null,'PHAN_BO_LOTTERY',{
        sessionId,roundId,applicants:order.length,winners,
        waiting:order.length-winners,seedSha256:sha256,
      });
      return {
        roundId, sessionId, method: session.method, applicantCount: order.length,
        winners, waitlisted: order.length-winners, seedSha256: sha256, auditSeed: seed,
      };
    });
  }

  async report(user: PublicUser, sessionId: string) {
    const rows = await this.db.queryRows<DrawInfo & { organizerId: string }>(
      `SELECT d.ma_dot AS id,d.audit_seed AS seed,d.seed_sha256 AS sha256,
        d.trang_thai AS status,d.thoi_gian AS "drawnAt",
        e.ma_nguoi_to_chuc AS "organizerId"
      FROM dot_phan_bo d
      JOIN suat_su_kien s ON s.ma_suat=d.ma_suat
      JOIN su_kien e ON e.ma_su_kien=s.ma_su_kien
      WHERE d.ma_suat=$1 ORDER BY d.thoi_gian DESC LIMIT 1`, [sessionId],
    );
    if (!rows[0]) throw new NotFoundException('Chưa có đợt bốc thăm');
    if (!user.roles.includes('ADMIN') && rows[0].organizerId !== user.id) {
      throw new ForbiddenException('Không được xem kết quả bốc thăm');
    }
    const details = await this.db.queryRows<DrawResult>(
      `SELECT k.ma_dang_ky AS "registrationId",n.ho_ten AS "attendeeName",
        k.duoc_cap_ve AS won,k.thu_tu_du_phong AS "waitingPosition"
      FROM ket_qua_phan_bo k
      JOIN dang_ky d ON d.ma_dang_ky=k.ma_dang_ky
      JOIN nguoi_dung n ON n.ma_nguoi_dung=d.ma_nguoi_dung
      WHERE k.ma_dot=$1
      ORDER BY k.duoc_cap_ve DESC,k.thu_tu_du_phong NULLS FIRST,k.ma_dang_ky`,
      [rows[0].id],
    );
    const [roundTotal] = await this.db.queryRows<{ count: number }>(
      `SELECT count(*)::int AS count FROM dot_phan_bo WHERE ma_suat=$1`, [sessionId],
    );
    return {
      roundId: rows[0].id, drawnAt: rows[0].drawnAt,
      roundCount: roundTotal.count,
      seedSha256: rows[0].sha256,
      auditSeed: rows[0].seed, status: rows[0].status,
      results: details,
    };
  }
}
