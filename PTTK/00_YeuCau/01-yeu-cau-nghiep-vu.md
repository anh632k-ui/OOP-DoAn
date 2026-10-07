# 01. Yêu cầu nghiệp vụ - MED-06

## 1. Mục tiêu hệ thống
Xây dựng cổng quản lý sự kiện văn hóa và vé miễn phí cho phép đơn vị tổ chức công bố sự kiện, quản lý các suất, tiếp nhận đăng ký, phân bổ vé công bằng, vận hành danh sách chờ và check-in bằng vé điện tử. Hệ thống có chống bot cơ bản và thể hiện rõ thông tin hỗ trợ tiếp cận để người tham dự lựa chọn sự kiện phù hợp.

## 2. Phạm vi

### 2.1. Trong phạm vi
- Đăng ký, đăng nhập và phân quyền người dùng.
- Xem, tìm kiếm và lọc sự kiện.
- Xem lịch các suất của từng sự kiện.
- Ban tổ chức tạo, cập nhật, công bố sự kiện và quản lý suất.
- Quản lý thời gian mở/đóng đăng ký.
- Người tham dự đăng ký một suất miễn phí.
- Hai chính sách phân bổ: `FCFS` và `LOTTERY`.
- Danh sách chờ và tự động chọn người tiếp theo khi có chỗ trống.
- Phát vé điện tử có mã QR cho đăng ký đã được xác nhận.
- Check-in một lần bằng vé hợp lệ.
- Quản lý và lọc các đặc tính hỗ trợ tiếp cận.
- Chống bot cơ bản bằng giới hạn tần suất, chống đăng ký trùng và kiểm tra trạng thái tài khoản.
- Theo dõi lịch sử phân bổ và check-in để phục vụ kiểm chứng.

### 2.2. Ngoài phạm vi MVP
- Thanh toán, vé trả phí, hoàn tiền, hóa đơn.
- Kiến trúc vi dịch vụ, Kafka, Kubernetes.
- AI/ML chống bot.
- Nhận diện khuôn mặt.
- Blockchain/NFT.
- Chợ mua bán/chuyển nhượng vé.
- Mạng xã hội, trò chuyện và hệ thống gợi ý bằng AI.

## 3. Tác nhân nghiệp vụ

| Tác nhân | Mô tả |
|---|---|
| Khách | Người chưa đăng nhập; có thể xem/tìm kiếm sự kiện, xem chi tiết, đăng ký tài khoản và đăng nhập. |
| Người tham dự | Có thể đăng ký suất, theo dõi trạng thái, hủy đăng ký và xem vé. |
| Ban tổ chức | Tạo và quản lý sự kiện, suất sự kiện, lịch đăng ký, phân bổ vé và danh sách chờ. |
| Nhân viên check-in | Xác minh mã QR/mã vé và thực hiện check-in tại sự kiện. |
| Quản trị viên | Quản lý người dùng và giám sát dữ liệu/nghiệp vụ của hệ thống. |

> `Khách` không phải vai trò lưu trong CSDL. Các vai trò tài khoản được lưu gồm: `NGUOI_THAM_DU`, `BAN_TO_CHUC`, `NHAN_VIEN`, `QUAN_TRI_VIEN`.

## 4. Yêu cầu chức năng

