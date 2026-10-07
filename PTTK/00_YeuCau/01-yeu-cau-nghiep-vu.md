# 01. Yêu cầu nghiệp vụ - MED-06

## 1. Mục tiêu hệ thống
Xây dựng cổng quản lý sự kiện văn hóa và vé miễn phí cho phép đơn vị tổ chức công bố sự kiện, quản lý các suất, tiếp nhận đăng ký, phân bổ vé công bằng, vận hành danh sách chờ và check-in bằng vé điện tử. Hệ thống phải có chống bot cơ bản và thể hiện rõ thông tin hỗ trợ tiếp cận để người tham dự có thể lựa chọn sự kiện phù hợp.

## 2. Phạm vi
### 2.1. Trong phạm vi
- Đăng ký, đăng nhập và phân quyền người dùng.
- Xem, tìm kiếm và lọc sự kiện.
- Xem lịch các suất của từng sự kiện.
- Ban tổ chức tạo/cập nhật/công bố sự kiện và quản lý suất.
- Quản lý thời gian mở/đóng đăng ký.
- Người tham dự đăng ký một suất miễn phí.
- Hai chính sách phân bổ: `FCFS` và `LOTTERY`.
- Danh sách chờ và tự động chọn người tiếp theo khi có chỗ trống.
- Phát vé điện tử có mã QR cho đăng ký được xác nhận.
- Check-in một lần bằng vé hợp lệ.
- Quản lý và lọc các đặc tính hỗ trợ tiếp cận.
- Chống bot cơ bản bằng giới hạn tần suất, chống đăng ký trùng và các quy tắc kiểm tra tài khoản/yêu cầu.
- Theo dõi lịch sử phân bổ và check-in phục vụ kiểm chứng.

### 2.2. Ngoài phạm vi MVP
- Thanh toán và cổng thanh toán.
- Vé trả phí, hoàn tiền, hóa đơn.
- Microdịch vụs, Kafka, Kubernetes.
- AI/ML chống bot.
- Nhận diện khuôn mặt.
- Bkhóachain/NFT ticket.
- Marketplace mua bán/chuyển nhượng vé.
- Hệ thống chat, mạng xã hội, gợi ý bằng AI.

## 3. Tác nhân nghiệp vụ
| Tác nhân | Mô tả |
|---|---|
| Khách | Người chưa đăng nhập; có thể xem/tìm kiếm sự kiện, xem chi tiết và tạo tài khoản/đăng nhập. |
| Người tham dự | Người tham dự; có thể đăng ký suất, theo dõi trạng thái, hủy đăng ký và xem vé. |
| Ban tổ chức | Đơn vị/người tổ chức; tạo và quản lý Sự kiện, Suất sự kiện, lịch đăng ký, phân bổ và danh sách chờ. |
| Nhân viên check-in | Nhân viên tại sự kiện; xác minh QR và thực hiện check-in. |
| Quản trị viên | Quản trị hệ thống; quản lý người dùng và giám sát dữ liệu/nghiệp vụ hệ thống. |

> `Khách` không phải vai trò lưu trong CSDL. `Người dùng đã đăng nhập` trong Use Case Diagram chỉ là tác nhân khái quát để gom hành vi chung của tài khoản đã đăng nhập, cũng không phải vai trò lưu trong CSDL. Các vai trò tài khoản: `NGƯỜI_THAM_DỰ`, `BAN_TỔ_CHỨC`, `NHÂN_VIÊN`, `QUẢN_TRỊ_VIÊN`.

