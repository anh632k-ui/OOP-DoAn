# 01. Yêu cầu nghiệp vụ - MED-06

## 1. Mục tiêu hệ thống
Xây dựng cổng quản lý sự kiện văn hóa và vé miễn phí cho phép đơn vị tổ chức công bố sự kiện, quản lý các suất, tiếp nhận đăng ký, phân bổ vé công bằng, vận hành danh sách chờ và check-in bằng vé điện tử. Hệ thống phải có chống bot cơ bản và thể hiện rõ thông tin accessibility để người tham dự có thể lựa chọn sự kiện phù hợp.

## 2. Phạm vi
### 2.1. Trong phạm vi
- Đăng ký, đăng nhập và phân quyền người dùng.
- Xem, tìm kiếm và lọc sự kiện.
- Xem lịch các suất của từng sự kiện.
- Organizer tạo/cập nhật/công bố sự kiện và quản lý suất.
- Quản lý thời gian mở/đóng đăng ký.
- Attendee đăng ký một suất miễn phí.
- Hai chính sách phân bổ: `FCFS` và `LOTTERY`.
- Danh sách chờ và tự động promote khi có chỗ trống.
- Phát vé điện tử có mã QR cho đăng ký được xác nhận.
- Check-in một lần bằng vé hợp lệ.
- Quản lý và lọc các đặc tính accessibility.
- Chống bot cơ bản bằng rate limit, chống đăng ký trùng và các rule kiểm tra tài khoản/request.
- Theo dõi lịch sử phân bổ và check-in phục vụ kiểm chứng.

### 2.2. Ngoài phạm vi MVP
- Thanh toán và cổng thanh toán.
- Vé trả phí, hoàn tiền, hóa đơn.
- Microservices, Kafka, Kubernetes.
- AI/ML chống bot.
- Face recognition.
- Blockchain/NFT ticket.
- Marketplace mua bán/chuyển nhượng vé.
- Hệ thống chat, mạng xã hội, recommendation AI.

## 3. Actor nghiệp vụ
| Actor | Mô tả |
|---|---|
| Guest | Người chưa đăng nhập; có thể xem/tìm kiếm sự kiện, xem chi tiết và tạo tài khoản/đăng nhập. |
| Attendee | Người tham dự; có thể đăng ký suất, theo dõi trạng thái, hủy đăng ký và xem vé. |
| Organizer | Đơn vị/người tổ chức; tạo và quản lý Event, EventSession, lịch đăng ký, allocation và waitlist. |
| CheckInStaff | Nhân viên tại sự kiện; xác minh QR và thực hiện check-in. |
| Administrator | Quản trị hệ thống; quản lý người dùng và giám sát dữ liệu/nghiệp vụ hệ thống. |

> `Guest` không phải role lưu trong CSDL. `Authenticated User` trong Use Case Diagram chỉ là actor khái quát để gom hành vi chung của tài khoản đã đăng nhập, cũng không phải role lưu trong CSDL. Các role tài khoản: `ATTENDEE`, `ORGANIZER`, `STAFF`, `ADMIN`.

## 4. Yêu cầu chức năng
| ID | Yêu cầu |
|---|---|
| FR-01 | Guest có thể đăng ký tài khoản và đăng nhập. |
| FR-02 | Hệ thống phân quyền chức năng theo role. |
| FR-03 | Guest/người dùng đã đăng nhập có thể xem danh sách, tìm kiếm và lọc Event. |
| FR-04 | Người dùng có thể xem chi tiết Event, các EventSession và AccessibilityFeature. |
| FR-05 | Organizer có thể tạo, cập nhật và công bố Event. |
| FR-06 | Organizer có thể tạo/cập nhật/mở/đóng/hủy EventSession với thời gian, sức chứa và thời gian đăng ký. |
| FR-07 | Organizer có thể chọn `FCFS` hoặc `LOTTERY` cho từng EventSession. |
| FR-08 | Attendee có thể gửi Registration cho một EventSession khi cửa sổ đăng ký đang mở. |
| FR-09 | Hệ thống phải ngăn một Attendee tạo nhiều Registration cho cùng một EventSession. |
| FR-10 | Với `FCFS`, hệ thống xác nhận ngay nếu còn chỗ; nếu đầy thì đưa vào waitlist. |
| FR-11 | Với `LOTTERY`, Registration hợp lệ ở trạng thái chờ đến khi đóng đăng ký và chạy phân bổ. |
| FR-12 | Hệ thống phân bổ số người trúng không vượt quá capacity và đưa phần còn lại vào waitlist theo thứ tự của lần rút. |
| FR-13 | Registration được xác nhận phải được phát đúng một Ticket. |
| FR-14 | Attendee có thể xem Registration, vị trí waitlist và Ticket của mình. |
| FR-15 | Attendee có thể hủy Registration trước khi suất bắt đầu nếu Ticket chưa được sử dụng. |
| FR-16 | Khi một Registration đã xác nhận bị hủy và waitlist còn người, hệ thống promote người tiếp theo và phát Ticket. |
| FR-17 | CheckInStaff có thể quét/nhập mã Ticket để xác minh và check-in. |
| FR-18 | Một Ticket chỉ được check-in thành công một lần. |
| FR-19 | Organizer có thể khai báo AccessibilityFeature cho Event. |
| FR-20 | Người dùng có thể lọc Event theo AccessibilityFeature. |
| FR-21 | Hệ thống áp dụng chống bot cơ bản cho thao tác đăng ký. |
| FR-22 | Organizer có thể xem số liệu đăng ký, số vé đã cấp, waitlist và check-in theo EventSession. |
| FR-23 | Administrator có thể khóa/mở khóa tài khoản và giám sát Event khi cần. |
| FR-24 | Hệ thống lưu thông tin AllocationRun để phục vụ kiểm chứng quá trình phân bổ. |

