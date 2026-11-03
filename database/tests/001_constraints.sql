-- PostgreSQL invariant tests. Run only after migration and demo seed.
-- Test changes are rolled back.
BEGIN;
DO $$
DECLARE
 reg1 UUID;
 reg2 UUID;
 ticket1 UUID;
BEGIN
 IF (SELECT count(*) FROM su_kien WHERE trang_thai='DA_CONG_BO') < 2
    OR (SELECT count(*) FROM suat_su_kien) < 3 THEN
   RAISE EXCEPTION 'FAIL: demo events or sessions missing';
 END IF;
 IF (SELECT count(*) FROM schema_migrations WHERE version='001_init.sql') <> 1 THEN
   RAISE EXCEPTION 'FAIL: migration not recorded once';
 END IF;

 INSERT INTO dang_ky(ma_nguoi_dung,ma_suat,trang_thai)
 VALUES ('20000000-0000-4000-8000-000000000002',
         '50000000-0000-4000-8000-000000000003','DA_XAC_NHAN')
 RETURNING ma_dang_ky INTO reg1;

 BEGIN
   INSERT INTO dang_ky(ma_nguoi_dung,ma_suat,trang_thai)
   VALUES ('20000000-0000-4000-8000-000000000002',
           '50000000-0000-4000-8000-000000000003','CHO_PHAN_BO');
   RAISE EXCEPTION 'FAIL: duplicate active registration accepted';
 EXCEPTION WHEN unique_violation THEN NULL;
 END;

 INSERT INTO dang_ky(ma_nguoi_dung,ma_suat,trang_thai)
 VALUES ('20000000-0000-4000-8000-000000000003',
         '50000000-0000-4000-8000-000000000003','DA_XAC_NHAN')
 RETURNING ma_dang_ky INTO reg2;

 INSERT INTO ve(ma_dang_ky,ma_suat,ma_xac_thuc)
 VALUES(reg1,'50000000-0000-4000-8000-000000000003','test-token-a')
 RETURNING ma_ve INTO ticket1;

 BEGIN
   INSERT INTO ve(ma_dang_ky,ma_suat,ma_xac_thuc)
   VALUES(reg2,'50000000-0000-4000-8000-000000000003','test-token-b');
   RAISE EXCEPTION 'FAIL: session capacity overflow accepted';
 EXCEPTION WHEN check_violation THEN NULL;
 END;

 INSERT INTO ban_ghi_check_in(ma_ve,ma_suat,ket_qua)
 VALUES(ticket1,'50000000-0000-4000-8000-000000000003','THANH_CONG');

 IF (SELECT trang_thai FROM ve WHERE ma_ve=ticket1) <> 'DA_SU_DUNG' THEN
   RAISE EXCEPTION 'FAIL: check-in did not consume the ticket';
 END IF;

 BEGIN
   INSERT INTO ban_ghi_check_in(ma_ve,ma_suat,ket_qua)
   VALUES(ticket1,'50000000-0000-4000-8000-000000000003','THANH_CONG');
   RAISE EXCEPTION 'FAIL: duplicate successful check-in accepted';
 EXCEPTION WHEN check_violation OR unique_violation THEN NULL;
 END;

 RAISE NOTICE 'PASS: migration, seed, uniqueness, capacity and check-in';
END $$;
ROLLBACK;
