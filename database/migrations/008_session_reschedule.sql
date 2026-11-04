-- Retain latest previous schedule and attendee-visible change reason.
-- Full historical sequence is preserved in nhat_ky_he_thong.
ALTER TABLE suat_su_kien ADD COLUMN bat_dau_cu TIMESTAMPTZ;
ALTER TABLE suat_su_kien ADD COLUMN ket_thuc_cu TIMESTAMPTZ;
ALTER TABLE suat_su_kien ADD COLUMN doi_lich_luc TIMESTAMPTZ;
ALTER TABLE suat_su_kien ADD COLUMN ly_do_doi_lich VARCHAR(500);
INSERT INTO public.schema_migrations(version) VALUES ('008_session_reschedule.sql');