| ID | Yêu cầu |
|---|---|
| FR-01 | Khách có thể đăng ký tài khoản và đăng nhập. |
| FR-02 | Hệ thống phân quyền chức năng theo vai trò. |
| FR-03 | Khách và người dùng đã đăng nhập có thể xem danh sách, tìm kiếm và lọc sự kiện. |
| FR-04 | Người dùng có thể xem chi tiết sự kiện, các suất và đặc tính hỗ trợ tiếp cận. |
| FR-05 | Ban tổ chức có thể tạo, cập nhật và công bố sự kiện. |
| FR-06 | Ban tổ chức có thể tạo, cập nhật, mở/đóng đăng ký hoặc hủy suất sự kiện. |
| FR-07 | Ban tổ chức có thể chọn `FCFS` hoặc `LOTTERY` cho từng suất. |
| FR-08 | Người tham dự có thể gửi đăng ký cho một suất khi cửa sổ đăng ký đang mở. |
| FR-09 | Hệ thống phải ngăn một người tham dự tạo nhiều đăng ký cho cùng một suất. |
| FR-10 | Với `FCFS`, nếu còn chỗ thì xác nhận ngay; nếu đầy thì đưa vào danh sách chờ. |
| FR-11 | Với `LOTTERY`, đăng ký hợp lệ ở trạng thái `CHỜ_XỬ_LÝ` đến khi đóng đăng ký và chạy phân bổ. |
| FR-12 | Hệ thống phân bổ số người trúng không vượt quá sức chứa; phần còn lại vào danh sách chờ theo thứ tự bốc thăm. |
| FR-13 | Mỗi đăng ký đã xác nhận phải được phát đúng một vé. |
| FR-14 | Người tham dự có thể xem đăng ký, vị trí danh sách chờ và vé của mình. |
| FR-15 | Người tham dự có thể hủy đăng ký trước khi suất bắt đầu nếu vé chưa được sử dụng. |
| FR-16 | Khi một đăng ký đã xác nhận bị hủy và danh sách chờ còn người, hệ thống chọn người đầu danh sách chờ và phát vé mới. |
| FR-17 | Nhân viên check-in có thể quét QR hoặc nhập mã vé để xác minh và check-in. |
| FR-18 | Một vé chỉ được check-in thành công một lần. |
| FR-19 | Ban tổ chức có thể khai báo đặc tính hỗ trợ tiếp cận cho sự kiện. |
| FR-20 | Người dùng có thể lọc sự kiện theo đặc tính hỗ trợ tiếp cận. |
| FR-21 | Hệ thống áp dụng chống bot cơ bản cho thao tác đăng ký. |
| FR-22 | Ban tổ chức có thể xem số đăng ký, số vé đã cấp, danh sách chờ và số lượt check-in theo suất. |
| FR-23 | Quản trị viên có thể khóa/mở khóa tài khoản và giám sát sự kiện khi cần. |
| FR-24 | Hệ thống lưu thông tin lần phân bổ để phục vụ kiểm chứng kết quả. |

## 5. Quy tắc nghiệp vụ

