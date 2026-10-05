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
5. Trong transaction có khóa EventSession, hệ thống tạo Registration `PENDING`.
6. Hệ thống kiểm tra số chỗ còn lại.
7. Registration chuyển sang `CONFIRMED`.
8. Hệ thống tạo một Ticket `VALID`.
9. Transaction commit và hệ thống trả kết quả đăng ký thành công.

### Luồng thay thế A - FCFS hết chỗ
Tại bước 6, nếu capacity đã đủ:
1. Registration chuyển sang `WAITLISTED`.
2. Hệ thống tạo `WaitlistEntry` ở thứ tự tiếp theo theo FCFS.
3. Không phát Ticket.
4. Transaction commit và trả trạng thái waitlist cho Attendee.

### Luồng thay thế B - LOTTERY
Sau khi kiểm tra hợp lệ:
1. Hệ thống tạo Registration `PENDING`.
2. Không phát Ticket ngay.
3. Sau khi cửa sổ đăng ký đóng, UC12 thực hiện AllocationRun.

### Ngoại lệ
- Ngoài thời gian đăng ký: từ chối.
- Đã từng có Registration cùng suất trong MVP: từ chối tạo bản ghi thứ hai.
- Tài khoản bị khóa hoặc vượt rate limit: từ chối.
- Session bị hủy/không còn nhận đăng ký: từ chối.
- Vi phạm unique constraint do request đồng thời: rollback và trả lỗi duplicate.

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
2. Hệ thống kiểm tra quyền sở hữu, trạng thái Session và Ticket hiện tại.
3. Hệ thống khóa EventSession trong transaction.
4. Registration chuyển `CANCELLED`.
5. Ticket `VALID` tương ứng chuyển `CANCELLED`.
6. Hệ thống kiểm tra waitlist của EventSession theo `position` tăng dần.
7. Nếu có người chờ, lấy entry `ACTIVE` đầu tiên.
8. Registration của người đó chuyển `CONFIRMED`.
9. WaitlistEntry chuyển `PROMOTED`.
10. Hệ thống phát Ticket `VALID` mới cho người được promote và commit transaction.

### Luồng thay thế
- Registration đang `PENDING`: chuyển thẳng `CANCELLED`, không promote vì chưa chiếm capacity.
- Registration đang `WAITLISTED`: chuyển `CANCELLED`, WaitlistEntry chuyển `CANCELLED`, không promote vì chưa chiếm capacity.
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
4. Event `DRAFT` có thể tạm thời chưa có EventSession.
5. Organizer bổ sung EventSession và AccessibilityFeature.
6. Sau khi có ít nhất một EventSession hợp lệ và đủ dữ liệu, Organizer có thể dùng UC11 để công bố/mở đăng ký.

### Quy tắc
- Organizer chỉ sửa Event do mình sở hữu.
- Event chưa có ít nhất một suất hợp lệ không được công bố.
- Ảnh chỉ lưu URL/metadata trong PostgreSQL; file nằm ở object storage.

---

## UC12 - Thực hiện phân bổ vé
### Mục tiêu
Phân bổ vé theo `LOTTERY`, đảm bảo công bằng, không vượt capacity và có khả năng audit.

### Actor chính
Organizer.

### Tiền điều kiện
- Organizer sở hữu Event chứa EventSession.
- EventSession có `AllocationPolicy = LOTTERY`.
- Cửa sổ đăng ký đã đóng.
- Chưa tồn tại AllocationRun đã commit cho EventSession này.

### Luồng chính - LOTTERY
1. Organizer yêu cầu chạy allocation cho EventSession.
2. Hệ thống khóa EventSession để ngăn hai run cạnh tranh.
3. Hệ thống kiểm tra chưa có AllocationRun cho session.
4. Hệ thống lấy tập Registration `PENDING` hợp lệ.
5. Hệ thống tính số slot khả dụng theo capacity và số chỗ đã được xác nhận hợp lệ.
6. `LotteryAllocationStrategy` tạo thứ tự ngẫu nhiên công bằng cho tập ứng viên.
7. Tối đa số slot đầu tiên được chuyển `CONFIRMED`.
8. Mỗi Registration được xác nhận được phát đúng một Ticket `VALID`.
9. Các Registration còn lại chuyển `WAITLISTED` theo chính thứ tự rút và tạo WaitlistEntry theo draw position.
10. Hệ thống ghi `AllocationRun` gồm người kích hoạt, counts và metadata phục vụ audit.
11. Hệ thống commit toàn bộ kết quả trong một transaction.

### Luồng FCFS
FCFS được áp dụng trực tiếp trong UC05 tại thời điểm Registration đến hệ thống. Trong MVP không chạy batch AllocationRun cho FCFS; có thể kiểm chứng FCFS qua `registeredAt`, trạng thái Registration, Ticket và log/transaction history.

### Hậu điều kiện
- Số Registration `CONFIRMED` không vượt capacity.
- Chỉ một AllocationRun LOTTERY có thể commit cho EventSession.
- Kết quả allocation có dữ liệu audit gồm người kích hoạt và metadata thuật toán.
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
2. Hệ thống tìm và khóa Ticket cần kiểm tra.
3. Hệ thống kiểm tra Ticket ở trạng thái `VALID`.
4. Hệ thống kiểm tra chưa có CheckIn thành công cho Ticket.
5. Hệ thống kiểm tra Ticket qua Registration thuộc đúng EventSession.
6. Hệ thống tạo CheckIn record.
7. Ticket chuyển `USED`.
8. Hệ thống commit và trả kết quả check-in thành công.

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