## 4. Yêu cầu chức năng
| ID | Yêu cầu |
|---|---|
| FR-01 | Khách có thể đăng ký tài khoản và đăng nhập. |
| FR-02 | Hệ thống phân quyền chức năng theo vai trò. |
| FR-03 | Khách/người dùng đã đăng nhập có thể xem danh sách, tìm kiếm và lọc Sự kiện. |
| FR-04 | Người dùng có thể xem chi tiết Sự kiện, các Suất sự kiện và Đặc tính hỗ trợ tiếp cận. |
| FR-05 | Ban tổ chức có thể tạo, cập nhật và công bố Sự kiện. |
| FR-06 | Ban tổ chức có thể tạo/cập nhật/mở/đóng/hủy Suất sự kiện với thời gian, sức chứa và thời gian đăng ký. |
| FR-07 | Ban tổ chức có thể chọn `FCFS` hoặc `LOTTERY` cho từng Suất sự kiện. |
| FR-08 | Người tham dự có thể gửi Đăng ký cho một Suất sự kiện khi cửa sổ đăng ký đang mở. |
| FR-09 | Hệ thống phải ngăn một Người tham dự tạo nhiều Đăng ký cho cùng một Suất sự kiện. |
| FR-10 | Với `FCFS`, hệ thống xác nhận ngay nếu còn chỗ; nếu đầy thì đưa vào danh sách chờ. |
| FR-11 | Với `LOTTERY`, Đăng ký hợp lệ ở trạng thái chờ đến khi đóng đăng ký và chạy phân bổ. |
| FR-12 | Hệ thống phân bổ số người trúng không vượt quá sức chứa và đưa phần còn lại vào danh sách chờ theo thứ tự của lần rút. |
| FR-13 | Đăng ký được xác nhận phải được phát đúng một Vé. |
| FR-14 | Người tham dự có thể xem Đăng ký, vị trí danh sách chờ và Vé của mình. |
| FR-15 | Người tham dự có thể hủy Đăng ký trước khi suất bắt đầu nếu Vé chưa được sử dụng. |
| FR-16 | Khi một Đăng ký đã xác nhận bị hủy và danh sách chờ còn người, hệ thống chọn người tiếp theo người tiếp theo và phát Vé. |
| FR-17 | Nhân viên check-in có thể quét/nhập mã Vé để xác minh và check-in. |
| FR-18 | Một Vé chỉ được check-in thành công một lần. |
| FR-19 | Ban tổ chức có thể khai báo Đặc tính hỗ trợ tiếp cận cho Sự kiện. |
| FR-20 | Người dùng có thể lọc Sự kiện theo Đặc tính hỗ trợ tiếp cận. |
| FR-21 | Hệ thống áp dụng chống bot cơ bản cho thao tác đăng ký. |
| FR-22 | Ban tổ chức có thể xem số liệu đăng ký, số vé đã cấp, danh sách chờ và check-in theo Suất sự kiện. |
| FR-23 | Quản trị viên có thể khóa/mở khóa tài khoản và giám sát Sự kiện khi cần. |
| FR-24 | Hệ thống lưu thông tin Lần phân bổ để phục vụ kiểm chứng quá trình phân bổ. |

