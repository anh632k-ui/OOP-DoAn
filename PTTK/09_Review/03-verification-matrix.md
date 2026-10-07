# Ma trận kiểm chứng / Thiết kế kiểm thử - MED-06

Tài liệu chuyển các bất biến nghiệp vụ trong PTTK thành các trường hợp kiểm thử có thể hiện thực sau khi code.

## 1. Kiểm thử đơn vị trọng yếu
| ID | Đối tượng | Tình huống | Kỳ vọng |
|---|---|---|---|
| UT-01 | Sự kiện | công bố khi chưa có suất hợp lệ | từ chối |
| UT-02 | Sự kiện | công bố khi có ít nhất 1 suất hợp lệ | ĐÃ_CÔNG_BỐ |
| UT-03 | Suất sự kiện | kiểm tra cửa sổ đăng ký đúng thời gian | đúng |
| UT-04 | Chiến lược FCFS | số đã xác nhận < sức chứa | đăng ký mới nằm trong nhóm được xác nhận |
| UT-05 | Chiến lược FCFS | số đã xác nhận >= sức chứa | đăng ký mới nằm trong danh sách chờ |
| UT-06 | Chiến lược bốc thăm | N ứng viên, K chỗ | đúng min(N,K) người được xác nhận, phần còn lại vào danh sách chờ, không trùng định danh |
| UT-07 | Vé | HỢP_LỆ -> ĐÃ_SỬ_DỤNG | hợp lệ |
| UT-08 | Vé | ĐÃ_SỬ_DỤNG -> HỢP_LỆ | bị từ chối |
| UT-09 | Đăng ký | người trong danh sách chờ được chọn | ĐÃ_XÁC_NHẬN |

## 2. Kiểm thử tích hợp nghiệp vụ
| ID | Luồng | Dữ liệu | Kỳ vọng |
|---|---|---|---|
| IT-01 | UC05 FCFS còn chỗ | sức chứa=2, đã xác nhận=1 | Đăng ký ĐÃ_XÁC_NHẬN + đúng 1 Vé |
| IT-02 | UC05 FCFS hết chỗ | sức chứa=1, đã xác nhận=1 | Đăng ký DANH_SÁCH_CHỜ + mục chờ, không có Vé |
| IT-03 | Đăng ký trùng | cùng người + cùng suất gọi lần 2 | 409, CSDL chỉ có 1 đăng ký |
| IT-04 | UC05 LOTTERY | chính sách LOTTERY, cửa sổ đang mở | Đăng ký CHỜ_XỬ_LÝ, chưa có Vé |
| IT-05 | UC12 LOTTERY | 150 ứng viên, sức chứa=100 | 100 ĐÃ_XÁC_NHẬN, 50 DANH_SÁCH_CHỜ, 100 Vé, 1 Lần phân bổ |
| IT-06 | Chạy LOTTERY lần hai | đã có Lần phân bổ | 409, kết quả cũ không đổi |
| IT-07 | UC06 hủy đăng ký đã xác nhận | danh sách chờ có người | vé cũ ĐÃ_HỦY, người đầu danh sách chờ ĐÃ_XÁC_NHẬN + vé mới |
| IT-08 | Hủy người đang chờ | đăng ký ở DANH_SÁCH_CHỜ | đăng ký/mục chờ ĐÃ_HỦY, không chọn người khác |
| IT-09 | UC14 check-in | Vé HỢP_LỆ đúng suất | 1 Lượt check-in + Vé ĐÃ_SỬ_DỤNG |
| IT-10 | Check-in lần hai | Vé ĐÃ_SỬ_DỤNG | bị từ chối, vẫn chỉ 1 Lượt check-in |
| IT-11 | Check-in sai suất | vé thuộc suất khác | bị từ chối |
| IT-12 | Hủy suất | có đăng ký đang hoạt động + vé hợp lệ | đăng ký -> ĐÃ_HỦY, vé hợp lệ -> ĐÃ_HỦY |

## 3. Kiểm thử đồng thời bắt buộc
| ID | Tình huống | Cách kích hoạt | Bất biến cần chứng minh |
|---|---|---|---|
| CT-01 | Chỗ FCFS cuối cùng | 2 yêu cầu đồng thời tranh 1 chỗ | chỉ 1 ĐÃ_XÁC_NHẬN; yêu cầu còn lại vào DANH_SÁCH_CHỜ |
| CT-02 | Hai yêu cầu trùng | 2 yêu cầu đồng thời cùng người/cùng suất | chỉ 1 đăng ký do ràng buộc duy nhất |
| CT-03 | Check-in đồng thời | 2 yêu cầu cùng mã vé | chỉ 1 Lượt check-in; Vé ĐÃ_SỬ_DỤNG |
| CT-04 | Hủy và chọn người chờ đồng thời | hủy người đã xác nhận khi có danh sách chờ | số đã xác nhận không vượt sức chứa; không cấp hai vé cho cùng đăng ký |
| CT-05 | Hai lần LOTTERY đồng thời | 2 yêu cầu phân bổ cùng suất | chỉ 1 Lần phân bổ được ghi nhận |

## 4. Kiểm thử chống bot / phân quyền
| ID | Tình huống | Kỳ vọng |
|---|---|---|
| SEC-01 | Chưa đăng nhập nhưng gọi đăng ký | 401 |
| SEC-02 | Tài khoản BỊ_KHÓA gọi đăng ký | từ chối |
| SEC-03 | Vượt giới hạn tần suất | 429 |
| SEC-04 | Ban tổ chức A sửa sự kiện của B | 403 |
| SEC-05 | Người tham dự A hủy đăng ký của B | 403 hoặc 404 theo chính sách bảo mật |
| SEC-06 | Người tham dự gọi phân bổ LOTTERY | 403 |
| SEC-07 | Người tham dự gọi check-in | 403 |

## 5. Kiểm thử hỗ trợ tiếp cận / tìm kiếm
| ID | Tình huống | Kỳ vọng |
|---|---|---|
| HT-01 | Sự kiện có hỗ trợ xe lăn | lọc theo đặc tính trả về sự kiện |
| HT-02 | Sự kiện không có đặc tính được yêu cầu | không xuất hiện trong kết quả |
| HT-03 | Điều khiển chính trên giao diện | có nhãn và dùng được bằng bàn phím ở mức cơ bản |

## 6. Điều kiện hoàn tất trước demo cuối kỳ
- Toàn bộ kiểm thử bảo vệ bất biến phải đạt.
- Không có kiểm thử đồng thời nào cho phép cấp vượt sức chứa hoặc check-in hai lần.
- UC05, UC06, UC12, UC14 có kiểm thử tích hợp/E2E.
- Phân quyền theo vai trò/quyền sở hữu có kiểm thử trường hợp từ chối.
- Docker Compose khởi động được giao diện, phía máy chủ, PostgreSQL và kho lưu trữ đối tượng.
