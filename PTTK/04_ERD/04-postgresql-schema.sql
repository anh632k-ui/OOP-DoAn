-- MED-06 - Lược đồ vật lý PostgreSQL bản tiếng Việt
-- Mục tiêu: hiện thực hóa ERD giữa kỳ bằng tên bảng/cột tiếng Việt không dấu.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE vai_tro_nguoi_dung AS ENUM ('NGUOI_THAM_DU', 'BAN_TO_CHUC', 'NHAN_VIEN', 'QUAN_TRI_VIEN');
CREATE TYPE trang_thai_tai_khoan AS ENUM ('HOAT_DONG', 'BI_KHOA');
CREATE TYPE trang_thai_su_kien AS ENUM ('NHAP', 'DA_CONG_BO', 'HOAN_THANH', 'DA_HUY');
CREATE TYPE trang_thai_suat AS ENUM (
  'NHAP',
  'DANG_MO_DANG_KY',
  'DA_DONG_DANG_KY',
  'DANG_DIEN_RA',
  'HOAN_THANH',
  'DA_HUY'
);
CREATE TYPE chinh_sach_phan_bo AS ENUM ('FCFS', 'LOTTERY');
CREATE TYPE trang_thai_dang_ky AS ENUM ('CHO_XU_LY', 'DA_XAC_NHAN', 'DANH_SACH_CHO', 'DA_HUY');
CREATE TYPE trang_thai_danh_sach_cho AS ENUM ('DANG_CHO', 'DA_DUOC_CHON', 'DA_HUY');
CREATE TYPE trang_thai_ve AS ENUM ('HOP_LE', 'DA_SU_DUNG', 'DA_HUY', 'HET_HAN');
CREATE TYPE phuong_thuc_check_in AS ENUM ('QR', 'MA_THU_CONG');