## 5. Quy tắc nghiệp vụ
| ID | Quy tắc |
|---|---|
| BR-01 | Sự kiện ở trạng thái `NHÁP` có thể chưa có Suất sự kiện. Muốn `ĐÃ_CÔNG_BỐ`, Sự kiện phải có ít nhất một Suất sự kiện hợp lệ. Vé/Đăng ký luôn gắn với Suất sự kiện, không gắn trực tiếp với Sự kiện. |
| BR-02 | `sức chứa` của Suất sự kiện phải lớn hơn 0 và không vượt quá sức chứa địa điểm theo mô hình MVP. |
| BR-03 | Người tham dự chỉ được đăng ký khi `registrationOpenAt <= thời điểm hiện tại < registrationCloseAt` và Suất sự kiện ở trạng thái cho phép đăng ký. |
| BR-04 | MVP dùng một Đăng ký duy nhất cho mỗi cặp `(attendeeId, sessionId)` trong toàn bộ vòng đời. Đăng ký đã `ĐÃ_HỦY` không tạo bản ghi thứ hai cho cùng cặp; constraint DB `UNIQUE(attendee_id, session_id)` là lớp bảo vệ cuối. |
| BR-05 | `FCFS`: thứ tự ưu tiên dựa trên thời điểm Đăng ký được hệ thống chấp nhận; khi bằng thời gian dùng ID/sequence làm tie-breaker xác định. |
| BR-06 | `FCFS`: nếu số Đăng ký xác nhận nhỏ hơn sức chứa thì Đăng ký mới chuyển `ĐÃ_XÁC_NHẬN`; ngược lại chuyển `DANH_SÁCH_CHỜ`. |
| BR-07 | `LOTTERY`: Đăng ký hợp lệ ban đầu ở `CHỜ_XỬ_LÝ`; sau khi đóng đăng ký mới được đưa vào Lần phân bổ. |
| BR-08 | `LOTTERY`: hệ thống tạo một thứ tự ngẫu nhiên công bằng từ tập Đăng ký hợp lệ; tối đa số slot khả dụng phần tử đầu được `ĐÃ_XÁC_NHẬN`, phần còn lại thành danh sách chờ theo chính thứ tự rút. |
| BR-09 | Mỗi Đăng ký `ĐÃ_XÁC_NHẬN` có tối đa một Vé; Vé không được tạo cho Đăng ký chưa xác nhận. |
| BR-10 | Hủy Đăng ký `ĐÃ_XÁC_NHẬN` phải hủy Vé chưa dùng tương ứng. Nếu danh sách chờ có người, hệ thống chọn người tiếp theo người đầu danh sách và phát Vé mới. |
| BR-11 | Đăng ký/Vé đã check-in (`ĐÃ_SỬ_DỤNG`) không được hủy theo luồng thông thường. |
| BR-12 | Vé chỉ check-in được nếu thuộc đúng Suất sự kiện, ở trạng thái `HỢP_LỆ` và chưa có Lượt check-in thành công trước đó. |
| BR-13 | Check-in thành công làm Vé chuyển sang `ĐÃ_SỬ_DỤNG` và tạo đúng một Lượt check-in record. |
| BR-14 | Chống bot tối thiểu gồm: authenticated account, giới hạn tần suất cấu hình được, unique registration constraint và kiểm tra trạng thái tài khoản. |
| BR-15 | Đặc tính hỗ trợ tiếp cận mang tính mô tả/lọc trong MVP; không tự động tạo quota ưu tiên hoặc thay đổi thuật toán phân bổ. |
| BR-16 | Lần phân bổ phải lưu tối thiểu: session, người kích hoạt, policy, thời điểm chạy, số ứng viên hợp lệ, số vé cấp và dữ liệu cần thiết để kiểm chứng kết quả. Trong MVP, một Suất sự kiện `LOTTERY` chỉ có một Lần phân bổ đã commit. |
| BR-17 | Ban tổ chức chỉ được quản lý Sự kiện do mình sở hữu; Admin có quyền quản trị toàn hệ thống. |
| BR-18 | Không được oversell: việc xác nhận Đăng ký, phát Vé và chọn người tiếp theo danh sách chờ phải dùng giao dịch/khóa dữ liệu phù hợp khi có yêu cầu đồng thời. |
| BR-19 | Khi Suất sự kiện bị hủy, các Đăng ký chưa kết thúc của suất được chuyển `ĐÃ_HỦY` và Vé `HỢP_LỆ` tương ứng phải bị hủy. Sự kiện bị hủy phải dẫn tới hủy các Suất sự kiện chưa hoàn tất. |
| BR-20 | `Mục danh sách chờ.position` là khóa thứ tự ưu tiên của hàng chờ, không bắt buộc luôn bằng thứ hạng hiển thị hiện tại; thứ hạng hiển thị có thể tính lại từ các mục `ĐANG_CHỜ`. |

## 6. Trạng thái nghiệp vụ dự kiến
### 6.1. Sự kiện
`NHÁP -> ĐÃ_CÔNG_BỐ -> COMPLETED`

Nhánh hủy: `NHÁP/ĐÃ_CÔNG_BỐ -> ĐÃ_HỦY`.

### 6.2. Suất sự kiện
`NHÁP -> REGISTRATION_OPEN -> REGISTRATION_CLOSED -> ONGOING -> COMPLETED`

Có thể chuyển sang `ĐÃ_HỦY` trước khi hoàn tất.

