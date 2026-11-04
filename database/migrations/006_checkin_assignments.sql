-- New implementation association. Update final ERD addendum after code review.
CREATE TABLE phan_cong_check_in (
  ma_suat UUID NOT NULL REFERENCES suat_su_kien(ma_suat) ON DELETE RESTRICT,
  ma_nguoi_dung UUID NOT NULL REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE RESTRICT,
  ma_nguoi_phan_cong UUID NOT NULL REFERENCES nguoi_dung(ma_nguoi_dung),
  thoi_gian TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ma_suat,ma_nguoi_dung)
);
CREATE INDEX ix_phan_cong_staff ON phan_cong_check_in(ma_nguoi_dung,ma_suat);
INSERT INTO public.schema_migrations(version) VALUES ('006_checkin_assignments.sql');
