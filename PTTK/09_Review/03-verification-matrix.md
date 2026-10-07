# Kiểm chứng / Thiết kế kiểm thử mốc chuẩn - MED-06

Mục tiêu của tài liệu này là biến các business invariant trong PTTK thành test có thể hiện thực sau khi code. Đây là mốc chuẩn kiểm chứng, chưa phải test code.

## 1. Kiểm thử đơn vị trọng yếu
| ID | Đối tượng | Tình huống | Kỳ vọng |
|---|---|---|---|
| UT-01 | Sự kiện | công bố khi chưa có session hợp lệ | từ chối |
| UT-02 | Sự kiện | công bố khi có >=1 session hợp lệ | `ĐÃ_CÔNG_BỐ` |
| UT-03 | Suất sự kiện | kiểm tra registration window đúng thời gian | `true` |
| UT-04 | Chiến lược FCFS | đã xác nhậnCount < sức chứa | registration mới nằm trong đã xác nhận plan |
| UT-05 | Chiến lược FCFS | đã xác nhậnCount >= sức chứa | registration mới nằm trong danh sách chờed plan |
| UT-06 | Chiến lược bốc thăm | N ứng viên, K slot | đúng `min(N,K)` đã xác nhận, còn lại danh sách chờed; không trùng ID |
| UT-07 | Vé | `HỢP_LỆ -> ĐÃ_SỬ_DỤNG` | hợp lệ |
| UT-08 | Vé | `ĐÃ_SỬ_DỤNG -> HỢP_LỆ` | bị từ chối |
| UT-09 | Đăng ký | DANH_SÁCH_CHỜ được chọn lên | `ĐÃ_XÁC_NHẬN` |

## 2. Kiểm thử tích hợp nghiệp vụ
| ID | Luồng | Dữ liệu | Kỳ vọng |
|---|---|---|---|
| IT-01 | UC05 FCFS còn chỗ | sức chứa=2, đã xác nhận=1 | Đăng ký ĐÃ_XÁC_NHẬN + đúng 1 Vé |
| IT-02 | UC05 FCFS hết chỗ | sức chứa=1, đã xác nhận=1 | Đăng ký DANH_SÁCH_CHỜ + Mục danh sách chờ, không Vé |
| IT-03 | Duplicate registration | cùng attendee + session gọi lần 2 | `409`, chỉ 1 Đăng ký trong DB |
| IT-04 | UC05 LOTTERY | chính sách=LOTTERY, window open | Đăng ký CHỜ_XỬ_LÝ, không Vé |
| IT-05 | UC12 Lottery | 150 ứng viên, sức chứa=100 | 100 ĐÃ_XÁC_NHẬN, 50 DANH_SÁCH_CHỜ, 100 Vé, 1 Lần phân bổ |
| IT-06 | Lottery rerun | đã có Lần phân bổ | `409`, không thay đổi kết quả cũ |
| IT-07 | UC06 hủy đã xác nhận | danh sách chờ có người | ticket cũ ĐÃ_HỦY, người đầu danh sách chờ ĐÃ_XÁC_NHẬN + ticket mới |
| IT-08 | Cancel danh sách chờed | user đang DANH_SÁCH_CHỜ | Đăng ký/entry ĐÃ_HỦY, không chọn lên người khác |
| IT-09 | UC14 check-in | Vé HỢP_LỆ đúng session | 1 Lượt check-in + Vé ĐÃ_SỬ_DỤNG |
| IT-10 | Check-in lần 2 | Vé ĐÃ_SỬ_DỤNG | bị từ chối, vẫn chỉ 1 Lượt check-in |
| IT-11 | Check-in sai session | ticket thuộc session khác | bị từ chối |
| IT-12 | Cancel Session | có CHỜ_XỬ_LÝ/DANH_SÁCH_CHỜ/ĐÃ_XÁC_NHẬN + HỢP_LỆ tickets | registrations active -> ĐÃ_HỦY, HỢP_LỆ tickets -> ĐÃ_HỦY |

## 3. Kiểm thử đồng thời bắt buộc
| ID | Tình huống | Cách kích hoạt | Invariant cần chứng minh |
|---|---|---|---|
| CT-01 | FCFS slot cuối | 2 yêu cầu đồng thời tranh 1 slot | chỉ 1 ĐÃ_XÁC_NHẬN; yêu cầu còn lại DANH_SÁCH_CHỜ |
| CT-02 | Duplicate yêu cầu cùng user | 2 yêu cầu đồng thời cùng attendee/session | chỉ 1 Đăng ký do unique constraint |
| CT-03 | Check-in đồng thời | 2 yêu cầu cùng mãVé | chỉ 1 Lượt check-in; Vé ĐÃ_SỬ_DỤNG |
| CT-04 | Hủy + đăng ký/chọn lên đồng thời | hủy đã xác nhận khi queue có người | đã xác nhận count không vượt sức chứa; không cấp 2 ticket cho cùng registration |
| CT-05 | Hai Lottery run đồng thời | 2 POST phân bổ cùng session | chỉ 1 Lần phân bổ commit do lock + unique session_id |

## 4. Chống bot / Phân quyền tests
| ID | Tình huống | Kỳ vọng |
|---|---|---|
| SEC-01 | user chưa đăng nhập gọi register | `401` |
| SEC-02 | account BỊ_KHÓA gọi register | từ chối |
| SEC-03 | vượt rate limit register | `429` |
| SEC-04 | Ban tổ chức A sửa Sự kiện của Ban tổ chức B | `403` |
| SEC-05 | Người tham dự A hủy Đăng ký của B | `403` hoặc `404` theo chính sách chống enumeration |
| SEC-06 | vai trò NGƯỜI_THAM_DỰ gọi Lottery phân bổ | `403` |
| SEC-07 | vai trò NGƯỜI_THAM_DỰ gọi check-in | `403` |

## 5. Accessibility / Tìm kiếm tests
| ID | Tình huống | Kỳ vọng |
|---|---|---|
| ACC-01 | Sự kiện có WHEELCHAIR_ACCESS | filter theo feature trả về Sự kiện |
| ACC-02 | Sự kiện không có feature yêu cầu | không nằm trong kết quả filter |
| ACC-03 | UI control chính | có label/keyboard navigation cơ bản |

## 6. Exit criteria trước demo cuối kỳ
- Toàn bộ test bảo vệ invariant phải pass.
- Không có test concurrency nào cho phép oversell hoặc double check-in.
- Luồng chính UC05, UC06, UC12, UC14 có integration/E2E test.
- Phân quyền theo quyền sở hữu/vai trò có test âm tính.
- Docker Compose khởi động được frontend, backend, PostgreSQL và object storage dev/test.