### 6.3. Đăng ký
- FCFS còn chỗ: `CHỜ_XỬ_LÝ -> ĐÃ_XÁC_NHẬN`.
- FCFS hết chỗ: `CHỜ_XỬ_LÝ -> DANH_SÁCH_CHỜ -> ĐÃ_XÁC_NHẬN` khi được chọn người tiếp theo.
- Lottery: `CHỜ_XỬ_LÝ -> ĐÃ_XÁC_NHẬN` hoặc `CHỜ_XỬ_LÝ -> DANH_SÁCH_CHỜ` sau Lần phân bổ.
- `CHỜ_XỬ_LÝ/DANH_SÁCH_CHỜ/ĐÃ_XÁC_NHẬN -> ĐÃ_HỦY` khi thỏa điều kiện hủy hoặc Suất sự kiện bị hủy.

### 6.4. Vé
`HỢP_LỆ -> ĐÃ_SỬ_DỤNG`

Nhánh khác: `HỢP_LỆ -> ĐÃ_HỦY` hoặc `HỢP_LỆ -> HẾT_HẠN`.

## 7. Yêu cầu phi chức năng
| ID | Yêu cầu |
|---|---|
| NFR-01 | Kiến trúc phía máy chủ theo Modular Monolith, module hóa rõ trách nhiệm và ưu tiên SOLID. |
| NFR-02 | API sử dụng xác thực và authorization theo vai trò; mật khẩu phải được hash, không lưu plaintext. |
| NFR-03 | Các thao tác phân bổ, xác nhận vé, hủy và chọn người tiếp theo danh sách chờ phải đảm bảo tính nhất quán giao dịch. |
| NFR-04 | Hệ thống không cho oversell dù có nhiều yêu cầu đăng ký đồng thời. |
| NFR-05 | Các thao tác phổ biến của MVP hướng tới thời gian phản hồi dưới khoảng 2 giây trong điều kiện tải đồ án thông thường, ngoại trừ tác vụ batch phân bổ lớn. |
| NFR-06 | Giao diện phải responsive và hỗ trợ điều hướng bàn phím, label cho control quan trọng và tương phản phù hợp; hướng đến các tiêu chí WCAG 2.1 AA khả thi trong đồ án. |
| NFR-07 | Dữ liệu phân bổ và check-in phải có khả năng kiểm chứng. |
| NFR-08 | Có unit test cho domain/dịch vụ trọng yếu và integration/E2E test cho các luồng đăng ký, phân bổ, danh sách chờ và check-in. |
| NFR-09 | Hệ thống có thể chạy bằng Docker cho môi trường kiểm thử/triển khai. |
| NFR-10 | Ảnh sự kiện lưu ở object storage; PostgreSQL chỉ lưu siêu dữ liệu/URL. |
| NFR-11 | Tìm kiếm MVP ưu tiên PostgreSQL search/full-text; không bắt buộc Elasticsearch. |

## 8. Các bất biến quan trọng cần bảo vệ khi code
1. `confirmed registrations <= session.sức chứa`.
2. Một Người tham dự không có hai Đăng ký cho cùng một Suất sự kiện.
3. Một Đăng ký chỉ có tối đa một Vé gắn với nó.
4. Một Vé chỉ có tối đa một Lượt check-in thành công.
5. `ĐÃ_SỬ_DỤNG` Vé không quay lại `HỢP_LỆ` bằng luồng nghiệp vụ thông thường.
6. Waitlist promotion không được tạo vượt sức chứa.
7. Sự kiện chỉ được công bố khi có ít nhất một Suất sự kiện hợp lệ.
8. Một Suất sự kiện LOTTERY chỉ có một Lần phân bổ đã commit trong MVP.
9. Các thay đổi trạng thái phải đi qua application/domain dịch vụ, không cập nhật tùy tiện từ bộ điều khiển.

## 9. Baseline hiện tại
Tài liệu này là nguồn chuẩn cho các sơ đồ tiếp theo trên nhánh `dev`. Nếu thay đổi một quy tắc nghiệp vụ, phải kiểm tra và cập nhật tối thiểu: Use Case, Mô hình miền, Biểu đồ lớp, ERD và Sequence/Hoạt động/Trạng thái liên quan.
