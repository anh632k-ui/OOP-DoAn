# MED-06 — Đối chiếu phân tích thiết kế với code

Không sửa sơ đồ .drawio gốc. Các bảng và quy tắc dưới đây dùng đối chiếu khi thầy kiểm tra.

## 16 bảng nghiệp vụ

| Bảng | Nội dung |
|---|---|
| vai_tro | Vai trò |
| nguoi_dung | Tài khoản |
| nguoi_dung_vai_tro | Gán vai trò |
| dia_diem | Địa điểm |
| su_kien | Sự kiện, khóa ảnh bìa S3 |
| suat_su_kien | Suất, thời gian và sức chứa |
| dac_tinh_tiep_can | Danh mục tiếp cận |
| su_kien_dac_tinh | Đặc tính đã xác nhận |
| chinh_sach_phan_bo | FCFS/LOTTERY |
| dang_ky | Đăng ký theo người và suất |
| muc_danh_sach_cho | Mục chờ / thứ tự đôn |
| dot_phan_bo | Đợt bốc thăm + seed kiểm chứng |
| ket_qua_phan_bo | Kết quả từng đăng ký |
| ve | Vé QR và trạng thái |
| ban_ghi_check_in | Các lần quét |
| nhat_ky_he_thong | Nhật ký nghiệp vụ |

schema_migrations là bảng kỹ thuật thứ 17, không thuộc ERD nghiệp vụ. Migration 003–005 bổ sung cột/chỉ mục, không tạo thêm bảng nghiệp vụ.

## Quan hệ trọng tâm

- su_kien 1–N suat_su_kien (suất phụ thuộc vòng đời sự kiện về nghiệp vụ).
- nguoi_dung 1–N dang_ky; suat_su_kien 1–N dang_ky.
- dang_ky 1–0..1 ve (UNIQUE trên ma_dang_ky của ve).
- suat_su_kien 1–0..1 chinh_sach_phan_bo.
- dang_ky 1–0..1 muc_danh_sach_cho.
- ve 1–N ban_ghi_check_in nếu tính các lượt từ chối; tối đa một lần thành công.
- su_kien N–N dac_tinh_tiep_can qua su_kien_dac_tinh.

## Ràng buộc và nơi hiện thực

| Quy tắc | Nơi triển khai |
|---|---|
| Đăng ký còn hiệu lực không trùng | uq_dang_ky_active, RegistrationsService |
| Sức chứa không vượt | trg_ve_capacity, khóa dòng suất |
| FCFS và danh sách chờ | RegistrationsService.register/cancel |
| Lottery | AllocationsService.draw + dot_phan_bo/ket_qua_phan_bo |
| Không bốc thăm lại | Transaction + kiểm tra dot_phan_bo |
| Check-in chỉ một lần | trg_checkin_consume, uq_one_successful_checkin |
| Phân quyền quản lý | JwtAuthGuard, RolesGuard, ManagementService |
| Search | EventsService + GIN trigram indexes |
| Ảnh ngoài DB | MediaService và su_kien.anh_bia_key |

Composition trong Class Diagram không đồng nghĩa mọi khóa ngoại trong DB đều phải ON DELETE CASCADE. Hệ thống ưu tiên từ chối xóa khi còn dữ liệu đăng ký/vé để tránh mất lịch sử.
