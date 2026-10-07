# 02. Đặc tả ca sử dụng lõi - MED-06

Tài liệu đặc tả các ca sử dụng ảnh hưởng trực tiếp đến mô hình miền, biểu đồ lớp và biểu đồ tuần tự. Các thao tác thêm/sửa/xóa đơn giản có thể bổ sung khi hiện thực mà không thay đổi lõi nghiệp vụ.

---

## UC05 - Đăng ký một suất

### Mục tiêu
Người tham dự gửi yêu cầu tham dự một suất sự kiện miễn phí.

### Tác nhân chính
Người tham dự.

### Tiền điều kiện
- Người tham dự đã đăng nhập và tài khoản đang hoạt động.
- Sự kiện và suất tồn tại, đang cho phép đăng ký.
- Thời điểm hiện tại nằm trong cửa sổ đăng ký.
- Người tham dự chưa có đăng ký cho suất đó.

### Luồng chính - FCFS còn chỗ
1. Người tham dự chọn một suất và yêu cầu đăng ký.
2. Hệ thống xác thực người dùng và quyền truy cập.
3. Hệ thống kiểm tra giới hạn tần suất và các quy tắc chống bot.
4. Hệ thống kiểm tra cửa sổ đăng ký và đăng ký trùng.
5. Trong một giao dịch có khóa suất, hệ thống tạo đăng ký ở trạng thái `CHỜ_XỬ_LÝ`.
6. Hệ thống kiểm tra số chỗ còn lại.
7. Đăng ký chuyển sang `ĐÃ_XÁC_NHẬN`.
8. Hệ thống tạo một vé `HỢP_LỆ`.
9. Giao dịch được ghi nhận và hệ thống trả kết quả thành công.

### Luồng thay thế A - FCFS hết chỗ
Tại bước 6, nếu suất đã đủ sức chứa:
1. Đăng ký chuyển sang `DANH_SÁCH_CHỜ`.
2. Hệ thống tạo một mục danh sách chờ ở thứ tự tiếp theo.
3. Không phát vé.
4. Giao dịch được ghi nhận và trả thứ tự chờ cho người tham dự.

### Luồng thay thế B - LOTTERY
Sau khi kiểm tra hợp lệ:
1. Hệ thống tạo đăng ký `CHỜ_XỬ_LÝ`.
2. Không phát vé ngay.
3. Sau khi cửa sổ đăng ký đóng, UC12 thực hiện lần phân bổ.

### Ngoại lệ
- Ngoài thời gian đăng ký: từ chối.
- Đã có đăng ký cho cùng suất: từ chối tạo bản ghi thứ hai.
- Tài khoản bị khóa hoặc vượt giới hạn tần suất: từ chối.
- Suất bị hủy hoặc không còn nhận đăng ký: từ chối.
- Hai yêu cầu đồng thời vi phạm ràng buộc duy nhất: hoàn tác và trả lỗi đăng ký trùng.

### Hậu điều kiện
- FCFS: đăng ký là `ĐÃ_XÁC_NHẬN` hoặc `DANH_SÁCH_CHỜ`.
- LOTTERY: đăng ký là `CHỜ_XỬ_LÝ` cho đến lần phân bổ.
- Số người được xác nhận không vượt sức chứa.

---

## UC06 - Hủy đăng ký

### Mục tiêu
Người tham dự hủy đăng ký của mình trước khi suất bắt đầu và trước khi vé được sử dụng.

### Tác nhân chính
Người tham dự.

### Tiền điều kiện
- Đăng ký thuộc người tham dự hiện tại.
- Đăng ký chưa `ĐÃ_HỦY`.
- Suất chưa bắt đầu.
- Vé, nếu có, chưa `ĐÃ_SỬ_DỤNG`.

