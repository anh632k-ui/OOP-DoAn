# MED-06 – Cổng quản lý sự kiện văn hóa và vé miễn phí

**Nhánh lập trình:** `med06-code` (tách từ `dev`; không chỉnh sửa các file PTTK cũ).

## Giai đoạn 1 – Bộ khung chạy được

- `backend/`: NestJS API; `GET /api/health` truy vấn thật `SELECT 1` đến PostgreSQL.
- `frontend/`: Next.js App Router; trang chủ hiển thị kết nối API và CSDL.
- `docker-compose.yml`: PostgreSQL 16, NestJS, Next.js.
- `database/`: vị trí cho schema, migration và seed giai đoạn sau.

Đây mới là scaffold, **chưa có đăng nhập, CRUD sự kiện, FCFS, Lottery, danh sách chờ, object storage, search hay check-in**.

## Chạy trên Windows (Docker Desktop + Git)

1. Mở Docker Desktop, chờ Docker Engine chạy.
2. Mở PowerShell trong thư mục `OOP-DoAn` và chạy:

```powershell
git fetch origin
git switch --track origin/med06-code
Copy-Item .env.example .env
docker compose up --build -d
docker compose ps
```

Nếu local đã có nhánh `med06-code` thì dùng `git switch med06-code` rồi `git pull origin med06-code`.
Không chạy `git reset --hard` vì có thể mất các thay đổi chưa commit.

3. Mở:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001/api/health

4. Kiểm tra API trong PowerShell:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

Kỳ vọng khi PostgreSQL hoạt động: `{"status":"ok","service":"med06-backend","database":"connected"}`.

5. Xem lỗi nếu có:

```powershell
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
docker compose logs --tail=100 db
```

6. Dừng môi trường nhưng giữ dữ liệu:

```powershell
docker compose down
```

**Không dùng** `docker compose down -v` nếu cần giữ dữ liệu PostgreSQL.

## Cổng mặc định

| Dịch vụ | Cổng trên Windows | Cổng container |
| --- | --- | --- |
| Next.js | 3000 | 3000 |
| NestJS | 3001 | 3001 |
| PostgreSQL | 5432 | 5432 |

Nếu cổng Windows đã bị chiếm, sửa `FRONTEND_PORT`, `BACKEND_PORT`, `POSTGRES_PORT` trong `.env` rồi chạy lại `docker compose up -d`. Các dịch vụ nội bộ vẫn dùng cổng cố định.

Các mật khẩu trong `.env.example` **chỉ dành cho môi trường học tập trên máy cá nhân**; tuyệt đối không đưa thông tin thật hoặc mật khẩu triển khai lên GitHub. Sau khi thay đổi mật khẩu PostgreSQL, volume cũ không tự đổi tài khoản DB.

## Chạy từng ứng dụng không dùng Docker

Cần Node.js 22.12+ và PostgreSQL có sẵn.

```powershell
cd backend
npm install
$env:DATABASE_URL="postgresql://med06:med06_dev_password@localhost:5432/med06"
npm run dev
```

Mở terminal mới:

```powershell
cd frontend
npm install
$env:BACKEND_INTERNAL_URL="http://localhost:3001"
npm run dev
```

## Kiểm thử và giới hạn

```powershell
cd backend
npm run typecheck
npm test
npm run build
cd ../frontend
npm run typecheck
npm run build
```

CI chạy lại những bước này trên GitHub Actions. Ở môi trường tạo code hiện tại không có Docker và không truy cập được npm registry, do đó **chưa thể khẳng định Docker image đã build hay cả ba dịch vụ đã chạy thành công** cho đến khi chạy thực tế trên Windows hoặc CI.

Giai đoạn 2: thống nhất mô hình dữ liệu, bổ sung migration/seed, rồi API tài khoản, sự kiện và suất.
