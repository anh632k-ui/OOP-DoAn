-- MED-06 schema: PostgreSQL 16. Executed once, atomically.
-- Physical names use Vietnamese without accents; ERD's MaX = ma_x.
CREATE TABLE vai_tro (
 ma_vai_tro UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 ten_vai_tro VARCHAR(32) NOT NULL UNIQUE,
 CONSTRAINT ck_vai_tro CHECK (ten_vai_tro IN ('ADMIN','ORGANIZER','CHECKIN','ATTENDEE'))
);
CREATE TABLE nguoi_dung (
 ma_nguoi_dung UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 email VARCHAR(254) NOT NULL,
 ho_ten VARCHAR(160) NOT NULL,
 mat_khau_hash TEXT,
 trang_thai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG',
 tao_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT ck_email CHECK (length(btrim(email)) > 3 AND position('@' IN email) > 1),
 CONSTRAINT ck_nguoi_dung_ten CHECK (length(btrim(ho_ten)) > 0),
 CONSTRAINT ck_nguoi_dung_trang_thai CHECK (trang_thai IN ('HOAT_DONG','KHOA'))
);
CREATE UNIQUE INDEX uq_email_case_insensitive ON nguoi_dung(lower(email));
CREATE TABLE nguoi_dung_vai_tro (
 ma_nguoi_dung UUID NOT NULL REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE,
 ma_vai_tro UUID NOT NULL REFERENCES vai_tro(ma_vai_tro) ON DELETE RESTRICT,
 PRIMARY KEY(ma_nguoi_dung,ma_vai_tro)
);
CREATE TABLE dia_diem (
 ma_dia_diem UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 ten_dia_diem VARCHAR(200) NOT NULL,
 dia_chi TEXT NOT NULL,
 mo_ta TEXT NOT NULL DEFAULT '',
 CONSTRAINT ck_dia_diem_ten CHECK(length(btrim(ten_dia_diem))>0),
 CONSTRAINT ck_dia_diem_dia_chi CHECK(length(btrim(dia_chi))>0)
);
CREATE TABLE su_kien (
 ma_su_kien UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 ma_nguoi_to_chuc UUID NOT NULL REFERENCES nguoi_dung(ma_nguoi_dung),
 ten_su_kien VARCHAR(200) NOT NULL,
 mo_ta TEXT NOT NULL DEFAULT '',
 trang_thai VARCHAR(20) NOT NULL DEFAULT 'NHAP',
 tao_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT ck_su_kien_ten CHECK(length(btrim(ten_su_kien))>0),
 CONSTRAINT ck_su_kien_trang_thai CHECK(trang_thai IN ('NHAP','DA_CONG_BO','DA_HUY'))
);
CREATE TABLE suat_su_kien (
 ma_suat UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 ma_su_kien UUID NOT NULL REFERENCES su_kien(ma_su_kien),
 ma_dia_diem UUID NOT NULL REFERENCES dia_diem(ma_dia_diem),
 bat_dau TIMESTAMPTZ NOT NULL,
 ket_thuc TIMESTAMPTZ NOT NULL,
 suc_chua INTEGER NOT NULL,
 mo_dang_ky TIMESTAMPTZ NOT NULL,
 dong_dang_ky TIMESTAMPTZ NOT NULL,
 trang_thai VARCHAR(24) NOT NULL DEFAULT 'NHAP',
 CONSTRAINT ck_suat_thoi_gian CHECK(ket_thuc>bat_dau AND dong_dang_ky>mo_dang_ky AND dong_dang_ky<=bat_dau),
 CONSTRAINT ck_suat_suc_chua CHECK(suc_chua>0),
 CONSTRAINT ck_suat_trang_thai CHECK(trang_thai IN ('NHAP','MO_DANG_KY','DONG_DANG_KY','HOAN_TAT','DA_HUY'))
);
CREATE INDEX ix_suat_su_kien ON suat_su_kien(ma_su_kien,bat_dau);
CREATE TABLE dac_tinh_tiep_can (
 ma_dac_tinh UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 ten_dac_tinh VARCHAR(120) NOT NULL UNIQUE,
 mo_ta TEXT NOT NULL DEFAULT ''
);
CREATE TABLE su_kien_dac_tinh (
 ma_su_kien UUID NOT NULL REFERENCES su_kien(ma_su_kien) ON DELETE CASCADE,
 ma_dac_tinh UUID NOT NULL REFERENCES dac_tinh_tiep_can(ma_dac_tinh),
 ghi_chu TEXT NOT NULL DEFAULT '',
 PRIMARY KEY(ma_su_kien,ma_dac_tinh)
);
CREATE TABLE chinh_sach_phan_bo (
 ma_chinh_sach UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 ma_suat UUID NOT NULL UNIQUE REFERENCES suat_su_kien(ma_suat),
 phuong_thuc VARCHAR(12) NOT NULL,
 cau_hinh JSONB NOT NULL DEFAULT '{}'::jsonb,
 CONSTRAINT ck_phuong_thuc CHECK(phuong_thuc IN ('FCFS','LOTTERY')),
 CONSTRAINT ck_cau_hinh CHECK(jsonb_typeof(cau_hinh)='object')
);
CREATE TABLE dang_ky (
 ma_dang_ky UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 ma_nguoi_dung UUID NOT NULL REFERENCES nguoi_dung(ma_nguoi_dung),
 ma_suat UUID NOT NULL REFERENCES suat_su_kien(ma_suat),
 thoi_gian_dang_ky TIMESTAMPTZ NOT NULL DEFAULT now(),
 trang_thai VARCHAR(24) NOT NULL DEFAULT 'CHO_PHAN_BO',
 CONSTRAINT ck_dang_ky_trang_thai CHECK(trang_thai IN ('CHO_PHAN_BO','DANH_SACH_CHO','DA_XAC_NHAN','DA_HUY','TU_CHOI')),
 CONSTRAINT uq_dang_ky_id_suat UNIQUE(ma_dang_ky,ma_suat)
);
CREATE UNIQUE INDEX uq_dang_ky_active
 ON dang_ky(ma_nguoi_dung,ma_suat)
 WHERE trang_thai NOT IN ('DA_HUY','TU_CHOI');
