# MED-06 – Cổng quản lý sự kiện văn hóa và vé miễn phí

**Nhánh code duy nhất trong giai đoạn này:** `med06-code`. Không sửa `main`, `dev`, `TV`, các file `.drawio` và thư mục `PTTK` cũ.

## Đã hoàn thành

- **Giai đoạn 1:** NestJS, Next.js, PostgreSQL 16, Docker Compose, API `GET /api/health` kiểm tra DB thật.
- **Giai đoạn 2:** Migration 16 bảng nghiệp vụ + bảng `schema_migrations`, seed dữ liệu minh họa, kiểm thử ràng buộc, API sự kiện/suất và trang Next.js.
- **Giai đoạn 3:** Đăng ký, đăng nhập, JWT, kiểm tra trạng thái và vai trò theo PostgreSQL, trang đăng ký/đăng nhập/tài khoản, cookie HttpOnly.

**Chưa có:** giao diện quản trị, CRUD sự kiện/suất, cấp vai trò quản trị viên, đăng ký vé, FCFS/Lottery, danh sách chờ, check-in, object storage và bộ tìm kiếm riêng.

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

## Giai đoạn 3 – Tài khoản, JWT và phân quyền

Backend đã có API: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (Bearer token), `GET /api/auth/organizer-check` (chỉ ADMIN/ORGANIZER).

- Đăng ký công khai chỉ được cấp `ATTENDEE`, không thể tự chọn ADMIN/ORGANIZER/CHECKIN.
- Mật khẩu được băm với `scrypt` và salt ngẫu nhiên, không lưu mật khẩu gốc.
- JWT HS256 có hạn một giờ; guard luôn kiểm tra trạng thái tài khoản và vai trò từ PostgreSQL khi truy cập.
- Đăng ký/đăng nhập giới hạn số lần gọi từ một địa chỉ IP bằng ThrottlerGuard.
- Tài khoản demo seed không có mật khẩu nên không thể dùng để đăng nhập; hãy đăng ký tài khoản riêng.
- Đã có giao diện `http://localhost:3000/account/register` và `/account/login` cùng `/account` (thông tin người dùng). JWT nằm trong cookie HttpOnly của Next.js, không lưu vào localStorage.
- Chưa triển khai API tạo quản trị viên, làm mới token, khôi phục mật khẩu hoặc quy trình quên mật khẩu.

### Thiết lập khóa JWT trên Windows PowerShell 5.1

**Bắt buộc tạo khóa bí mật trước khi chạy backend mới. Không gửi khóa cho người khác hoặc commit lên GitHub.**

```powershell
cd 'D:\k1\T6\OOP-DoAn'
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
$rng.Dispose()
$jwtSecret = ([BitConverter]::ToString($bytes)).Replace('-','').ToLowerInvariant()
Add-Content -Path .env -Value "JWT_SECRET=$jwtSecret"
```

Nếu `.env` đã có dòng `JWT_SECRET=`, chỉ sửa giá trị dòng đó, không thêm dòng trùng. Giữ nguyên `POSTGRES_PORT=55432`.

```powershell
git switch med06-code
git pull --ff-only origin med06-code
docker compose up --build -d
docker compose ps
```

### Thử đăng ký, đăng nhập trong PowerShell (password thử nghiệm, không phải mật khẩu CSDL)

```powershell
$newAccount = @{email='demo-stage3@example.invalid';name='Demo User';password='TestSecure98765'} | ConvertTo-Json
$registered = Invoke-RestMethod 'http://localhost:3001/api/auth/register' -Method Post -ContentType 'application/json' -Body $newAccount
$token = $registered.accessToken
Invoke-RestMethod 'http://localhost:3001/api/auth/me' -Headers @{Authorization="Bearer $token"}
```

Vai trò cần hiện `ATTENDEE`. Truy cập `/api/auth/organizer-check` bằng token này phải trả HTTP 403; không có token truy cập `/api/auth/me` phải trả HTTP 401.

### Kiểm tra bằng trình duyệt

1. Mở `http://localhost:3000/account/register`; nhập tên, email và mật khẩu thử nghiệm riêng từ 10 ký tự có chữ và số.
2. Sau khi đăng ký, website mở `/account`; phải thấy tài khoản mới và vai trò `ATTENDEE`.
3. Chọn **Đăng xuất**, mở `/account/login` và dùng tài khoản vừa tạo đăng nhập lại.
4. Trang `/account` là vùng cần xác thực; không có phiên sẽ chuyển về `/account/login`.

Khóa JWT **chỉ dùng cho việc ký token**, không phải mật khẩu PostgreSQL. Đổi khóa làm token cũ mất hiệu lực. Không được đưa khóa vào Git.

### Các giới hạn của giai đoạn 3

