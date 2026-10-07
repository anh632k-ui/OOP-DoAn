# 02. Đặc tả Use Case lõi - MED-06

Tài liệu này đặc tả các Use Case ảnh hưởng trực tiếp đến Mô hình miền, Biểu đồ lớp và Biểu đồ tuần tự. Các Use Case CRUD đơn giản sẽ được bổ sung khi cần nhưng không làm thay đổi business core.

---

## UC05 - Đăng ký một suất
### Mục tiêu
Người tham dự gửi yêu cầu tham dự một `Suất sự kiện` miễn phí.

### Tác nhân chính
Người tham dự.

### Tiền điều kiện
- Người tham dự đã đăng nhập và tài khoản đang hoạt động.
- Sự kiện/Suất sự kiện tồn tại và cho phép đăng ký.
- Thời điểm hiện tại nằm trong cửa sổ đăng ký.
- Người tham dự chưa có Đăng ký cho Suất sự kiện đó.

### Luồng chính - FCFS còn chỗ
1. Người tham dự chọn một Suất sự kiện và yêu cầu đăng ký.
2. Hệ thống xác thực người dùng và quyền truy cập.
3. Hệ thống kiểm tra giới hạn tần suất/anti-bot quy tắc.
4. Hệ thống kiểm tra cửa sổ đăng ký và trùng lặp registration.
5. Trong giao dịch có khóa Suất sự kiện, hệ thống tạo Đăng ký `PENDING`.
6. Hệ thống kiểm tra số chỗ còn lại.
7. Đăng ký chuyển sang `CONFIRMED`.
8. Hệ thống tạo một Vé `VALID`.
9. Giao dịch commit và hệ thống trả kết quả đăng ký thành công.

### Luồng thay thế A - FCFS hết chỗ
Tại bước 6, nếu sức chứa đã đủ:
1. Đăng ký chuyển sang `WAITLISTED`.
2. Hệ thống tạo `Mục danh sách chờ` ở thứ tự tiếp theo theo FCFS.
3. Không phát Vé.
4. Giao dịch commit và trả trạng thái danh sách chờ cho Người tham dự.

### Luồng thay thế B - LOTTERY
Sau khi kiểm tra hợp lệ:
1. Hệ thống tạo Đăng ký `PENDING`.
2. Không phát Vé ngay.
3. Sau khi cửa sổ đăng ký đóng, UC12 thực hiện Lần phân bổ.

### Ngoại lệ
- Ngoài thời gian đăng ký: từ chối.
- Đã từng có Đăng ký cùng suất trong MVP: từ chối tạo bản ghi thứ hai.
- Tài khoản bị khóa hoặc vượt giới hạn tần suất: từ chối.
- Session bị hủy/không còn nhận đăng ký: từ chối.
- Vi phạm unique constraint do yêu cầu đồng thời: rollback và trả lỗi trùng lặp.

### Hậu điều kiện
- FCFS: Đăng ký là `CONFIRMED` hoặc `WAITLISTED`.
- LOTTERY: Đăng ký là `PENDING` cho đến Lần phân bổ.
- Không bao giờ vượt sức chứa.

---

## UC06 - Hủy đăng ký
### Mục tiêu
Người tham dự hủy Đăng ký của mình trước khi Suất sự kiện bắt đầu và trước khi Vé được sử dụng.

### Tác nhân chính
Người tham dự.

### Tiền điều kiện
- Đăng ký thuộc Người tham dự hiện tại.
- Đăng ký chưa `CANCELLED`.
- Suất sự kiện chưa bắt đầu.
- Vé, nếu có, chưa `USED`.

### Luồng chính - hủy Đăng ký đã xác nhận
1. Người tham dự yêu cầu hủy Đăng ký.
2. Hệ thống kiểm tra quyền sở hữu, trạng thái Session và Vé hiện tại.
3. Hệ thống khóa Suất sự kiện trong giao dịch.
4. Đăng ký chuyển `CANCELLED`.
5. Vé `VALID` tương ứng chuyển `CANCELLED`.
6. Hệ thống kiểm tra danh sách chờ của Suất sự kiện theo `position` tăng dần.
7. Nếu có người chờ, lấy entry `ACTIVE` đầu tiên.
8. Đăng ký của người đó chuyển `CONFIRMED`.
9. Mục danh sách chờ chuyển `PROMOTED`.
10. Hệ thống phát Vé `VALID` mới cho người được promote và commit giao dịch.

### Luồng thay thế
- Đăng ký đang `PENDING`: chuyển thẳng `CANCELLED`, không promote vì chưa chiếm sức chứa.
- Đăng ký đang `WAITLISTED`: chuyển `CANCELLED`, Mục danh sách chờ chuyển `CANCELLED`, không promote vì chưa chiếm sức chứa.
- Không có người trong danh sách chờ: kết thúc sau khi giải phóng chỗ.

### Hậu điều kiện
Không còn Vé hợp lệ cho Đăng ký đã hủy; nếu có danh sách chờ và chỗ trống thì hệ thống tự lấp chỗ nhưng không vượt sức chứa.

---

## UC09 - Tạo/cập nhật sự kiện
### Mục tiêu
Ban tổ chức tạo Sự kiện và chuẩn bị dữ liệu cần thiết trước khi công bố.

### Tác nhân chính
Ban tổ chức.

### Tiền điều kiện
Ban tổ chức đã đăng nhập và có vai trò phù hợp.

