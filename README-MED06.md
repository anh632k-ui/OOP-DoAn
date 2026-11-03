# MED-06 — Cổng quản lý sự kiện văn hóa và vé miễn phí

**Công nghệ:** NestJS 11 (TypeScript), Next.js 16, PostgreSQL 16, Docker Compose và S3-compatible object storage (SeaweedFS).

**Nhánh:** med06-code. Không sửa nhánh main/dev/TV hoặc file PTTK/.drawio đã thiết kế trước.

## Tiến độ giai đoạn 1–10

| Giai đoạn | Nội dung | Kiểm chứng |
|---|---|---|
| 1 | Khởi tạo NestJS, Next.js, PostgreSQL, Docker | CI |
| 2 | Migration, 16 bảng nghiệp vụ, seed và ràng buộc | CI |
| 3 | Đăng ký, đăng nhập JWT, phân quyền, cookie HttpOnly | CI |
| 4 | Quản lý sự kiện, địa điểm, suất và accessibility | CI |
| 5 | FCFS, Lottery, danh sách chờ, hủy và đôn chờ | CI |
| 6 | Vé QR, check-in chống quét trùng, thống kê | CI |
| 7 | Unit test, SQL, kiểm thử tích hợp và giới hạn tốc độ cơ bản | CI |
| 8 | Tìm kiếm/lọc và ảnh bìa trên S3-compatible storage | CI |
| 9 | Script Windows khởi động, dừng, kiểm tra và sao lưu DB | Cần thử trên máy Windows |
| 10 | Testcase, đối chiếu PTTK và kịch bản demo | Tài liệu bàn giao |

CI là môi trường tạm của GitHub. Máy Windows của người dùng vẫn cần kiểm tra sau khi pull.

## Bắt đầu trên Windows PowerShell 5.1

Mở Docker Desktop, sau đó trong PowerShell:

~~~powershell
cd "D:\k1\T6\OOP-DoAn"
git status
git switch med06-code
git pull --ff-only origin med06-code
.\scripts\med06-start.ps1
.\scripts\med06-test.ps1
~~~

Nếu git status báo thay đổi chưa commit, xử lý các file đó trước khi pull. KHÔNG dùng reset --hard hoặc xóa volume PostgreSQL.

- Website: http://localhost:3000
- Backend: http://localhost:3001/api/health
- pgAdmin 4 (không bắt buộc): 127.0.0.1:55432, database med06, user med06, password theo .env.

Giữ nguyên .env của máy bạn, nhất là POSTGRES_PORT=55432 và JWT_SECRET. Có thể thêm OBJECT_STORAGE_ACCESS_KEY, OBJECT_STORAGE_SECRET_KEY và OBJECT_STORAGE_PORT theo .env.example. Không gửi .env hay token lên GitHub. Mật khẩu storage mặc định trong Compose chỉ dành cho local demo.

Nạp dữ liệu mẫu khi cần:

~~~powershell
docker compose --profile seed run --rm seed
docker compose exec -T db psql -U med06 -d med06 -c "\dt"
Get-Content -Raw .\database\tests\001_constraints.sql | docker compose exec -T db psql -U med06 -d med06 -v ON_ERROR_STOP=1
~~~

17 bảng trong pgAdmin = 16 bảng nghiệp vụ + bảng kỹ thuật schema_migrations. Migration bổ sung index/cột không tạo thêm bảng nghiệp vụ.

## Các trang chính

| Trang | Mục đích |
|---|---|
| / | Danh sách, tìm kiếm và lọc sự kiện |
| /account/register, /account/login | Đăng ký, đăng nhập |
| /account | Xem tài khoản và vai trò |
| /organizer | Quản lý sự kiện, suất, chính sách, accessibility, ảnh bìa, Lottery |
| /registrations | Xem và hủy đăng ký |
| /tickets | Vé QR và trạng thái vé |
| /checkin | Nhân viên quét mã / nhập tay / xem thống kê |

Phân quyền: Guest xem công khai; ATTENDEE đăng ký/xem vé; ORGANIZER quản lý sự kiện của mình; CHECKIN kiểm tra vé; ADMIN quản trị chung. Người tự đăng ký chỉ được ATTENDEE.

**Cấp thử ORGANIZER/CHECKIN trong CSDL demo bạn có quyền quản trị:** thay email trong câu lệnh sau; không triển khai câu lệnh này thành chức năng công khai.