- Đã chứng minh bảo vệ vai trò `ORGANIZER`/`ADMIN` tại `/api/auth/organizer-check`; API CRUD quản lý chưa được xây dựng.
- Các tài khoản seed không đăng nhập được vì chưa có mật khẩu; dùng giao diện đăng ký để tạo tài khoản người tham dự.
- Khi khai thác ngoài môi trường demo cần bổ sung chính sách cookie phù hợp tên miền, bảo vệ đăng nhập, giám sát bảo mật, quên mật khẩu và làm mới token.

## Giai đoạn 4 – Ban tổ chức quản lý sự kiện (bản đầu tiên)

Phần quản lý sử dụng vai trò `ORGANIZER` hoặc `ADMIN`. Đường dẫn website `http://localhost:3000/organizer`. Một người đăng ký tự do chỉ có vai trò `ATTENDEE`, **không thể tự chọn quyền ban tổ chức**.

### Cấp quyền ORGANIZER cho tài khoản thử nghiệm trên máy local

1. Đăng ký/đăng nhập tài khoản thử nghiệm thật trên website trước.
2. Trong PowerShell tại thư mục gốc dự án, dùng câu SQL dưới đây và **thay `your-test-email@example.com` bằng email tài khoản vừa tạo**. Chỉ dùng trên PostgreSQL demo của bạn, không triển khai thao tác này thành API công khai.

```powershell
$sql = @'
INSERT INTO nguoi_dung_vai_tro(ma_nguoi_dung, ma_vai_tro)
SELECT n.ma_nguoi_dung, v.ma_vai_tro
FROM nguoi_dung n JOIN vai_tro v ON v.ten_vai_tro='ORGANIZER'
WHERE lower(n.email)=lower('your-test-email@example.com')
ON CONFLICT DO NOTHING;
'@
$sql | docker compose exec -T db psql -U med06 -d med06 -v ON_ERROR_STOP=1
```

Chỉ thực hiện bước này với **tài khoản bạn được phép quản trị**. Sau đó mở lại `http://localhost:3000/organizer`. Token đăng nhập cũ vẫn hoạt động vì backend lấy quyền trực tiếp từ PostgreSQL theo mỗi yêu cầu.

### Chức năng quản lý đã có

- Tạo sự kiện nháp, sửa tên/mô tả qua API, xem sự kiện do mình sở hữu (ADMIN xem toàn bộ).
- Tạo địa điểm; thêm suất với mốc thời gian ISO 8601, sức chứa và thời gian đăng ký.
- Chọn một phương thức `FCFS` **hoặc** `LOTTERY` cho mỗi suất; chưa hỗ trợ tách số lượng vé FCFS/Lottery trong *cùng* một suất.
- Chỉ công bố sau khi có suất tương lai và chính sách phân bổ. Hủy sự kiện đã có đăng ký hiện bị chặn, chờ xử lý nghiệp vụ hoàn vé/đăng ký.
- Lưu thuộc tính accessibility **chỉ sau khi người tổ chức xác nhận đã kiểm tra thực tế**.
- Tài khoản `ATTENDEE` bị chặn ở API bằng JWT và RBAC; quyền sở hữu sự kiện kiểm tra ở PostgreSQL.

### API quản lý (cần Bearer JWT và vai trò phù hợp)

| Phương thức | Đường dẫn | Mục đích |
|---|---|---|
| GET/POST | `/api/manage/events` | Danh sách / tạo nháp |
| PATCH | `/api/manage/events/:id` | Sửa bản nháp |
| POST | `/api/manage/events/:id/publish` | Công bố |
| POST | `/api/manage/events/:id/cancel` | Hủy khi chưa có đăng ký |
| GET/POST | `/api/manage/venues` | Xem / thêm địa điểm |
| GET/POST | `/api/manage/events/:id/sessions` | Xem / thêm suất |
| PUT | `/api/manage/sessions/:id/policy` | Cấu hình FCFS/LOTTERY |
| GET | `/api/manage/accessibility/options` | Danh mục đặc tính tiếp cận |
| PUT | `/api/manage/events/:id/accessibility` | Xác nhận đặc tính tiếp cận |

Website Next.js chuyển tiếp các yêu cầu quản lý qua `/api/manage/...` bằng cookie `HttpOnly`, không đưa JWT vào JavaScript phía trình duyệt.

### Cập nhật máy Windows

```powershell
cd 'D:\k1\T6\OOP-DoAn'
git status
git switch med06-code
git pull --ff-only origin med06-code
docker compose up --build -d
docker compose ps
```

Không chép đè `.env` và phải giữ `JWT_SECRET`, `POSTGRES_PORT=55432` của máy bạn. Không dùng `docker compose down -v` vì sẽ xóa volume CSDL.

**Lưu ý:** Giai đoạn 4 tập trung quản lý cấu hình sự kiện. FCFS/Lottery hiện mới là cấu hình, chưa chạy thuật toán cấp vé hoặc danh sách chờ (giai đoạn 5).
