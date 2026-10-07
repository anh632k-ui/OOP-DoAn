# MED-06 - Ghi chú thiết kế cơ sở dữ liệu (bản tiếng Việt)

## 1. Mục tiêu
Phần cơ sở dữ liệu gồm:
1. ERD để nhìn quan hệ.
2. Từ điển dữ liệu để hiểu từng bảng/cột/ràng buộc.
3. PostgreSQL DDL để chứng minh thiết kế có thể hiện thực trực tiếp.

## 2. Quyết định thiết kế chính
- Dùng PostgreSQL.
- Khóa chính dùng UUID.
- Tên bảng/cột của nhánh `TV` dùng tiếng Việt không dấu để dễ trình bày và vẫn thuận tiện khi lập trình.
- Trạng thái nghiệp vụ dùng PostgreSQL ENUM.
- Không xóa vật lý bản ghi nghiệp vụ chính trong luồng thông thường; dùng trạng thái để giữ lịch sử.
- Kho lưu trữ đối tượng giữ file ảnh; CSDL chỉ lưu `url_anh`.
- Tìm kiếm giai đoạn MVP dùng PostgreSQL Full Text Search.

## 3. Lực lượng quan hệ đã khóa
- Người dùng 1 - N Sự kiện với vai trò Ban tổ chức.
- Địa điểm 1 - N Sự kiện.
- Sự kiện 1 - N Suất sự kiện; sự kiện nháp có thể tạm thời có 0 suất.
- Người dùng 1 - N Đăng ký.
- Suất sự kiện 1 - N Đăng ký.
- Đăng ký 1 - 0..1 Mục danh sách chờ.
- Đăng ký 1 - 0..1 Vé.
- Vé 1 - 0..1 Lượt check-in.
- Sự kiện N - N Đặc tính hỗ trợ tiếp cận qua `su_kien_tiep_can`.
- Suất sự kiện 1 - 0..1 Lần phân bổ trong MVP dùng LOTTERY.

## 4. Ràng buộc cấp CSDL
- Email duy nhất.
- `UNIQUE(dang_ky.ma_nguoi_tham_du, dang_ky.ma_suat)`.
- `UNIQUE(danh_sach_cho.ma_dang_ky)`.
- `UNIQUE(ve.ma_dang_ky)` và mã vé duy nhất.
- `UNIQUE(check_in.ma_ve)`.
- `UNIQUE(lan_phan_bo.ma_suat)`.
- Sức chứa > 0.
- Thời gian bắt đầu/kết thúc hợp lệ.
- Cửa sổ đăng ký hợp lệ.
- Số ứng viên/số xác nhận không âm.

## 5. Quy tắc không thể chỉ dùng CHECK
Các quy tắc phụ thuộc nhiều bản ghi hoặc cần kiểm soát đồng thời phải xử lý bằng dịch vụ + giao dịch:
- không cấp vượt sức chứa;
- sức chứa suất không vượt sức chứa địa điểm;
- chỉ phát vé khi đăng ký đã xác nhận;
- chọn người trong danh sách chờ đúng thứ tự;
- LOTTERY chỉ chạy sau khi đóng đăng ký;
- hai yêu cầu check-in đồng thời chỉ một yêu cầu thành công.

## 6. Biên giao dịch quan trọng
### Đăng ký FCFS
Khóa suất -> tạo đăng ký -> đếm số đã xác nhận -> xác nhận hoặc đưa vào danh sách chờ -> phát vé nếu cần -> ghi nhận.

### Hủy đăng ký đã xác nhận + chọn người chờ
Khóa suất -> hủy đăng ký -> hủy vé -> lấy mục đang chờ đầu tiên -> xác nhận người tiếp theo -> phát vé mới -> ghi nhận.

### Phân bổ LOTTERY
Khóa suất -> kiểm tra chưa có lần phân bổ -> lấy ứng viên -> tính kết quả -> cập nhật đăng ký -> phát vé/tạo danh sách chờ -> ghi lần phân bổ -> ghi nhận.

### Check-in
Khóa vé -> kiểm tra hợp lệ và chưa check-in -> tạo lượt check-in -> chuyển vé sang đã sử dụng -> ghi nhận.

## 7. Chỉ mục phục vụ nghiệp vụ
- Sự kiện theo người tổ chức, trạng thái, thời điểm bắt đầu.
- Suất theo sự kiện, trạng thái và cửa sổ đăng ký.
- Đăng ký theo `(ma_suat, trang_thai)` và người tham dự.
- Danh sách chờ theo `thu_tu` khi đang chờ.
- Vé theo trạng thái.
- Check-in theo nhân viên.
- Lần phân bổ theo người thực hiện.
- GIN Full Text Search trên tên + mô tả sự kiện.

## 8. ORM sau giữa kỳ
DDL này là nguồn chuẩn của thiết kế vật lý trên nhánh `TV`. Khi bắt đầu code NestJS có thể ánh xạ sang Prisma hoặc TypeORM; việc đổi tên kỹ thuật sau này không được làm thay đổi lực lượng quan hệ và quy tắc nghiệp vụ đã khóa.
