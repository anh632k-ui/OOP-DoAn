# MED-06 · PostgreSQL 16

Docker tự tạo database med06 từ thông tin trong .env.
Migration tạo 16 bảng nghiệp vụ theo ERD (cùng 1 bảng kỹ thuật schema_migrations).
Không cần tạo bảng thủ công trong pgAdmin 4.

Bảng nghiệp vụ: vai_tro, nguoi_dung, nguoi_dung_vai_tro, dia_diem,
su_kien, suat_su_kien, dac_tinh_tiep_can, su_kien_dac_tinh,
chinh_sach_phan_bo, dang_ky, muc_danh_sach_cho, dot_phan_bo,
ket_qua_phan_bo, ve, ban_ghi_check_in, nhat_ky_he_thong.

Ràng buộc:
- UNIQUE có điều kiện cho đăng ký còn hiệu lực (người, suất).
- Mỗi đăng ký tối đa một vé; mã xác thực vé là duy nhất.
- Trigger khóa dòng suất để không cấp vé vượt sức chứa.
- Check-in thành công khóa và chuyển trạng thái vé sang DA_SU_DUNG;
  partial UNIQUE không cho hai check-in thành công của cùng vé.
- Một chính sách FCFS/LOTTERY mỗi suất.
- Không giả định địa điểm hỗ trợ accessibility khi chưa được xác minh.

Các lệnh chạy trong CMD tại thư mục gốc OOP-DoAn:

    docker compose up -d
    docker compose ps
    docker compose exec -T db psql -U med06 -d med06 -c "\dt"
    docker compose --profile seed run --rm seed
    docker compose exec -T db psql -U med06 -d med06 -c "SELECT ten_su_kien FROM su_kien;"
    docker compose exec -T db psql -U med06 -d med06 -v ON_ERROR_STOP=1 < database\tests\001_constraints.sql

Migrate chạy tự động trước backend. Migrate và seed chạy lặp lại an toàn,
seed không tạo mật khẩu hoặc tài khoản đăng nhập thật.
Không chạy docker compose down -v nếu muốn giữ dữ liệu!