| ID | Quy tắc |
|---|---|
| BR-01 | Sự kiện ở trạng thái `NHÁP` có thể chưa có suất. Muốn chuyển sang `ĐÃ_CÔNG_BỐ`, sự kiện phải có ít nhất một suất hợp lệ. Vé và đăng ký luôn gắn với suất, không gắn trực tiếp với sự kiện. |
| BR-02 | Sức chứa của suất phải lớn hơn 0 và không vượt quá sức chứa địa điểm trong phạm vi MVP. |
| BR-03 | Người tham dự chỉ được đăng ký khi `mo_dang_ky_luc <= thời điểm hiện tại < dong_dang_ky_luc` và suất đang ở trạng thái cho phép đăng ký. |
| BR-04 | Mỗi cặp `(ma_nguoi_tham_du, ma_suat)` chỉ có một đăng ký trong toàn bộ vòng đời MVP. |
| BR-05 | Với `FCFS`, thứ tự ưu tiên dựa trên thời điểm yêu cầu đăng ký được hệ thống chấp nhận; nếu bằng nhau thì dùng định danh/thứ tự hệ thống làm tiêu chí phụ. |
| BR-06 | Với `FCFS`, nếu số đăng ký `ĐÃ_XÁC_NHẬN` nhỏ hơn sức chứa thì đăng ký mới được xác nhận; nếu không thì chuyển sang `DANH_SÁCH_CHỜ`. |
| BR-07 | Với `LOTTERY`, đăng ký hợp lệ ban đầu ở `CHỜ_XỬ_LÝ`; sau khi đóng đăng ký mới được đưa vào lần phân bổ. |
| BR-08 | Với `LOTTERY`, hệ thống tạo thứ tự ngẫu nhiên công bằng từ tập đăng ký hợp lệ; tối đa số chỗ còn lại được xác nhận, phần còn lại vào danh sách chờ theo đúng thứ tự bốc thăm. |
| BR-09 | Mỗi đăng ký `ĐÃ_XÁC_NHẬN` có tối đa một vé; không phát vé cho đăng ký chưa xác nhận. |
| BR-10 | Khi hủy đăng ký `ĐÃ_XÁC_NHẬN`, vé `HỢP_LỆ` tương ứng phải bị hủy. Nếu danh sách chờ còn người thì chọn người đầu tiên và phát vé mới. |
| BR-11 | Đăng ký có vé `ĐÃ_SỬ_DỤNG` không được hủy theo luồng thông thường. |
| BR-12 | Vé chỉ được check-in nếu thuộc đúng suất, ở trạng thái `HỢP_LỆ` và chưa có lượt check-in thành công trước đó. |
| BR-13 | Check-in thành công làm vé chuyển sang `ĐÃ_SỬ_DỤNG` và tạo đúng một lượt check-in. |
| BR-14 | Chống bot tối thiểu gồm: tài khoản đã xác thực, giới hạn tần suất, ràng buộc đăng ký duy nhất và kiểm tra trạng thái tài khoản. |
| BR-15 | Đặc tính hỗ trợ tiếp cận chỉ dùng để mô tả/lọc trong MVP, không tự động tạo suất ưu tiên hoặc thay đổi thuật toán phân bổ. |
| BR-16 | Lần phân bổ lưu tối thiểu: suất, người thực hiện, chính sách, thời điểm chạy, số ứng viên, số người được xác nhận và dữ liệu kiểm chứng. Trong MVP, mỗi suất `LOTTERY` chỉ có một lần phân bổ đã ghi nhận. |
| BR-17 | Ban tổ chức chỉ được quản lý sự kiện do mình sở hữu; quản trị viên có quyền quản trị toàn hệ thống. |
| BR-18 | Không được cấp vượt sức chứa; việc xác nhận đăng ký, phát vé và chọn người trong danh sách chờ phải dùng giao dịch/khóa dữ liệu phù hợp khi có yêu cầu đồng thời. |
| BR-19 | Khi suất bị hủy, các đăng ký chưa kết thúc chuyển `ĐÃ_HỦY` và các vé `HỢP_LỆ` tương ứng cũng phải bị hủy. Hủy sự kiện phải dẫn tới hủy các suất chưa hoàn tất. |
| BR-20 | `thu_tu` trong danh sách chờ là khóa thứ tự ưu tiên ổn định; thứ hạng hiển thị có thể tính lại từ các mục đang chờ. |

## 6. Trạng thái nghiệp vụ dự kiến

### 6.1. Sự kiện
`NHÁP -> ĐÃ_CÔNG_BỐ -> HOÀN_THÀNH`

Nhánh hủy: `NHÁP/ĐÃ_CÔNG_BỐ -> ĐÃ_HỦY`.

### 6.2. Suất sự kiện
`NHÁP -> ĐANG_MỞ_ĐĂNG_KÝ -> ĐÃ_ĐÓNG_ĐĂNG_KÝ -> ĐANG_DIỄN_RA -> HOÀN_THÀNH`

Có thể chuyển sang `ĐÃ_HỦY` trước khi hoàn tất.

