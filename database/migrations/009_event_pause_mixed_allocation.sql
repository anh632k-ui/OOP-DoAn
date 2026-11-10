-- Support pausing published events and allocating one session with FCFS + lottery.
ALTER TABLE su_kien DROP CONSTRAINT ck_su_kien_trang_thai;
ALTER TABLE su_kien ADD CONSTRAINT ck_su_kien_trang_thai
  CHECK (trang_thai IN ('NHAP','DA_CONG_BO','TAM_NGUNG','DA_HUY'));
ALTER TABLE chinh_sach_phan_bo DROP CONSTRAINT ck_phuong_thuc;
ALTER TABLE chinh_sach_phan_bo ADD CONSTRAINT ck_phuong_thuc
  CHECK (phuong_thuc IN ('FCFS','LOTTERY','MIXED'));
ALTER TABLE chinh_sach_phan_bo ADD CONSTRAINT ck_mixed_quota
  CHECK (phuong_thuc <> 'MIXED' OR
    (cau_hinh ? 'fcfsQuota' AND (cau_hinh->>'fcfsQuota') ~ '^[0-9]+$'));
INSERT INTO public.schema_migrations(version)
VALUES ('009_event_pause_mixed_allocation.sql');