CREATE INDEX ix_dang_ky_suat ON dang_ky(ma_suat,thoi_gian_dang_ky,ma_dang_ky);
CREATE TABLE muc_danh_sach_cho (
 ma_muc_cho UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 ma_dang_ky UUID NOT NULL UNIQUE REFERENCES dang_ky(ma_dang_ky),
 thu_tu INTEGER NOT NULL,
 trang_thai VARCHAR(24) NOT NULL DEFAULT 'DANG_CHO',
 CONSTRAINT ck_thu_tu CHECK(thu_tu>0),
 CONSTRAINT ck_trang_thai_cho CHECK(trang_thai IN ('DANG_CHO','DA_DON_LEN','DA_RUT'))
);
CREATE TABLE dot_phan_bo (
 ma_dot UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 ma_suat UUID NOT NULL REFERENCES suat_su_kien(ma_suat),
 thoi_gian TIMESTAMPTZ NOT NULL DEFAULT now(),
 trang_thai VARCHAR(24) NOT NULL DEFAULT 'DANG_THUC_HIEN',
 CONSTRAINT ck_dot_trang_thai CHECK(trang_thai IN ('DANG_THUC_HIEN','HOAN_TAT','THAT_BAI'))
);
CREATE INDEX ix_dot_suat ON dot_phan_bo(ma_suat,thoi_gian);
CREATE TABLE ket_qua_phan_bo (
 ma_ket_qua UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 ma_dot UUID NOT NULL REFERENCES dot_phan_bo(ma_dot),
 ma_dang_ky UUID NOT NULL REFERENCES dang_ky(ma_dang_ky),
 duoc_cap_ve BOOLEAN NOT NULL,
 thu_tu_du_phong INTEGER,
 CONSTRAINT uq_ket_qua UNIQUE(ma_dot,ma_dang_ky),
 CONSTRAINT ck_thu_tu_du_phong CHECK(thu_tu_du_phong IS NULL OR thu_tu_du_phong>0)
);
CREATE TABLE ve (
 ma_ve UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 ma_dang_ky UUID NOT NULL UNIQUE,
 ma_suat UUID NOT NULL,
 ma_xac_thuc VARCHAR(128) NOT NULL UNIQUE,
 ngay_cap TIMESTAMPTZ NOT NULL DEFAULT now(),
 trang_thai VARCHAR(24) NOT NULL DEFAULT 'CHUA_SU_DUNG',
 CONSTRAINT fk_ve_dang_ky_suat FOREIGN KEY(ma_dang_ky,ma_suat)
   REFERENCES dang_ky(ma_dang_ky,ma_suat),
 CONSTRAINT uq_ve_id_suat UNIQUE(ma_ve,ma_suat),
 CONSTRAINT ck_ve_trang_thai CHECK(trang_thai IN ('CHUA_SU_DUNG','DA_SU_DUNG','VO_HIEU'))
);
CREATE INDEX ix_ve_suat ON ve(ma_suat,trang_thai);
CREATE TABLE ban_ghi_check_in (
 ma_check_in UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 ma_ve UUID,
 ma_suat UUID NOT NULL REFERENCES suat_su_kien(ma_suat),
 thoi_gian TIMESTAMPTZ NOT NULL DEFAULT now(),
 ket_qua VARCHAR(16) NOT NULL,
 ly_do VARCHAR(200),
 CONSTRAINT fk_checkin_ve_suat FOREIGN KEY(ma_ve,ma_suat)
   REFERENCES ve(ma_ve,ma_suat),
 CONSTRAINT ck_checkin_result CHECK(ket_qua IN ('THANH_CONG','TU_CHOI')),
 CONSTRAINT ck_checkin_success_ve CHECK(ket_qua <> 'THANH_CONG' OR ma_ve IS NOT NULL)
);
CREATE UNIQUE INDEX uq_one_successful_checkin
 ON ban_ghi_check_in(ma_ve) WHERE ket_qua='THANH_CONG';