## 5. Business Rules
| ID | Quy tắc |
|---|---|
| BR-01 | Event ở trạng thái `DRAFT` có thể chưa có EventSession. Muốn `PUBLISHED`, Event phải có ít nhất một EventSession hợp lệ. Ticket/Registration luôn gắn với EventSession, không gắn trực tiếp với Event. |
| BR-02 | `capacity` của EventSession phải lớn hơn 0 và không vượt quá sức chứa địa điểm theo mô hình MVP. |
| BR-03 | Attendee chỉ được đăng ký khi `registrationOpenAt <= currentTime < registrationCloseAt` và EventSession ở trạng thái cho phép đăng ký. |
| BR-04 | MVP dùng một Registration duy nhất cho mỗi cặp `(attendeeId, sessionId)` trong toàn bộ vòng đời. Registration đã `CANCELLED` không tạo bản ghi thứ hai cho cùng cặp; constraint DB `UNIQUE(attendee_id, session_id)` là lớp bảo vệ cuối. |
| BR-05 | `FCFS`: thứ tự ưu tiên dựa trên thời điểm Registration được hệ thống chấp nhận; khi bằng thời gian dùng ID/sequence làm tie-breaker xác định. |
| BR-06 | `FCFS`: nếu số Registration xác nhận nhỏ hơn capacity thì Registration mới chuyển `CONFIRMED`; ngược lại chuyển `WAITLISTED`. |
| BR-07 | `LOTTERY`: Registration hợp lệ ban đầu ở `PENDING`; sau khi đóng đăng ký mới được đưa vào AllocationRun. |
| BR-08 | `LOTTERY`: hệ thống tạo một thứ tự ngẫu nhiên công bằng từ tập Registration hợp lệ; tối đa số slot khả dụng phần tử đầu được `CONFIRMED`, phần còn lại thành waitlist theo chính thứ tự rút. |
| BR-09 | Mỗi Registration `CONFIRMED` có tối đa một Ticket; Ticket không được tạo cho Registration chưa xác nhận. |
| BR-10 | Hủy Registration `CONFIRMED` phải hủy Ticket chưa dùng tương ứng. Nếu waitlist có người, hệ thống promote người đầu danh sách và phát Ticket mới. |
| BR-11 | Registration/Ticket đã check-in (`USED`) không được hủy theo luồng thông thường. |
| BR-12 | Ticket chỉ check-in được nếu thuộc đúng EventSession, ở trạng thái `VALID` và chưa có CheckIn thành công trước đó. |
| BR-13 | Check-in thành công làm Ticket chuyển sang `USED` và tạo đúng một CheckIn record. |
| BR-14 | Chống bot tối thiểu gồm: authenticated account, rate limit cấu hình được, unique registration constraint và kiểm tra trạng thái tài khoản. |
| BR-15 | AccessibilityFeature mang tính mô tả/lọc trong MVP; không tự động tạo quota ưu tiên hoặc thay đổi thuật toán allocation. |
| BR-16 | AllocationRun phải lưu tối thiểu: session, người kích hoạt, policy, thời điểm chạy, số ứng viên hợp lệ, số vé cấp và dữ liệu cần thiết để audit kết quả. Trong MVP, một EventSession `LOTTERY` chỉ có một AllocationRun đã commit. |
| BR-17 | Organizer chỉ được quản lý Event do mình sở hữu; Admin có quyền quản trị toàn hệ thống. |
| BR-18 | Không được oversell: việc xác nhận Registration, phát Ticket và promote waitlist phải dùng transaction/locking phù hợp khi có request đồng thời. |
| BR-19 | Khi EventSession bị hủy, các Registration chưa kết thúc của suất được chuyển `CANCELLED` và Ticket `VALID` tương ứng phải bị hủy. Event bị hủy phải dẫn tới hủy các EventSession chưa hoàn tất. |
| BR-20 | `WaitlistEntry.position` là khóa thứ tự ưu tiên của hàng chờ, không bắt buộc luôn bằng thứ hạng hiển thị hiện tại; thứ hạng hiển thị có thể tính lại từ các entry `ACTIVE`. |

