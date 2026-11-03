# MED-06 – Cổng quản lý sự kiện văn hóa và vé miễn phí

**Nhánh code duy nhất trong giai đoạn này:** `med06-code`. Không sửa `main`, `dev`, `TV`, các file `.drawio` và thư mục `PTTK` cũ.

## Đã hoàn thành

- **Giai đoạn 1:** NestJS, Next.js, PostgreSQL 16, Docker Compose, API `GET /api/health` kiểm tra DB thật.
- **Giai đoạn 2:** Migration 16 bảng nghiệp vụ + bảng `schema_migrations`, seed dữ liệu minh họa, kiểm thử ràng buộc bằng PostgreSQL, API chỉ-đọc công bố sự kiện/suất và trang Next.js hiển thị dữ liệu.

**Chưa có:** đăng ký/đăng nhập thực, phân quyền API, tạo/sửa sự kiện, đăng ký vé, thuật toán FCFS/Lottery, danh sách chờ, check-in API, object storage, bộ tìm kiếm riêng. Các phần này thuộc giai đoạn tiếp theo.

## Các thư mục

| Đường dẫn | Vai trò |
|---|---|
| `backend/` | NestJS API và kết nối PostgreSQL bằng pg |
| `frontend/` | Next.js hiển thị sự kiện đã công bố và suất |
| `database/migrations/` | DDL PostgreSQL theo phiên bản (chạy một lần) |
| `database/seed/` | Dữ liệu giả để demo; chỉ chạy thủ công |
| `database/tests/` | SQL test ràng buộc, rollback sau kiểm thử |
| `docker-compose.yml` | PostgreSQL, migrate, seed (profile), backend, frontend |

## Chạy Giai đoạn 2 trên máy Windows (CMD)

Máy đã có Docker Desktop và `.env` với `POSTGRES_PORT=55432`. **Không xóa hoặc chép đè `.env`** vì cổng 5432 từng bị lỗi trên Windows.

Trong **CMD**:

```cmd
cd /d D:\k1\T6\OOP-DoAn
git status
git switch med06-code
git pull --ff-only origin med06-code
docker compose up --build -d
docker compose ps
```

Nếu `git status` cho thấy có file đã sửa mà chưa commit, hãy lưu/commit hoặc xử lý những thay đổi đó trước khi pull. Không sử dụng `git reset --hard`.

`migrate` chạy tự động sau khi `db` healthy và trước khi `backend` khởi động. Nếu bảng đã được tạo, chương trình bỏ qua migration đã áp dụng. CSDL hiện tại và volume Docker vẫn được giữ nguyên.

### Nạp dữ liệu mẫu

```cmd
docker compose --profile seed run --rm seed
docker compose exec -T db psql -U med06 -d med06 -c "\dt"
docker compose exec -T db psql -U med06 -d med06 -c "SELECT ten_su_kien, trang_thai FROM su_kien;"
```

Seed tạo 2 sự kiện và 3 suất minh họa, cùng dữ liệu địa điểm, vai trò, người dùng mẫu **không có mật khẩu đăng nhập**. Có thể chạy lại seed mà không tạo bản sao trùng. Các thông tin tiện ích tiếp cận chưa được xác nhận sẽ không được tự công bố.

### Kiểm tra các ràng buộc trong CSDL

```cmd
docker compose exec -T db psql -U med06 -d med06 -v ON_ERROR_STOP=1 < database\tests\001_constraints.sql
```

Kiểm thử không để lại các đăng ký/vé tạm vì toàn bộ dữ liệu kiểm thử được `ROLLBACK`.

### Kiểm tra API và website

- Website: http://localhost:3000
- Kiểm tra PostgreSQL: http://localhost:3001/api/health
- Danh sách sự kiện đã công bố: http://localhost:3001/api/events
- Chi tiết một sự kiện: `GET /api/events/:id`
- Danh sách suất của sự kiện: `GET /api/events/:id/sessions`

Các API hiện tại chỉ đọc dữ liệu đã công bố; chưa có chức năng gửi đăng ký.

### pgAdmin 4 có bắt buộc không?

Không. Nếu muốn xem bảng bằng giao diện pgAdmin, thông số mặc định trên máy sau khi sửa `.env` là: Host `127.0.0.1`, Port `55432`, Database `med06`, User `med06`. Mật khẩu lấy từ `POSTGRES_PASSWORD` trong `.env`, không lưu password thật vào repository.

### Xem log khi gặp lỗi

```cmd
docker compose logs --tail=100 migrate
docker compose logs --tail=100 db
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
```

Không dùng `docker compose down -v` nếu muốn giữ dữ liệu! Muốn dừng container nhưng giữ dữ liệu: `docker compose down`.

## Quy tắc nghiệp vụ đã được bảo vệ ở PostgreSQL

- Mỗi (người tham dự, suất) chỉ có một đăng ký còn hiệu lực.
- Một đăng ký chỉ có tối đa một vé; ticket phải thuộc đúng suất của đăng ký.
- Trigger khóa suất trước khi cấp vé, chặn cấp quá sức chứa ngay cả khi có nhiều yêu cầu đồng thời ở mức `READ COMMITTED`.
- Check-in thành công chỉ xảy ra tối đa một lần/ vé, đồng thời chuyển vé sang `DA_SU_DUNG`.
- Một suất có tối đa một chính sách phân bổ `FCFS` hoặc `LOTTERY`.
- Chưa hoàn thiện quy tắc xử lý FCFS/Lottery từ API: đây là bảo vệ nền tảng dữ liệu, không đồng nghĩa thuật toán đã hoạt động.

## CI

GitHub Actions dùng hai workflow: `med06-ci.yml` kiểm tra TypeScript/build/unit tests; `med06-db-ci.yml` chạy PostgreSQL thật, migration hai lượt, seed hai lượt và SQL tests. Docker chưa được chạy trực tiếp từ ChatGPT; môi trường Windows của bạn là nơi cần kiểm tra việc khởi động cuối cùng.

## Bước tiếp theo

Triển khai xác thực và RBAC, sau đó CRUD sự kiện/suất với kiểm tra nghiệp vụ, rồi phân bổ FCFS/Lottery, danh sách chờ và check-in.