CREATE INDEX ix_checkin_suat ON ban_ghi_check_in(ma_suat,thoi_gian);
CREATE TABLE nhat_ky_he_thong (
 ma_nhat_ky UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 ma_nguoi_dung UUID REFERENCES nguoi_dung(ma_nguoi_dung),
 hanh_dong VARCHAR(160) NOT NULL,
 chi_tiet JSONB NOT NULL DEFAULT '{}'::jsonb,
 thoi_gian TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT ck_nhat_ky_chi_tiet CHECK(jsonb_typeof(chi_tiet)='object')
);

-- Row-level locking on the session serializes concurrent ticket issuance.
CREATE FUNCTION med06_enforce_ticket_capacity()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE allowed INTEGER; used_seats INTEGER;
BEGIN
 IF NEW.trang_thai NOT IN ('CHUA_SU_DUNG','DA_SU_DUNG') THEN RETURN NEW; END IF;
 SELECT suc_chua INTO allowed FROM suat_su_kien WHERE ma_suat=NEW.ma_suat FOR UPDATE;
 SELECT count(*) INTO used_seats FROM ve
   WHERE ma_suat=NEW.ma_suat
   AND trang_thai IN ('CHUA_SU_DUNG','DA_SU_DUNG')
   AND ma_ve <> NEW.ma_ve;
 IF used_seats >= allowed THEN
   RAISE EXCEPTION 'Suat % da het cho', NEW.ma_suat USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_ve_capacity
 BEFORE INSERT OR UPDATE OF trang_thai,ma_suat ON ve
 FOR EACH ROW EXECUTE FUNCTION med06_enforce_ticket_capacity();

CREATE FUNCTION med06_check_session_capacity()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.suc_chua < (SELECT count(*) FROM ve WHERE ma_suat=NEW.ma_suat
   AND trang_thai IN ('CHUA_SU_DUNG','DA_SU_DUNG')) THEN
   RAISE EXCEPTION 'Khong the giam suc chua duoi so ve da cap' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_suat_capacity
 BEFORE UPDATE OF suc_chua ON suat_su_kien
 FOR EACH ROW EXECUTE FUNCTION med06_check_session_capacity();

-- Ticket row lock and status update are atomic with a successful check-in.
CREATE FUNCTION med06_consume_ticket_at_checkin()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE current_status VARCHAR(24);
BEGIN
 IF NEW.ket_qua <> 'THANH_CONG' THEN RETURN NEW; END IF;
 SELECT trang_thai INTO current_status FROM ve
   WHERE ma_ve=NEW.ma_ve AND ma_suat=NEW.ma_suat FOR UPDATE;
 IF current_status IS DISTINCT FROM 'CHUA_SU_DUNG' THEN
   RAISE EXCEPTION 'Ve khong hop le hoac da su dung' USING ERRCODE='23514';
 END IF;
 UPDATE ve SET trang_thai='DA_SU_DUNG' WHERE ma_ve=NEW.ma_ve;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_checkin_consume
 BEFORE INSERT ON ban_ghi_check_in
 FOR EACH ROW EXECUTE FUNCTION med06_consume_ticket_at_checkin();

-- run-migrations.sh uses --single-transaction, so this marker commits
-- together with all DDL. Failed migrations never appear as applied.
INSERT INTO public.schema_migrations(version) VALUES ('001_init.sql');