### Luồng chính - hủy đăng ký đã xác nhận
1. Người tham dự yêu cầu hủy đăng ký.
2. Hệ thống kiểm tra quyền sở hữu, trạng thái suất và vé hiện tại.
3. Hệ thống khóa suất trong một giao dịch.
4. Đăng ký chuyển `ĐÃ_HỦY`.
5. Vé `HỢP_LỆ` tương ứng chuyển `ĐÃ_HỦY`.
6. Hệ thống kiểm tra danh sách chờ theo `thu_tu` tăng dần.
7. Nếu còn người chờ, lấy mục `ĐANG_CHỜ` đầu tiên.
8. Đăng ký của người đó chuyển `ĐÃ_XÁC_NHẬN`.
9. Mục danh sách chờ chuyển `ĐÃ_ĐƯỢC_CHỌN`.
10. Hệ thống phát vé `HỢP_LỆ` mới cho người được chọn và ghi nhận giao dịch.

### Luồng thay thế
- Đăng ký `CHỜ_XỬ_LÝ`: chuyển thẳng `ĐÃ_HỦY`, không chọn người chờ vì chưa chiếm chỗ.
- Đăng ký `DANH_SÁCH_CHỜ`: chuyển `ĐÃ_HỦY`, mục chờ chuyển `ĐÃ_HỦY`, không ảnh hưởng sức chứa.
- Không còn người trong danh sách chờ: kết thúc sau khi giải phóng chỗ.

### Hậu điều kiện
Không còn vé hợp lệ cho đăng ký đã hủy; nếu có người chờ và có chỗ trống thì hệ thống tự lấp chỗ nhưng không vượt sức chứa.

---

## UC09 - Tạo/cập nhật sự kiện

### Mục tiêu
Ban tổ chức tạo sự kiện và chuẩn bị dữ liệu trước khi công bố.

### Tác nhân chính
Ban tổ chức.

### Tiền điều kiện
Ban tổ chức đã đăng nhập và có vai trò phù hợp.

### Luồng chính
1. Ban tổ chức nhập tên, mô tả, địa điểm, thời gian tổng quan, ảnh và thông tin liên quan.
2. Hệ thống kiểm tra dữ liệu.
3. Hệ thống tạo sự kiện ở trạng thái `NHÁP` và gán quyền sở hữu cho ban tổ chức.
4. Sự kiện nháp có thể tạm thời chưa có suất.
5. Ban tổ chức bổ sung các suất và đặc tính hỗ trợ tiếp cận.
6. Khi có ít nhất một suất hợp lệ và đủ dữ liệu, ban tổ chức có thể dùng UC11 để công bố/mở đăng ký.

### Quy tắc
- Ban tổ chức chỉ sửa sự kiện do mình sở hữu.
- Sự kiện chưa có ít nhất một suất hợp lệ không được công bố.
- CSDL chỉ lưu đường dẫn/siêu dữ liệu ảnh; tệp ảnh nằm trong kho lưu trữ đối tượng.

---

## UC12 - Thực hiện phân bổ vé

### Mục tiêu
Phân bổ vé theo `LOTTERY`, đảm bảo công bằng, không vượt sức chứa và có dữ liệu kiểm chứng.

### Tác nhân chính
Ban tổ chức.

### Tiền điều kiện
- Ban tổ chức sở hữu sự kiện chứa suất cần phân bổ.
- Suất có chính sách `LOTTERY`.
- Cửa sổ đăng ký đã đóng.
- Chưa tồn tại lần phân bổ đã ghi nhận cho suất này.

