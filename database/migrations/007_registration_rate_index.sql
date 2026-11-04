-- Daily quota can be computed from existing transactional audit log; no new business table.
CREATE INDEX ix_nhat_ky_registrations_24h
 ON nhat_ky_he_thong(ma_nguoi_dung,thoi_gian DESC)
 WHERE hanh_dong IN ('DANG_KY_CHO_LOTTERY',
  'DANG_KY_FCFS_DUOC_VE','DANG_KY_VAO_DANH_SACH_CHO');
INSERT INTO public.schema_migrations(version) VALUES ('007_registration_rate_index.sql');
