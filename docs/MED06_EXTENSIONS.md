# MED-06 — Phần mở rộng nghiệp vụ sau thiết kế ban đầu

Tất cả thay đổi được code trên nhánh med06-code. Các nhánh cũ và file .drawio đã làm trước đó được giữ nguyên.

## 1. Phân công nhân viên check-in theo suất

Bản đầu có vai trò CHECKIN toàn hệ thống. Bản mở rộng bổ sung bảng phan_cong_check_in với khóa chính (ma_suat, ma_nguoi_dung), người phân công, ngày phân công và khóa ngoại tới suat_su_kien/nguoi_dung. Ban tổ chức của sự kiện hoặc ADMIN được phân công và thu hồi tài khoản có vai trò CHECKIN. Nhân viên không được quét vé hoặc xem số liệu ở suất chưa được phân công.

**Thay đổi ERD:** 16 bảng nghiệp vụ gốc + 1 bảng phân công mới = 17 bảng nghiệp vụ; thêm bảng kỹ thuật schema_migrations = 18 bảng. Trước khi nộp bản thiết kế cuối, cần vẽ thêm association class PhanCongCheckIn trong bản PTTK cập nhật. Không được gọi bảng này là bảng kỹ thuật chỉ để giấu sự khác biệt.

## 2. Chống spam đăng ký

Rate limit tại API đăng ký/hủy dùng JWT user ID thay vì gom các sinh viên chung IP. Throttle IP tại đăng ký và đăng nhập tài khoản vẫn giữ nguyên. Giới hạn 20 lượt đăng ký thành công trong 24 giờ được thực hiện trong transaction, khóa hàng người dùng và đếm nhật ký (migration 007 thêm index, không thêm bảng).

Đây là chống bot cơ bản; chưa có xác minh email hoặc CAPTCHA, chưa đủ để tuyên bố chống bot tuyệt đối.

## 3. Khóa/mở khóa tài khoản

ADMIN dùng trang /admin và API PATCH /api/admin/users/:id/status. Không tự khóa và không khóa ADMIN. Tài khoản bị khóa không đăng nhập hoặc sử dụng JWT cũ được. Nếu mở lại khi JWT chưa hết hạn, token cũ có thể hoạt động trở lại; chưa có danh sách thu hồi token vĩnh viễn.

## 4. Đổi lịch có lý do

ORGANIZER/ADMIN dùng PATCH /api/manage/sessions/:id/schedule để đổi startsAt, endsAt, reason. Phải trước khung giờ check-in; khi có đăng ký, lịch mới phải cách hiện tại hơn 24 giờ. Không thay đổi giờ đóng đăng ký. Thời gian cũ, thời điểm đổi và lý do được lưu trong suat_su_kien (migration 008), nhật ký ghi từng lần. Người tham dự xem thông báo khi mở website, danh sách đăng ký hoặc vé; chưa gửi email/SMS/push.

## 5. Nghiệm thu

GitHub Actions chạy backend TypeScript, Jest và PostgreSQL integration tests. Các bài kiểm thử được thêm vào database/tests/stage56_e2e.py và backend/src/management/reschedule.validation.spec.ts.

Các thay đổi trên laptop chỉ xuất hiện sau khi pull nhánh med06-code và khởi động Docker Compose. Không dùng docker compose down -v hay xóa volume dữ liệu. File .env vẫn là của máy người dùng.
