# Rà soát tính nhất quán PTTK giữa kỳ - MED-06

## 1. Mục tiêu
Kiểm tra tính nhất quán theo chuỗi:

`Yêu cầu -> Ca sử dụng -> Mô hình miền -> Biểu đồ lớp -> ERD/CSDL -> Tuần tự/Hoạt động/Trạng thái -> Kiến trúc`

Bản rà soát này áp dụng cho nhánh **TV**, được tạo từ nhánh **dev** và Việt hóa để phục vụ báo cáo.

## 2. Các vấn đề đã phát hiện và xử lý

| # | Phát hiện | Mức độ | Cách xử lý | Trạng thái |
|---|---|---|---|---|
| 1 | Quan hệ mở rộng khi chọn người tiếp theo trong danh sách chờ từng bị đảo chiều. | Cao | Giữ đúng nghĩa: hành vi chọn người chờ là phần mở rộng của UC06 Hủy đăng ký. | Đã sửa |
| 2 | Sự kiện nháp có thể được tạo trước khi có suất nhưng mô hình cũ từng ghi bắt buộc có ít nhất một suất. | Cao | Chốt quan hệ Sự kiện 1 -> 0..* Suất; chỉ khi công bố mới bắt buộc có ít nhất một suất hợp lệ. | Đã sửa |
| 3 | Lần phân bổ thiếu người thực hiện nên chưa đủ dữ liệu kiểm chứng. | Trung bình | Bổ sung người thực hiện vào lớp, ERD và CSDL. | Đã sửa |
| 4 | Cần ngăn hai lần LOTTERY cùng ghi kết quả cho một suất. | Cao | Khóa suất trong giao dịch và đặt UNIQUE(ma_suat) cho bảng lan_phan_bo. | Đã sửa |
| 5 | Dịch vụ sự kiện từng ôm cả quản lý suất và hỗ trợ tiếp cận. | Trung bình | Tách Dịch vụ suất và Dịch vụ hỗ trợ tiếp cận. | Đã sửa |
| 6 | Luồng hủy cần kiểm tra vé trước khi quyết định hủy. | Cao | Biểu đồ tuần tự đã tải và kiểm tra dữ liệu vé trước khi xử lý. | Đã sửa |
| 7 | FCFS cần biên giao dịch rõ để tránh cấp vượt sức chứa. | Cao | Gom khóa suất, tạo đăng ký, xác nhận/danh sách chờ và phát vé trong cùng giao dịch. | Đã sửa |
| 8 | Thứ tự danh sách chờ cần ổn định khi có người hủy. | Thấp | Chốt trường thu_tu là khóa ưu tiên; thứ hạng hiển thị có thể tính lại. | Đã sửa |
| 9 | Hủy suất/sự kiện cần cập nhật dây chuyền đăng ký và vé. | Trung bình | Bổ sung quy tắc nghiệp vụ và trạng thái liên quan. | Đã sửa |
| 10 | Thiếu biểu đồ trạng thái cho sự kiện. | Trung bình | Đã bổ sung biểu đồ trạng thái Sự kiện. | Đã sửa |
| 11 | Thiếu biểu đồ tuần tự cho bước tạo sự kiện. | Thấp | Đã bổ sung UC09. | Đã sửa |

## 3. Truy vết nghiệp vụ lõi