### Luồng chính
1. Ban tổ chức nhập tên, mô tả, địa điểm, thời gian tổng quan, ảnh và thông tin liên quan.
2. Hệ thống validate dữ liệu.
3. Hệ thống tạo Sự kiện ở trạng thái `DRAFT` và gán quyền sở hữu cho Ban tổ chức.
4. Sự kiện `DRAFT` có thể tạm thời chưa có Suất sự kiện.
5. Ban tổ chức bổ sung Suất sự kiện và Đặc tính hỗ trợ tiếp cận.
6. Sau khi có ít nhất một Suất sự kiện hợp lệ và đủ dữ liệu, Ban tổ chức có thể dùng UC11 để công bố/mở đăng ký.

### Quy tắc
- Ban tổ chức chỉ sửa Sự kiện do mình sở hữu.
- Sự kiện chưa có ít nhất một suất hợp lệ không được công bố.
- Ảnh chỉ lưu URL/siêu dữ liệu trong PostgreSQL; file nằm ở object storage.

---

## UC12 - Thực hiện phân bổ vé
### Mục tiêu
Phân bổ vé theo `LOTTERY`, đảm bảo công bằng, không vượt sức chứa và có khả năng kiểm chứng.

### Tác nhân chính
Ban tổ chức.

### Tiền điều kiện
- Ban tổ chức sở hữu Sự kiện chứa Suất sự kiện.
- Suất sự kiện có `Chính sách phân bổ = LOTTERY`.
- Cửa sổ đăng ký đã đóng.
- Chưa tồn tại Lần phân bổ đã commit cho Suất sự kiện này.

### Luồng chính - LOTTERY
1. Ban tổ chức yêu cầu chạy phân bổ cho Suất sự kiện.
2. Hệ thống khóa Suất sự kiện để ngăn hai run cạnh tranh.
3. Hệ thống kiểm tra chưa có Lần phân bổ cho session.
4. Hệ thống lấy tập Đăng ký `PENDING` hợp lệ.
5. Hệ thống tính số slot khả dụng theo sức chứa và số chỗ đã được xác nhận hợp lệ.
6. `Chiến lược phân bổ ngẫu nhiên` tạo thứ tự ngẫu nhiên công bằng cho tập ứng viên.
7. Tối đa số slot đầu tiên được chuyển `CONFIRMED`.
8. Mỗi Đăng ký được xác nhận được phát đúng một Vé `VALID`.
9. Các Đăng ký còn lại chuyển `WAITLISTED` theo chính thứ tự rút và tạo Mục danh sách chờ theo draw position.
10. Hệ thống ghi `Lần phân bổ` gồm người kích hoạt, counts và siêu dữ liệu phục vụ kiểm chứng.
11. Hệ thống commit toàn bộ kết quả trong một giao dịch.

### Luồng FCFS
FCFS được áp dụng trực tiếp trong UC05 tại thời điểm Đăng ký đến hệ thống. Trong MVP không chạy batch Lần phân bổ cho FCFS; có thể kiểm chứng FCFS qua `registeredAt`, trạng thái Đăng ký, Vé và log/giao dịch history.

### Hậu điều kiện
- Số Đăng ký `CONFIRMED` không vượt sức chứa.
- Chỉ một Lần phân bổ LOTTERY có thể commit cho Suất sự kiện.
- Kết quả phân bổ có dữ liệu kiểm chứng gồm người kích hoạt và siêu dữ liệu thuật toán.
- Người không trúng LOTTERY được xếp danh sách chờ theo thứ tự đã rút.

---

## UC14 - Check-in vé
### Mục tiêu
Nhân viên check-in xác minh Vé và ghi nhận một lượt check-in hợp lệ.

### Tác nhân chính
Nhân viên check-in.

### Tiền điều kiện
- Staff đã đăng nhập và có quyền check-in.
- Vé tồn tại và gắn với đúng Suất sự kiện cần check-in.

### Luồng chính
1. Staff quét QR hoặc nhập ticket code.
2. Hệ thống tìm và khóa Vé cần kiểm tra.
3. Hệ thống kiểm tra Vé ở trạng thái `VALID`.
4. Hệ thống kiểm tra chưa có Lượt check-in thành công cho Vé.
5. Hệ thống kiểm tra Vé qua Đăng ký thuộc đúng Suất sự kiện.
6. Hệ thống tạo Lượt check-in record.
7. Vé chuyển `USED`.
8. Hệ thống commit và trả kết quả check-in thành công.

### Ngoại lệ
- Vé không tồn tại: từ chối.
- Vé `CANCELLED`, `EXPIRED` hoặc `USED`: từ chối.
- Vé thuộc Suất sự kiện khác: từ chối.
- Yêu cầu đồng thời cho cùng Vé: chỉ một yêu cầu được commit thành công.

### Hậu điều kiện
Vé đã dùng không thể check-in lần thứ hai theo luồng thông thường.

---

## Ma trận Use Case -> sơ đồ tiếp theo
| Use Case | Domain/Class | Sequence | Hoạt động | Trạng thái |
|---|---:|---:|---:|---:|
| UC05 Đăng ký suất | Bắt buộc | Bắt buộc | Bắt buộc | Đăng ký |
| UC06 Hủy + promote danh sách chờ | Bắt buộc | Bắt buộc | Bắt buộc | Đăng ký/Vé |
| UC09 Tạo sự kiện | Bắt buộc | Nên có | Có thể | Sự kiện |
| UC12 Phân bổ | Bắt buộc | Bắt buộc | Bắt buộc | Đăng ký |
| UC14 Check-in | Bắt buộc | Bắt buộc | Có thể | Vé |

## Ghi chú consistency
Các tên `Sự kiện`, `Suất sự kiện`, `Đăng ký`, `Mục danh sách chờ`, `Vé`, `Lượt check-in`, `Lần phân bổ`, `Đặc tính hỗ trợ tiếp cận` trong tài liệu này là tên chuẩn để dùng tiếp ở Mô hình miền/Biểu đồ lớp/ERD, trừ khi có quyết định thay đổi được ghi rõ trong tài liệu yêu cầu.