## 6. Trạng thái nghiệp vụ dự kiến
### 6.1. Event
`DRAFT -> PUBLISHED -> COMPLETED`

Nhánh hủy: `DRAFT/PUBLISHED -> CANCELLED`.

### 6.2. EventSession
`DRAFT -> REGISTRATION_OPEN -> REGISTRATION_CLOSED -> ONGOING -> COMPLETED`

Có thể chuyển sang `CANCELLED` trước khi hoàn tất.

### 6.3. Registration
- FCFS còn chỗ: `PENDING -> CONFIRMED`.
- FCFS hết chỗ: `PENDING -> WAITLISTED -> CONFIRMED` khi được promote.
- Lottery: `PENDING -> CONFIRMED` hoặc `PENDING -> WAITLISTED` sau AllocationRun.
- `PENDING/WAITLISTED/CONFIRMED -> CANCELLED` khi thỏa điều kiện hủy hoặc EventSession bị hủy.

### 6.4. Ticket
`VALID -> USED`

Nhánh khác: `VALID -> CANCELLED` hoặc `VALID -> EXPIRED`.

## 7. Yêu cầu phi chức năng
| ID | Yêu cầu |
|---|---|
| NFR-01 | Kiến trúc backend theo Modular Monolith, module hóa rõ trách nhiệm và ưu tiên SOLID. |
| NFR-02 | API sử dụng xác thực và authorization theo role; mật khẩu phải được hash, không lưu plaintext. |
| NFR-03 | Các thao tác phân bổ, xác nhận vé, hủy và promote waitlist phải đảm bảo tính nhất quán giao dịch. |
| NFR-04 | Hệ thống không cho oversell dù có nhiều request đăng ký đồng thời. |
| NFR-05 | Các thao tác phổ biến của MVP hướng tới thời gian phản hồi dưới khoảng 2 giây trong điều kiện tải đồ án thông thường, ngoại trừ tác vụ batch allocation lớn. |
| NFR-06 | Giao diện phải responsive và hỗ trợ điều hướng bàn phím, label cho control quan trọng và tương phản phù hợp; hướng đến các tiêu chí WCAG 2.1 AA khả thi trong đồ án. |
| NFR-07 | Dữ liệu allocation và check-in phải có khả năng audit. |
| NFR-08 | Có unit test cho domain/service trọng yếu và integration/E2E test cho các luồng đăng ký, allocation, waitlist và check-in. |
| NFR-09 | Hệ thống có thể chạy bằng Docker cho môi trường kiểm thử/triển khai. |
| NFR-10 | Ảnh sự kiện lưu ở object storage; PostgreSQL chỉ lưu metadata/URL. |
| NFR-11 | Search MVP ưu tiên PostgreSQL search/full-text; không bắt buộc Elasticsearch. |

## 8. Các bất biến quan trọng cần bảo vệ khi code
1. `confirmed registrations <= session.capacity`.
2. Một Attendee không có hai Registration cho cùng một EventSession.
3. Một Registration chỉ có tối đa một Ticket gắn với nó.
4. Một Ticket chỉ có tối đa một CheckIn thành công.
5. `USED` Ticket không quay lại `VALID` bằng luồng nghiệp vụ thông thường.
6. Waitlist promotion không được tạo vượt capacity.
7. Event chỉ được publish khi có ít nhất một EventSession hợp lệ.
8. Một EventSession LOTTERY chỉ có một AllocationRun đã commit trong MVP.
9. Các thay đổi trạng thái phải đi qua application/domain service, không cập nhật tùy tiện từ controller.

## 9. Baseline hiện tại
Tài liệu này là nguồn chuẩn cho các sơ đồ tiếp theo trên nhánh `dev`. Nếu thay đổi một business rule, phải kiểm tra và cập nhật tối thiểu: Use Case, Domain Model, Class Diagram, ERD và Sequence/Activity/State liên quan.