| Yêu cầu / Quy tắc | Ca sử dụng | Lớp chính | Bảng chính | Sơ đồ động |
|---|---|---|---|---|
| FR-05, FR-06, BR-01, BR-17 | UC09, UC10, UC11 | Sự kiện, Suất sự kiện, Dịch vụ sự kiện, Dịch vụ suất | su_kien, suat_su_kien | Tuần tự UC09, Trạng thái Sự kiện/Suất |
| FR-08..FR-11, BR-03..BR-07, BR-14, BR-18 | UC05 | Đăng ký, Dịch vụ đăng ký, Dịch vụ chống bot, Dịch vụ phân bổ, Chiến lược FCFS | dang_ky, suat_su_kien, ve, danh_sach_cho | Tuần tự UC05, Hoạt động UC05, Trạng thái Đăng ký |
| FR-12, FR-24, BR-08, BR-16, BR-18 | UC12 | Dịch vụ phân bổ, Chiến lược bốc thăm, Lần phân bổ, Kế hoạch phân bổ | lan_phan_bo, dang_ky, ve, danh_sach_cho | Tuần tự UC12, Hoạt động UC12 |
| FR-15, FR-16, BR-10, BR-18, BR-20 | UC06 | Dịch vụ đăng ký, Dịch vụ danh sách chờ, Dịch vụ vé | dang_ky, danh_sach_cho, ve | Tuần tự UC06, Hoạt động UC06, Trạng thái Đăng ký/Vé |
| FR-17, FR-18, BR-11..BR-13 | UC14 | Dịch vụ check-in, Vé, Lượt check-in | ve, check_in | Tuần tự UC14, Trạng thái Vé |
| FR-19, FR-20, BR-15 | UC10, UC03/04 | Đặc tính hỗ trợ tiếp cận, Dịch vụ hỗ trợ tiếp cận | dac_tinh_tiep_can, su_kien_tiep_can | Tuần tự UC09, Biểu đồ thành phần |

## 4. Lực lượng quan hệ đã khóa

| Quan hệ | Lực lượng |
|---|---|
| Người dùng -> Sự kiện | 1 -> 0..* |
| Địa điểm -> Sự kiện | 1 -> 0..* |
| Sự kiện -> Suất sự kiện | 1 -> 0..* |
| Người dùng -> Đăng ký | 1 -> 0..* |
| Suất sự kiện -> Đăng ký | 1 -> 0..* |
| Đăng ký -> Mục danh sách chờ | 1 -> 0..1 |
| Đăng ký -> Vé | 1 -> 0..1 |
| Vé -> Lượt check-in | 1 -> 0..1 |
| Sự kiện <-> Đặc tính hỗ trợ tiếp cận | 0..* <-> 0..* |
| Suất sự kiện -> Lần phân bổ | 1 -> 0..1 |
| Người dùng -> Lần phân bổ | 1 -> 0..* |

## 5. Bất biến phải giữ nguyên khi code
1. Số đăng ký ĐÃ_XÁC_NHẬN không vượt sức chứa của suất.
2. UNIQUE(dang_ky.ma_nguoi_tham_du, dang_ky.ma_suat).
3. UNIQUE(ve.ma_dang_ky).
4. UNIQUE(check_in.ma_ve).
5. UNIQUE(lan_phan_bo.ma_suat) trong MVP LOTTERY.
6. Chỉ công bố sự kiện khi có ít nhất một suất hợp lệ.
7. Chỉ phát vé khi đăng ký đã ĐÃ_XÁC_NHẬN.
8. Vé ĐÃ_SỬ_DỤNG không quay lại HỢP_LỆ theo luồng thông thường.
9. Hủy đăng ký đã xác nhận + chọn người chờ là một giao dịch.
10. LOTTERY là một giao dịch và chỉ một lần phân bổ được ghi nhận.
11. FCFS phải khóa/tuần tự hóa phần kiểm tra sức chứa để tránh cấp vượt chỗ.

## 6. Kết luận
Logic PTTK đã nhất quán ở mức giữa kỳ. Sau khi khóa bản này, nếu đổi một quy tắc nghiệp vụ phải cập nhật đồng bộ yêu cầu, ca sử dụng, mô hình miền, biểu đồ lớp, ERD/CSDL và các sơ đồ động liên quan.

### Cổng kiểm tra cuối trước khi đưa sang main
- Xem toàn bộ file PlantUML trong VS Code để kiểm tra lỗi kết xuất và bố cục.
- Kiểm tra chữ không chồng nhau và hình không quá rộng khi đưa vào báo cáo.
- Chạy thử lược đồ PostgreSQL của nhánh TV.
- Chỉ tạo yêu cầu hợp nhất sau khi các bước trên đạt.
