# MED-06 - Từ điển dữ liệu PostgreSQL (bản tiếng Việt)

Tài liệu mô tả thiết kế dữ liệu vật lý của hệ thống bằng tên bảng và tên cột tiếng Việt không dấu để dễ đọc nhưng vẫn tương thích tốt với PostgreSQL.

## 1. nguoi_dung
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh người dùng |
| ho_ten | VARCHAR(120) | NOT NULL | Họ tên |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email đăng nhập |
| mat_khau_bam | VARCHAR(255) | NOT NULL | Mật khẩu đã băm |
| vai_tro | vai_tro_nguoi_dung | NOT NULL | NGUOI_THAM_DU / BAN_TO_CHUC / NHAN_VIEN / QUAN_TRI_VIEN |
| trang_thai | trang_thai_tai_khoan | NOT NULL | HOAT_DONG / BI_KHOA |
| tao_luc | TIMESTAMPTZ | NOT NULL | Thời điểm tạo |
| cap_nhat_luc | TIMESTAMPTZ | NOT NULL | Thời điểm cập nhật |

## 2. dia_diem
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh địa điểm |
| ten | VARCHAR(200) | NOT NULL | Tên địa điểm |
| dia_chi | TEXT | NOT NULL | Địa chỉ |
| suc_chua | INTEGER | NOT NULL, CHECK > 0 | Sức chứa tối đa |
| tao_luc | TIMESTAMPTZ | NOT NULL | Thời điểm tạo |
| cap_nhat_luc | TIMESTAMPTZ | NOT NULL | Thời điểm cập nhật |

## 3. su_kien
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh sự kiện |
| ma_nguoi_to_chuc | UUID | FK -> nguoi_dung.id | Người tổ chức sở hữu sự kiện |
| ma_dia_diem | UUID | FK -> dia_diem.id | Địa điểm tổ chức |
| ten | VARCHAR(200) | NOT NULL | Tên sự kiện |
| mo_ta | TEXT | NULL | Mô tả |
| trang_thai | trang_thai_su_kien | NOT NULL | NHAP / DA_CONG_BO / HOAN_THANH / DA_HUY |
| bat_dau_luc | TIMESTAMPTZ | NOT NULL | Thời điểm bắt đầu |
| ket_thuc_luc | TIMESTAMPTZ | NOT NULL | Thời điểm kết thúc |
| url_anh | TEXT | NULL | Đường dẫn ảnh trên kho lưu trữ đối tượng |
| tao_luc | TIMESTAMPTZ | NOT NULL | Thời điểm tạo |
| cap_nhat_luc | TIMESTAMPTZ | NOT NULL | Thời điểm cập nhật |

Sự kiện nháp được phép chưa có suất. Khi công bố, dịch vụ phải kiểm tra có ít nhất một suất hợp lệ.

## 4. suat_su_kien
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh suất |
| ma_su_kien | UUID | FK -> su_kien.id | Sự kiện cha |
| bat_dau_luc | TIMESTAMPTZ | NOT NULL | Bắt đầu suất |
| ket_thuc_luc | TIMESTAMPTZ | NOT NULL | Kết thúc suất |
| suc_chua | INTEGER | NOT NULL, CHECK > 0 | Sức chứa suất |
| mo_dang_ky_luc | TIMESTAMPTZ | NOT NULL | Mở đăng ký |
| dong_dang_ky_luc | TIMESTAMPTZ | NOT NULL | Đóng đăng ký |
| chinh_sach_phan_bo | chinh_sach_phan_bo | NOT NULL | FCFS / LOTTERY |
| trang_thai | trang_thai_suat | NOT NULL | Vòng đời của suất |
| tao_luc | TIMESTAMPTZ | NOT NULL | Thời điểm tạo |
| cap_nhat_luc | TIMESTAMPTZ | NOT NULL | Thời điểm cập nhật |

