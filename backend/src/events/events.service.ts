import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type EventSummary = {
  id: string;
  title: string;
  description: string;
  sessionCount: number;
  nextSessionAt: Date | null;
};

export type EventDetail = {
  id: string;
  title: string;
  description: string;
};

export type SessionSummary = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  issuedSeats: number;
  status: string;
  registrationOpensAt: Date;
  registrationClosesAt: Date;
  allocationMethod: string | null;
  venue: string;
  address: string;
};

@Injectable()
export class EventsService {
  constructor(private readonly database: DatabaseService) {}

  async listPublished(): Promise<{ items: EventSummary[] }> {
    const items = await this.database.queryRows<EventSummary>(
      `
      SELECT e.ma_su_kien AS id,
             e.ten_su_kien AS title,
             e.mo_ta AS description,
             count(s.ma_suat)::int AS "sessionCount",
             min(s.bat_dau) AS "nextSessionAt"
      FROM su_kien e
      LEFT JOIN suat_su_kien s
        ON s.ma_su_kien = e.ma_su_kien AND s.trang_thai <> 'DA_HUY'
      WHERE e.trang_thai = 'DA_CONG_BO'
      GROUP BY e.ma_su_kien
      ORDER BY "nextSessionAt" NULLS LAST, e.ten_su_kien
      LIMIT 50
      `,
    );
    return { items };
  }

  async getPublished(id: string): Promise<EventDetail> {
    const [event] = await this.database.queryRows<EventDetail>(
      `
      SELECT ma_su_kien AS id,
             ten_su_kien AS title,
             mo_ta AS description
      FROM su_kien
      WHERE ma_su_kien = $1 AND trang_thai = 'DA_CONG_BO'
      `,
      [id],
    );
    if (!event) {
      throw new NotFoundException('Không tìm thấy sự kiện đã công bố');
    }
    return event;
  }

  async listSessions(id: string): Promise<{ items: SessionSummary[] }> {
    await this.getPublished(id);
    const items = await this.database.queryRows<SessionSummary>(
      `
      SELECT s.ma_suat AS id,
             s.bat_dau AS "startsAt",
             s.ket_thuc AS "endsAt",
             s.suc_chua AS capacity,
             s.trang_thai AS status,
             s.mo_dang_ky AS "registrationOpensAt",
             s.dong_dang_ky AS "registrationClosesAt",
             d.ten_dia_diem AS venue,
             d.dia_chi AS address,
             c.phuong_thuc AS "allocationMethod",
             (SELECT count(*)::int FROM ve v
                WHERE v.ma_suat = s.ma_suat
                  AND v.trang_thai IN ('CHUA_SU_DUNG','DA_SU_DUNG')
             ) AS "issuedSeats"
      FROM suat_su_kien s
      JOIN dia_diem d ON d.ma_dia_diem = s.ma_dia_diem
      LEFT JOIN chinh_sach_phan_bo c ON c.ma_suat = s.ma_suat
      WHERE s.ma_su_kien = $1 AND s.trang_thai <> 'DA_HUY'
      ORDER BY s.bat_dau, s.ma_suat
      LIMIT 100
      `,
      [id],
    );
    return { items };
  }
}
