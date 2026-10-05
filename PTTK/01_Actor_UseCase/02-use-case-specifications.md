# 02. Đặc tả Use Case lõi - MED-06

Tài liệu này đặc tả các Use Case ảnh hưởng trực tiếp đến Domain Model, Class Diagram và Sequence Diagram. Các Use Case CRUD đơn giản sẽ được bổ sung khi cần nhưng không làm thay đổi business core.

---

## UC05 - Đăng ký một suất
### Mục tiêu
Attendee gửi yêu cầu tham dự một `EventSession` miễn phí.

### Actor chính
Attendee.

### Tiền điều kiện
- Attendee đã đăng nhập và tài khoản đang hoạt động.
- Event/EventSession tồn tại và cho phép đăng ký.
- Thời điểm hiện tại nằm trong cửa sổ đăng ký.
- Attendee chưa có Registration cho EventSession đó.

### Luồng chính - FCFS còn chỗ
1. Attendee chọn một EventSession và yêu cầu đăng ký.
2. Hệ thống xác thực người dùng và quyền truy cập.
3. Hệ thống kiểm tra rate limit/anti-bot rule.
4. Hệ thống kiểm tra cửa sổ đăng ký và duplicate registration.
5. Hệ thống tạo Registration.
6. Hệ thống kiểm tra số chỗ còn lại trong transaction.
7. Registration chuyển sang `CONFIRMED`.
8. Hệ thống tạo một Ticket `VALID`.
9. Hệ thống trả kết quả đăng ký thành công và thông tin vé.

### Luồng thay thế A - FCFS hết chỗ
Tại bước 6, nếu capacity đã đủ:
1. Registration chuyển sang `WAITLISTED`.
2. Hệ thống tạo `WaitlistEntry` ở vị trí kế tiếp theo FCFS.
3. Không phát Ticket.
4. Trả trạng thái waitlist cho Attendee.

### Luồng thay thế B - LOTTERY
Sau bước 5:
1. Registration giữ trạng thái `PENDING`.
2. Không phát Ticket ngay.
3. Sau khi cửa sổ đăng ký đóng, UC12 thực hiện AllocationRun.

### Ngoại lệ
- Ngoài thời gian đăng ký: từ chối.
- Đã đăng ký cùng suất: từ chối.
- Tài khoản bị khóa hoặc vượt rate limit: từ chối.
- Session bị hủy/không còn nhận đăng ký: từ chối.

### Hậu điều kiện
- FCFS: Registration là `CONFIRMED` hoặc `WAITLISTED`.
- LOTTERY: Registration là `PENDING` cho đến AllocationRun.
- Không bao giờ vượt capacity.

---

## UC06 - Hủy đăng ký
### Mục tiêu
Attendee hủy Registration của mình trước khi EventSession bắt đầu và trước khi Ticket được sử dụng.

### Actor chính
Attendee.

### Tiền điều kiện
- Registration thuộc Attendee hiện tại.
- Registration chưa `CANCELLED`.
- EventSession chưa bắt đầu.
- Ticket, nếu có, chưa `USED`.

### Luồng chính - hủy Registration đã xác nhận
1. Attendee yêu cầu hủy Registration.
2. Hệ thống kiểm tra quyền sở hữu và điều kiện hủy.
3. Registration chuyển `CANCELLED`.
4. Ticket `VALID` tương ứng chuyển `CANCELLED`.
5. Hệ thống kiểm tra waitlist của EventSession.
6. Nếu có người chờ, lấy người đứng đầu theo thứ tự hợp lệ.
7. Registration của người đó chuyển `CONFIRMED`.
8. WaitlistEntry được đánh dấu đã promote/loại khỏi hàng chờ hoạt động.
9. Hệ thống phát Ticket `VALID` mới cho người được promote.

### Luồng thay thế
- Registration đang `PENDING`: chuyển thẳng `CANCELLED`, không promote vì chưa chiếm capacity.
- Registration đang `WAITLISTED`: chuyển `CANCELLED` và rời waitlist, không phát Ticket.
- Không có người trong waitlist: kết thúc sau khi giải phóng chỗ.

### Hậu điều kiện
Không còn Ticket hợp lệ cho Registration đã hủy; nếu có waitlist và chỗ trống thì hệ thống tự lấp chỗ nhưng không vượt capacity.

---

## UC09 - Tạo/cập nhật sự kiện
### Mục tiêu
Organizer tạo Event và chuẩn bị dữ liệu cần thiết trước khi công bố.

### Actor chính
Organizer.

### Tiền điều kiện
Organizer đã đăng nhập và có role phù hợp.