## 5. dang_ky
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh đăng ký |
| ma_nguoi_tham_du | UUID | FK -> nguoi_dung.id | Người đăng ký |
| ma_suat | UUID | FK -> suat_su_kien.id | Suất đăng ký |
| trang_thai | trang_thai_dang_ky | NOT NULL | CHO_XU_LY / DA_XAC_NHAN / DANH_SACH_CHO / DA_HUY |
| dang_ky_luc | TIMESTAMPTZ | NOT NULL | Thời điểm đăng ký |
| cap_nhat_luc | TIMESTAMPTZ | NOT NULL | Thời điểm cập nhật |

Ràng buộc quan trọng: `UNIQUE(ma_nguoi_tham_du, ma_suat)`.

## 6. danh_sach_cho
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh mục chờ |
| ma_dang_ky | UUID | FK, UNIQUE | Đăng ký tương ứng |
| thu_tu | BIGINT | NOT NULL, CHECK > 0 | Thứ tự ưu tiên |
| vao_danh_sach_luc | TIMESTAMPTZ | NOT NULL | Thời điểm vào danh sách chờ |
| trang_thai | trang_thai_danh_sach_cho | NOT NULL | DANG_CHO / DA_DUOC_CHON / DA_HUY |
| cap_nhat_luc | TIMESTAMPTZ | NOT NULL | Thời điểm cập nhật |

## 7. ve
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh vé |
| ma_dang_ky | UUID | FK, UNIQUE | Đăng ký được cấp vé |
| ma_ve | VARCHAR(100) | NOT NULL, UNIQUE | Mã vé |
| ma_qr | TEXT | NOT NULL | Nội dung/mã QR |
| trang_thai | trang_thai_ve | NOT NULL | HOP_LE / DA_SU_DUNG / DA_HUY / HET_HAN |
| phat_luc | TIMESTAMPTZ | NOT NULL | Thời điểm phát vé |
| cap_nhat_luc | TIMESTAMPTZ | NOT NULL | Thời điểm cập nhật |

## 8. check_in
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh lượt check-in |
| ma_ve | UUID | FK, UNIQUE | Vé được check-in |
| ma_nhan_vien | UUID | FK -> nguoi_dung.id | Nhân viên thực hiện |
| check_in_luc | TIMESTAMPTZ | NOT NULL | Thời điểm check-in |
| phuong_thuc | phuong_thuc_check_in | NOT NULL | QR / MA_THU_CONG |

## 9. dac_tinh_tiep_can
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh đặc tính |
| ten | VARCHAR(120) | NOT NULL, UNIQUE | Tên đặc tính |
| mo_ta | TEXT | NULL | Mô tả |

## 10. su_kien_tiep_can
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| ma_su_kien | UUID | PK, FK -> su_kien.id | Sự kiện |
| ma_dac_tinh | UUID | PK, FK -> dac_tinh_tiep_can.id | Đặc tính hỗ trợ tiếp cận |

## 11. lan_phan_bo
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh lần phân bổ |
| ma_suat | UUID | FK, UNIQUE | Suất được phân bổ |
| ma_nguoi_thuc_hien | UUID | FK -> nguoi_dung.id | Người tổ chức kích hoạt |
| chinh_sach | chinh_sach_phan_bo | NOT NULL | Chính sách phân bổ |
| thuc_hien_luc | TIMESTAMPTZ | NOT NULL | Thời điểm chạy |
| so_ung_vien | INTEGER | NOT NULL, CHECK >= 0 | Số ứng viên |
| so_xac_nhan | INTEGER | NOT NULL, CHECK >= 0 | Số người được xác nhận |
| du_lieu_kiem_chung | JSONB | NOT NULL | Dữ liệu kiểm chứng kết quả |

## 12. Bất biến phải được bảo vệ bằng dịch vụ/giao dịch
- Số đăng ký `DA_XAC_NHAN` không vượt sức chứa suất.
- Hai yêu cầu FCFS tranh chỗ cuối chỉ một yêu cầu được xác nhận.
- Hủy đăng ký đã xác nhận + hủy vé + chọn người trong danh sách chờ phải nguyên tử.
- Phân bổ LOTTERY phải nguyên tử và chỉ có một lần phân bổ được ghi nhận.
- Check-in phải khóa/xác minh vé để hai yêu cầu đồng thời không cùng thành công.
- Chỉ công bố sự kiện khi có ít nhất một suất hợp lệ.
