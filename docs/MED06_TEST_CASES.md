# MED-06 — Ma trận kiểm thử

Các kiểm thử CI nằm trong database/tests, backend/src/*.spec.ts và .github/workflows. Bằng chứng Windows cần ảnh chụp thực tế trên máy của nhóm.

| ID | Nghiệp vụ | Kết quả đúng | Trạng thái kiểm chứng |
|---|---|---|---|
| TC01 | API health | database=connected | CI |
| TC02 | Chạy migration lần 2 | Không tạo bảng trùng | CI |
| TC03 | Seed chạy 2 lần | Không nhân dữ liệu mẫu | CI |
| TC04 | Đăng ký tài khoản mới | Chỉ ATTENDEE | CI / trình duyệt |
| TC05 | Email trùng | 409 | CI |
| TC06 | Đăng nhập sai | 401 | CI |
| TC07 | ATTENDEE gọi quản trị | 403 | CI |
| TC08 | Tạo sự kiện nháp | NHAP | CI |
| TC09 | Công bố chưa có suất hợp lệ | 409 | CI |
| TC10 | Suất sức chứa 1 | Hai đăng ký đồng thời không quá 1 vé | CI |
| TC11 | Đăng ký trùng đang hiệu lực | 409 | CI |
| TC12 | FCFS hết vé | Người sau vào danh sách chờ | CI |
| TC13 | Hủy vé chưa dùng | Vé vô hiệu, người chờ được cấp | CI |
| TC14 | Lottery đóng đăng ký | Một lần bốc thăm | CI |
| TC15 | Seed kiểm chứng Lottery | Thứ tự HMAC tính lại trùng | CI |
| TC16 | Bốc thăm lần hai | 409 | CI |
| TC17 | Check-in đúng vé | Chấp nhận và DA_SU_DUNG | CI |
| TC18 | Quét lại vé | Từ chối, chỉ 1 check-in thành công | CI |
| TC19 | ATTENDEE gọi check-in | 403 | CI |
| TC20 | Accessibility chưa verified | Từ chối | CI |
| TC21 | Tìm kiếm và lọc | Trả sự kiện công bố phù hợp | CI / Windows |
| TC22 | Upload ảnh PNG | Lưu S3 và đọc lại trùng file | CI |
| TC23 | Upload ảnh không hợp lệ | 400/413 | Windows thủ công |
| TC24 | Backup PostgreSQL | File .dump không rỗng | Windows thủ công |
| TC25 | Đóng pgAdmin | Web và DB vẫn hoạt động | Windows thủ công |

## Checklist nộp minh chứng

- [ ] Chạy scripts/med06-test.ps1 trả PASS.
- [ ] Chụp danh sách 17 bảng trong pgAdmin (16 nghiệp vụ + schema_migrations).
- [ ] Chụp trang đăng nhập thành công, tài khoản có ATTENDEE.
- [ ] Chụp màn hình ORGANIZER quản lý sự kiện, địa điểm, suất, policy.
- [ ] Chụp hai cửa sổ ATTENDEE đăng ký suất chỉ còn một chỗ.
- [ ] Chụp người trúng có QR, người chưa trúng nằm trong danh sách chờ.
- [ ] Chụp hủy vé và đôn người chờ.
- [ ] Chụp Lottery sau khi đóng đăng ký, bảng kết quả.
- [ ] Chụp check-in lần 1 thành công, lần 2 bị từ chối.
- [ ] Chụp lọc accessibility và ảnh bìa.
- [ ] Chụp kết quả sao lưu PostgreSQL.

Không chụp hoặc đưa lên GitHub các giá trị JWT, password, S3 secret hay mã QR thực có thể dùng để vào cổng.

Các testcase CI chạy trên DB riêng của GitHub, không tự thêm bản ghi vào máy bạn. Script SQL 001_constraints.sql có ROLLBACK.