~~~powershell
$sql = @'
INSERT INTO nguoi_dung_vai_tro(ma_nguoi_dung,ma_vai_tro)
SELECT n.ma_nguoi_dung,r.ma_vai_tro FROM nguoi_dung n CROSS JOIN vai_tro r
WHERE lower(n.email)=lower('YOUR_EMAIL@example.com')
  AND r.ten_vai_tro IN ('ORGANIZER','CHECKIN')
ON CONFLICT DO NOTHING;
'@
$sql | docker compose exec -T db psql -U med06 -d med06 -v ON_ERROR_STOP=1
~~~

## Quy trình nghiệp vụ

**FCFS:** khi suất đã công bố và đang mở đăng ký, hệ thống khóa dòng suất trong transaction; còn chỗ và không có hàng đợi thì cấp vé ngay, nếu hết chỗ vào danh sách chờ. Hủy vé chưa dùng trước khi suất bắt đầu sẽ vô hiệu vé và đôn người chờ đầu tiên.

**Lottery:** người dùng ghi nhận CHO_PHAN_BO. Sau khi đóng đăng ký, ban tổ chức bốc thăm một lần. Seed ngẫu nhiên + HMAC-SHA256 quyết định thứ tự; có thể lấy seed và dữ liệu kiểm chứng tại API báo cáo của ban tổ chức. Người trúng được cấp vé; người còn lại chờ. Một suất chỉ có một chính sách FCFS HOẶC LOTTERY (không hỗ trợ chia tỷ lệ hai thuật toán trong cùng suất).

**Vé và check-in:** trang /tickets chứa mã QR ngẫu nhiên của vé. Nhân viên CHECKIN/ADMIN chọn mã suất và quét QR hoặc nhập mã thủ công. Check-in mở từ 30 phút trước giờ bắt đầu tới lúc suất kết thúc. Check-in thành công chuyển vé DA_SU_DUNG, quét lần 2 bị từ chối. Trình duyệt không hỗ trợ BarcodeDetector vẫn có thể nhập thủ công.

**Tìm kiếm và ảnh:** tìm tên/mô tả, lọc accessibility đã xác nhận. Ban tổ chức tải PNG/JPEG/WebP tối đa 2 MB vào S3-compatible object storage; PostgreSQL chỉ lưu khóa ảnh.

## Vận hành và sao lưu

~~~powershell
.\scripts\med06-stop.ps1
.\scripts\med06-start.ps1
.\scripts\med06-test.ps1
.\scripts\med06-backup.ps1
~~~

Không chạy docker compose down -v vì sẽ xóa dữ liệu trong volume. Sao lưu pg_dump thành backups/*.dump chỉ gồm PostgreSQL; ảnh trong volume object storage cần sao lưu riêng.

## Kiểm thử và tài liệu

- GitHub Actions: MED-06 scaffold CI (typecheck/build/unit tests).
- MED-06 database CI: chạy PostgreSQL thực, migration + seed lặp, FCFS đồng thời, Lottery, check-in, phân quyền, object storage.
- Testcase và bằng chứng: docs/MED06_TEST_CASES.md
- Kịch bản thuyết trình: docs/MED06_DEMO.md
- Đối chiếu PTTK và cấu trúc CSDL: docs/MED06_PTTK_TRACE.md

## Giới hạn cần ghi rõ trong báo cáo

- Chống bot cơ bản mới có rate limit/đăng ký không trùng; chưa có CAPTCHA hoặc email verification.
- Lottery lưu seed để kiểm chứng sau draw, chưa pre-commit seed trước khi đăng ký đóng; không tuyên bố tuyệt đối công bằng chống gian lận bởi chính đơn vị tổ chức.
- Nhân viên CHECKIN hiện có quyền kiểm tra toàn hệ thống, chưa phân công riêng theo suất.
- Không có đăng ký nhiều vé trong một đăng ký; mỗi người mỗi suất tối đa một đăng ký còn hiệu lực.
- Camera phụ thuộc hỗ trợ trình duyệt; không có fallback scanner library ngoài nhập tay.
- Chưa triển khai đầy đủ giám sát tập trung, khôi phục toàn bộ object storage, cấu hình production public HTTPS/hardening, email khôi phục mật khẩu hoặc quy trình hoàn vé khi hủy sự kiện đã có đăng ký.