### 6.3. Đăng ký
- FCFS còn chỗ: `CHỜ_XỬ_LÝ -> ĐÃ_XÁC_NHẬN`.
- FCFS hết chỗ: `CHỜ_XỬ_LÝ -> DANH_SÁCH_CHỜ -> ĐÃ_XÁC_NHẬN` khi được chọn lên.
- LOTTERY: `CHỜ_XỬ_LÝ -> ĐÃ_XÁC_NHẬN` hoặc `CHỜ_XỬ_LÝ -> DANH_SÁCH_CHỜ` sau lần phân bổ.
- `CHỜ_XỬ_LÝ/DANH_SÁCH_CHỜ/ĐÃ_XÁC_NHẬN -> ĐÃ_HỦY` khi đủ điều kiện hủy hoặc suất bị hủy.

### 6.4. Vé
`HỢP_LỆ -> ĐÃ_SỬ_DỤNG`

Nhánh khác: `HỢP_LỆ -> ĐÃ_HỦY` hoặc `HỢP_LỆ -> HẾT_HẠN`.

## 7. Yêu cầu phi chức năng

| ID | Yêu cầu |
|---|---|
| NFR-01 | Phía máy chủ theo kiến trúc khối nguyên khối mô-đun, phân trách nhiệm rõ và ưu tiên SOLID. |
| NFR-02 | API dùng xác thực và phân quyền theo vai trò; mật khẩu phải được băm, không lưu dạng rõ. |
| NFR-03 | Các thao tác phân bổ, xác nhận vé, hủy và chọn người trong danh sách chờ phải đảm bảo nhất quán giao dịch. |
| NFR-04 | Hệ thống không được cấp vượt sức chứa dù có nhiều yêu cầu đăng ký đồng thời. |
| NFR-05 | Các thao tác phổ biến của MVP hướng tới thời gian phản hồi dưới khoảng 2 giây trong điều kiện tải đồ án thông thường, ngoại trừ phân bổ theo lô lớn. |
| NFR-06 | Giao diện phải thích ứng kích thước màn hình, hỗ trợ điều hướng bàn phím, nhãn cho điều khiển quan trọng và độ tương phản phù hợp; hướng tới các tiêu chí WCAG 2.1 AA khả thi. |
| NFR-07 | Dữ liệu phân bổ và check-in phải có khả năng kiểm chứng. |
| NFR-08 | Có kiểm thử đơn vị cho miền/dịch vụ trọng yếu và kiểm thử tích hợp/E2E cho đăng ký, phân bổ, danh sách chờ và check-in. |
| NFR-09 | Hệ thống có thể chạy bằng Docker cho môi trường kiểm thử/triển khai. |
| NFR-10 | Ảnh sự kiện lưu ở kho lưu trữ đối tượng; PostgreSQL chỉ lưu đường dẫn/siêu dữ liệu. |
| NFR-11 | Tìm kiếm MVP ưu tiên PostgreSQL Full Text Search; chưa bắt buộc Elasticsearch. |

## 8. Các bất biến cần bảo vệ khi code
1. Số đăng ký `ĐÃ_XÁC_NHẬN` không vượt sức chứa của suất.
2. Một người tham dự không có hai đăng ký cho cùng một suất.
3. Một đăng ký chỉ có tối đa một vé.
4. Một vé chỉ có tối đa một lượt check-in thành công.
5. Vé `ĐÃ_SỬ_DỤNG` không quay lại `HỢP_LỆ` theo luồng thông thường.
6. Chọn người trong danh sách chờ không được làm số đăng ký xác nhận vượt sức chứa.
7. Chỉ công bố sự kiện khi có ít nhất một suất hợp lệ.
8. Một suất LOTTERY chỉ có một lần phân bổ đã ghi nhận trong MVP.
9. Thay đổi trạng thái phải đi qua lớp dịch vụ nghiệp vụ, không cập nhật tùy tiện từ bộ điều khiển.

## 9. Mốc chuẩn hiện tại
Tài liệu này là nguồn chuẩn cho các sơ đồ trên nhánh TV. Nếu thay đổi một quy tắc nghiệp vụ phải cập nhật đồng bộ ca sử dụng, mô hình miền, biểu đồ lớp, ERD và các biểu đồ động liên quan.