### Luồng chính
1. Organizer nhập tên, mô tả, địa điểm, thời gian tổng quan, ảnh và thông tin liên quan.
2. Hệ thống validate dữ liệu.
3. Hệ thống tạo Event ở trạng thái `DRAFT` và gán ownership cho Organizer.
4. Organizer bổ sung EventSession.
5. Organizer khai báo AccessibilityFeature.
6. Sau khi đủ dữ liệu, Organizer có thể dùng UC11 để công bố/mở đăng ký.

### Quy tắc
- Organizer chỉ sửa Event do mình sở hữu.
- Event chưa đủ dữ liệu/suất hợp lệ không được công bố.
- Ảnh chỉ lưu URL/metadata trong PostgreSQL; file nằm ở object storage.

---

## UC12 - Thực hiện phân bổ vé
### Mục tiêu
Phân bổ vé theo `AllocationPolicy`, đặc biệt là LOTTERY, đảm bảo công bằng, không vượt capacity và có khả năng audit.

### Actor chính
Organizer.

### Tiền điều kiện
- Organizer sở hữu Event chứa EventSession.
- Cửa sổ đăng ký đã đóng đối với LOTTERY.
- Chưa có AllocationRun hoàn tất cho cùng đợt/phạm vi phân bổ.

### Luồng chính - LOTTERY
1. Organizer yêu cầu chạy allocation cho EventSession.
2. Hệ thống khóa/đảm bảo không có hai AllocationRun cạnh tranh.
3. Hệ thống lấy tập Registration `PENDING` hợp lệ.
4. Hệ thống tính số slot khả dụng theo capacity và số chỗ đã được xác nhận hợp lệ.
5. Hệ thống tạo thứ tự ngẫu nhiên công bằng cho tập ứng viên.
6. Tối đa số slot đầu tiên được chuyển `CONFIRMED`.
7. Mỗi Registration được xác nhận được phát đúng một Ticket `VALID`.
8. Các Registration còn lại chuyển `WAITLISTED` theo chính thứ tự rút.
9. Hệ thống ghi `AllocationRun` cùng metadata phục vụ audit.
10. Hệ thống commit toàn bộ kết quả trong transaction.

### Luồng FCFS
FCFS được áp dụng chủ yếu trong UC05 tại thời điểm Registration đến hệ thống. UC12 vẫn có thể dùng để xem/audit trạng thái phân bổ, không cần batch draw như LOTTERY.

### Hậu điều kiện
- Số Registration `CONFIRMED` không vượt capacity.
- Kết quả allocation có bản ghi audit.
- Người không trúng LOTTERY được xếp waitlist theo thứ tự đã rút.

---

## UC14 - Check-in vé
### Mục tiêu
CheckInStaff xác minh Ticket và ghi nhận một lượt check-in hợp lệ.

### Actor chính
CheckInStaff.

### Tiền điều kiện
- Staff đã đăng nhập và có quyền check-in.
- Ticket tồn tại và gắn với đúng EventSession cần check-in.

### Luồng chính
1. Staff quét QR hoặc nhập ticket code.
2. Hệ thống tìm Ticket.
3. Hệ thống kiểm tra Ticket ở trạng thái `VALID`.
4. Hệ thống kiểm tra chưa có CheckIn thành công cho Ticket.
5. Hệ thống kiểm tra ngữ cảnh EventSession phù hợp.
6. Hệ thống tạo CheckIn record.
7. Ticket chuyển `USED`.
8. Hệ thống trả kết quả check-in thành công.

### Ngoại lệ
- Ticket không tồn tại: từ chối.
- Ticket `CANCELLED`, `EXPIRED` hoặc `USED`: từ chối.
- Ticket thuộc EventSession khác: từ chối.
- Request đồng thời cho cùng Ticket: chỉ một request được commit thành công.

### Hậu điều kiện
Ticket đã dùng không thể check-in lần thứ hai theo luồng thông thường.

---

## Ma trận Use Case -> sơ đồ tiếp theo
| Use Case | Domain/Class | Sequence | Activity | State |
|---|---:|---:|---:|---:|
| UC05 Đăng ký suất | Bắt buộc | Bắt buộc | Bắt buộc | Registration |
| UC06 Hủy + promote waitlist | Bắt buộc | Bắt buộc | Bắt buộc | Registration/Ticket |
| UC09 Tạo sự kiện | Bắt buộc | Nên có | Có thể | Event |
| UC12 Allocation | Bắt buộc | Bắt buộc | Bắt buộc | Registration |
| UC14 Check-in | Bắt buộc | Bắt buộc | Có thể | Ticket |

## Ghi chú consistency
Các tên `Event`, `EventSession`, `Registration`, `WaitlistEntry`, `Ticket`, `CheckIn`, `AllocationRun`, `AccessibilityFeature` trong tài liệu này là tên chuẩn để dùng tiếp ở Domain Model/Class Diagram/ERD, trừ khi có quyết định thay đổi được ghi rõ trong tài liệu yêu cầu.