CREATE TABLE nguoi_dung (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ho_ten VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  mat_khau_bam VARCHAR(255) NOT NULL,
  vai_tro vai_tro_nguoi_dung NOT NULL,
  trang_thai trang_thai_tai_khoan NOT NULL DEFAULT 'HOAT_DONG',
  tao_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
  cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE dia_diem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ten VARCHAR(200) NOT NULL,
  dia_chi TEXT NOT NULL,
  suc_chua INTEGER NOT NULL CHECK (suc_chua > 0),
  tao_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
  cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE su_kien (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_nguoi_to_chuc UUID NOT NULL REFERENCES nguoi_dung(id) ON DELETE RESTRICT,
  ma_dia_diem UUID NOT NULL REFERENCES dia_diem(id) ON DELETE RESTRICT,
  ten VARCHAR(200) NOT NULL,
  mo_ta TEXT,
  trang_thai trang_thai_su_kien NOT NULL DEFAULT 'NHAP',
  bat_dau_luc TIMESTAMPTZ NOT NULL,
  ket_thuc_luc TIMESTAMPTZ NOT NULL,
  url_anh TEXT,
  tao_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
  cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kt_su_kien_thoi_gian CHECK (bat_dau_luc < ket_thuc_luc)
);

CREATE TABLE suat_su_kien (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_su_kien UUID NOT NULL REFERENCES su_kien(id) ON DELETE RESTRICT,
  bat_dau_luc TIMESTAMPTZ NOT NULL,
  ket_thuc_luc TIMESTAMPTZ NOT NULL,
  suc_chua INTEGER NOT NULL CHECK (suc_chua > 0),
  mo_dang_ky_luc TIMESTAMPTZ NOT NULL,
  dong_dang_ky_luc TIMESTAMPTZ NOT NULL,
  chinh_sach_phan_bo chinh_sach_phan_bo NOT NULL,
  trang_thai trang_thai_suat NOT NULL DEFAULT 'NHAP',
  tao_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
  cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kt_suat_thoi_gian CHECK (bat_dau_luc < ket_thuc_luc),
  CONSTRAINT kt_suat_cua_so_dang_ky CHECK (mo_dang_ky_luc < dong_dang_ky_luc),
  CONSTRAINT kt_suat_dong_truoc_bat_dau CHECK (dong_dang_ky_luc <= bat_dau_luc)
);

CREATE TABLE dang_ky (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_nguoi_tham_du UUID NOT NULL REFERENCES nguoi_dung(id) ON DELETE RESTRICT,
  ma_suat UUID NOT NULL REFERENCES suat_su_kien(id) ON DELETE RESTRICT,
  trang_thai trang_thai_dang_ky NOT NULL DEFAULT 'CHO_XU_LY',
  dang_ky_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
  cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_dang_ky_nguoi_suat UNIQUE (ma_nguoi_tham_du, ma_suat)
);

CREATE TABLE danh_sach_cho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_dang_ky UUID NOT NULL UNIQUE REFERENCES dang_ky(id) ON DELETE RESTRICT,
  thu_tu BIGINT NOT NULL CHECK (thu_tu > 0),
  vao_danh_sach_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
  trang_thai trang_thai_danh_sach_cho NOT NULL DEFAULT 'DANG_CHO',
  cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ve (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_dang_ky UUID NOT NULL UNIQUE REFERENCES dang_ky(id) ON DELETE RESTRICT,
  ma_ve VARCHAR(100) NOT NULL UNIQUE,
  ma_qr TEXT NOT NULL,
  trang_thai trang_thai_ve NOT NULL DEFAULT 'HOP_LE',
  phat_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
  cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE check_in (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_ve UUID NOT NULL UNIQUE REFERENCES ve(id) ON DELETE RESTRICT,
  ma_nhan_vien UUID NOT NULL REFERENCES nguoi_dung(id) ON DELETE RESTRICT,
  check_in_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
  phuong_thuc phuong_thuc_check_in NOT NULL
);

CREATE TABLE dac_tinh_tiep_can (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ten VARCHAR(120) NOT NULL UNIQUE,
  mo_ta TEXT
);

CREATE TABLE su_kien_tiep_can (
  ma_su_kien UUID NOT NULL REFERENCES su_kien(id) ON DELETE CASCADE,
  ma_dac_tinh UUID NOT NULL REFERENCES dac_tinh_tiep_can(id) ON DELETE RESTRICT,
  PRIMARY KEY (ma_su_kien, ma_dac_tinh)
);

CREATE TABLE lan_phan_bo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_suat UUID NOT NULL UNIQUE REFERENCES suat_su_kien(id) ON DELETE RESTRICT,
  ma_nguoi_thuc_hien UUID NOT NULL REFERENCES nguoi_dung(id) ON DELETE RESTRICT,
  chinh_sach chinh_sach_phan_bo NOT NULL,
  thuc_hien_luc TIMESTAMPTZ NOT NULL DEFAULT now(),
  so_ung_vien INTEGER NOT NULL CHECK (so_ung_vien >= 0),
  so_xac_nhan INTEGER NOT NULL CHECK (so_xac_nhan >= 0),
  du_lieu_kiem_chung JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT kt_lan_phan_bo_so_luong CHECK (so_xac_nhan <= so_ung_vien)
);

CREATE INDEX idx_su_kien_nguoi_to_chuc ON su_kien(ma_nguoi_to_chuc);
CREATE INDEX idx_su_kien_trang_thai ON su_kien(trang_thai);
CREATE INDEX idx_su_kien_bat_dau ON su_kien(bat_dau_luc);

CREATE INDEX idx_suat_su_kien ON suat_su_kien(ma_su_kien);
CREATE INDEX idx_suat_trang_thai ON suat_su_kien(trang_thai);
CREATE INDEX idx_suat_cua_so_dang_ky ON suat_su_kien(mo_dang_ky_luc, dong_dang_ky_luc);

CREATE INDEX idx_dang_ky_suat_trang_thai ON dang_ky(ma_suat, trang_thai);
CREATE INDEX idx_dang_ky_nguoi ON dang_ky(ma_nguoi_tham_du);

CREATE INDEX idx_danh_sach_cho_thu_tu
  ON danh_sach_cho(thu_tu)
  WHERE trang_thai = 'DANG_CHO';

CREATE INDEX idx_ve_trang_thai ON ve(trang_thai);
CREATE INDEX idx_check_in_nhan_vien ON check_in(ma_nhan_vien);
CREATE INDEX idx_lan_phan_bo_nguoi_thuc_hien ON lan_phan_bo(ma_nguoi_thuc_hien);

CREATE INDEX idx_su_kien_tim_kiem
  ON su_kien
  USING GIN (to_tsvector('simple', coalesce(ten, '') || ' ' || coalesce(mo_ta, '')));

-- Quy tắc nghiệp vụ do dịch vụ + giao dịch bảo vệ:
-- 1) suat_su_kien.suc_chua <= dia_diem.suc_chua.
-- 2) Số đăng ký DA_XAC_NHAN <= suc_chua của suất.
-- 3) Vé chỉ tạo khi đăng ký = DA_XAC_NHAN.
-- 4) Mục DANG_CHO chỉ tồn tại cho đăng ký DANH_SACH_CHO.
-- 5) Lần phân bổ chỉ chạy cho suất LOTTERY sau khi đóng đăng ký.
-- 6) Công bố sự kiện yêu cầu có ít nhất một suất hợp lệ.
-- 7) Hủy đăng ký đã xác nhận + hủy vé + chọn người chờ phải cùng một giao dịch.
-- 8) Check-in phải khóa và xác minh vé để hai yêu cầu đồng thời chỉ một yêu cầu thành công.
