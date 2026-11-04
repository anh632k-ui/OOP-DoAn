import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
  accessibility: Array<{ name: string; note: string }>;
  hasCover: boolean;
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

  async listPublished(q?: string, featureId?: string): Promise<{ items: EventSummary[] }> {
    if (q !== undefined && (typeof q !== 'string' || q.length > 100)) {
      throw new BadRequestException('Từ khóa tối đa 100 ký tự');
    }
    if (featureId !== undefined && (
      typeof featureId !== 'string'
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(featureId)
    )) {
      throw new BadRequestException('featureId phải là UUID hợp lệ');
    }
    const normalized = q?.trim();
    const pattern = normalized ? '%' + normalized.replace(/[\\%_]/g, '\\$&') + '%' : null;
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
        AND ($1::text IS NULL OR e.ten_su_kien ILIKE $1 ESCAPE '\\'
          OR e.mo_ta ILIKE $1 ESCAPE '\\')
        AND ($2::uuid IS NULL OR EXISTS (
          SELECT 1 FROM su_kien_dac_tinh sd
          WHERE sd.ma_su_kien=e.ma_su_kien AND sd.ma_dac_tinh=$2
        ))
      GROUP BY e.ma_su_kien
      ORDER BY "nextSessionAt" NULLS LAST, e.ten_su_kien
      LIMIT 50
      `,
      [pattern, featureId ?? null],
    );
    return { items };
  }

  async accessibilityOptions() {
    return { items: await this.database.queryRows(
      `SELECT ma_dac_tinh AS id,ten_dac_tinh AS name
        FROM dac_tinh_tiep_can ORDER BY ten_dac_tinh`,
    ) };
  }

  async getPublished(id: string): Promise<EventDetail> {
    const [event] = await this.database.queryRows<EventDetail>(
      `
      SELECT e.ma_su_kien AS id,
             e.ten_su_kien AS title,
             e.mo_ta AS description,
             (e.anh_bia_key IS NOT NULL) AS "hasCover",
             COALESCE((
               SELECT jsonb_agg(jsonb_build_object(
                 'name', d.ten_dac_tinh, 'note', sd.ghi_chu
               ) ORDER BY d.ten_dac_tinh)
               FROM su_kien_dac_tinh sd
               JOIN dac_tinh_tiep_can d ON d.ma_dac_tinh=sd.ma_dac_tinh
               WHERE sd.ma_su_kien=e.ma_su_kien
             ), '[]'::jsonb) AS accessibility
      FROM su_kien e
      WHERE e.ma_su_kien = $1 AND e.trang_thai = 'DA_CONG_BO'
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
             s.bat_dau_cu AS "previousStartsAt",
             s.doi_lich_luc AS "scheduleChangedAt",
             s.ly_do_doi_lich AS "scheduleChangeReason",
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
