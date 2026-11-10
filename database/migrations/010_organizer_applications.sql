-- Attendees can request organizer access without granting themselves any role.
CREATE TABLE yeu_cau_to_chuc (
  ma_yeu_cau UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_nguoi_dung UUID NOT NULL UNIQUE REFERENCES nguoi_dung(ma_nguoi_dung),
  ly_do VARCHAR(500) NOT NULL,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'CHO_DUYET'
    CHECK (trang_thai IN ('CHO_DUYET','DA_DUYET','TU_CHOI')),
  tao_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
  xu_ly_luc TIMESTAMPTZ,
  ma_nguoi_duyet UUID REFERENCES nguoi_dung(ma_nguoi_dung)
);
CREATE INDEX ix_yeu_cau_to_chuc_trang_thai ON yeu_cau_to_chuc(trang_thai,tao_luc DESC);
INSERT INTO public.schema_migrations(version) VALUES ('010_organizer_applications.sql');
