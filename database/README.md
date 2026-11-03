# MED-06 · Database

PostgreSQL 16 chạy thông qua dịch vụ `db` trong `docker-compose.yml`.
Hiện tại backend dùng kết nối `pg` và kiểm tra `SELECT 1`.
Giai đoạn 2 sẽ thiết kế schema, migration và seed dựa trên tài liệu PTTK
(sự kiện, suất, đăng ký, vé, danh sách chờ, check-in...).

Không tự chạy `docker compose down -v` nếu cần giữ dữ liệu.