### Luồng chính - LOTTERY
1. Ban tổ chức yêu cầu chạy phân bổ cho suất.
2. Hệ thống khóa suất để ngăn hai lần phân bổ cạnh tranh.
3. Hệ thống kiểm tra chưa có lần phân bổ cho suất.
4. Hệ thống lấy các đăng ký `CHỜ_XỬ_LÝ` hợp lệ.
5. Hệ thống tính số chỗ còn lại theo sức chứa và số người đã được xác nhận.
6. Chiến lược bốc thăm tạo thứ tự ngẫu nhiên công bằng cho tập ứng viên.
7. Tối đa số chỗ còn lại đầu tiên được chuyển `ĐÃ_XÁC_NHẬN`.
8. Mỗi đăng ký được xác nhận được phát đúng một vé `HỢP_LỆ`.
9. Các đăng ký còn lại chuyển `DANH_SÁCH_CHỜ` theo thứ tự bốc thăm và tạo mục danh sách chờ tương ứng.
10. Hệ thống ghi lần phân bổ gồm người thực hiện, số lượng và dữ liệu kiểm chứng.
11. Hệ thống ghi nhận toàn bộ kết quả trong một giao dịch.

### Luồng FCFS
FCFS được áp dụng trực tiếp trong UC05 tại thời điểm yêu cầu đăng ký tới hệ thống. Trong MVP không chạy phân bổ theo lô riêng cho FCFS.

### Hậu điều kiện
- Số đăng ký `ĐÃ_XÁC_NHẬN` không vượt sức chứa.
- Chỉ một lần phân bổ LOTTERY có thể được ghi nhận cho một suất.
- Kết quả có đủ dữ liệu để kiểm chứng.
- Người không trúng được xếp vào danh sách chờ theo đúng thứ tự bốc thăm.

---

## UC14 - Check-in vé

### Mục tiêu
Nhân viên check-in xác minh vé và ghi nhận một lượt check-in hợp lệ.

### Tác nhân chính
Nhân viên check-in.

### Tiền điều kiện
- Nhân viên đã đăng nhập và có quyền check-in.
- Vé tồn tại và thuộc đúng suất cần check-in.

### Luồng chính
1. Nhân viên quét QR hoặc nhập mã vé.
2. Hệ thống tìm và khóa vé cần kiểm tra.
3. Hệ thống kiểm tra vé ở trạng thái `HỢP_LỆ`.
4. Hệ thống kiểm tra chưa có lượt check-in thành công cho vé.
5. Hệ thống xác minh vé qua đăng ký thuộc đúng suất.
6. Hệ thống tạo lượt check-in.
7. Vé chuyển `ĐÃ_SỬ_DỤNG`.
8. Hệ thống ghi nhận giao dịch và trả kết quả thành công.

### Ngoại lệ
- Vé không tồn tại: từ chối.
- Vé `ĐÃ_HỦY`, `HẾT_HẠN` hoặc `ĐÃ_SỬ_DỤNG`: từ chối.
- Vé thuộc suất khác: từ chối.
- Hai yêu cầu đồng thời cho cùng vé: chỉ một yêu cầu được ghi nhận thành công.

### Hậu điều kiện
Vé đã dùng không thể check-in lần thứ hai theo luồng thông thường.

---

## Ma trận ca sử dụng và sơ đồ liên quan

| Ca sử dụng | Mô hình miền / Lớp | Tuần tự | Hoạt động | Trạng thái |
|---|---:|---:|---:|---:|
| UC05 Đăng ký suất | Bắt buộc | Bắt buộc | Bắt buộc | Đăng ký |
| UC06 Hủy + chọn người trong danh sách chờ | Bắt buộc | Bắt buộc | Bắt buộc | Đăng ký/Vé |
| UC09 Tạo sự kiện | Bắt buộc | Nên có | Có thể | Sự kiện |
| UC12 Phân bổ | Bắt buộc | Bắt buộc | Bắt buộc | Đăng ký |
| UC14 Check-in | Bắt buộc | Bắt buộc | Có thể | Vé |

## Ghi chú nhất quán
Các tên **Sự kiện, Suất sự kiện, Đăng ký, Mục danh sách chờ, Vé, Lượt check-in, Lần phân bổ, Đặc tính hỗ trợ tiếp cận** là bộ thuật ngữ chuẩn của nhánh TV và phải được dùng đồng nhất trong các sơ đồ còn lại.
