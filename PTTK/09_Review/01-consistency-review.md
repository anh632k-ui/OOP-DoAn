# Rà soát nhất quán PTTK giữa kỳ - MED-06

## 1. Mục tiêu review
Kiểm tra tính nhất quán theo chuỗi:

`Yêu cầu -> Ca sử dụng -> Mô hình miền -> Biểu đồ lớp -> ERD -> Tuần tự/Hoạt động/Trạng thái -> Architecture`

Mốc chuẩn review này áp dụng cho nhánh `dev` trước khi mở Pull Yêu cầu sang `main`.

## 2. Kết quả review

| # | Phát hiện | Mức độ | Cách xử lý | Trạng thái |
|---|---|---|---|---|
| 1 | Quan hệ `<<extend>>` của chọn lên danh sách chờ trong Ca sử dụng Diagram bị đảo chiều. | Cao | Đổi thành `Promote danh sách chờ -> UC06 Hủy đăng ký` với `<<extend>>`. | Đã sửa |
| 2 | Yêu cầu/Domain/Class dùng `Sự kiện 1..* Suất sự kiện`, nhưng UC09 cho phép tạo Sự kiện DRAFT trước khi thêm suất và DB không thể ép Sự kiện phải có session ngay khi insert. | Cao | Đổi cardinality thành `Sự kiện 1 -> 0..* Suất sự kiện`; thêm invariant chỉ được công bố khi có ít nhất 1 Suất sự kiện hợp lệ. | Đã sửa |
| 3 | `Lần phân bổ` thiếu người kích hoạt nên kiểm chứng chưa đủ. | Trung bình | Thêm `executedByNgười dùngId` / `executed_by_user_id` và quan hệ Người dùng -> Lần phân bổ. | Đã sửa |
| 4 | UC12 dùng khái niệm `completed Lần phân bổ` nhưng model không có trạng thái run. | Cao | MVP coi Lần phân bổ chỉ tồn tại sau commit; dùng `UNIQUE(session_id)` và tối đa 1 Lottery Lần phân bổ / Session. | Đã sửa |
| 5 | Biểu đồ lớp đặt `addSession` và hỗ trợ tiếp cận vào Dịch vụ sự kiện trong khi Biểu đồ thành phần đã tách Sessions/Accessibility Module. | Trung bình | Tách `Dịch vụ suất` và `Dịch vụ hỗ trợ tiếp cận`, giữ Dịch vụ sự kiện tập trung lifecycle Sự kiện. | Đã sửa |
| 6 | Tuần tự UC06 kiểm tra Vé `USED` nhưng chưa hề tải Vé. | Cao | Thêm `Dịch vụ vé.findByĐăng kýId()` trước khi quyết định cho phép hủy. | Đã sửa |
| 7 | Giao dịch boundary FCFS trong UC05 chưa rõ, có nguy cơ để lại Đăng ký PENDING khi allocate lỗi. | Cao | Gom create Đăng ký + lock Session + phân bổ + ticket/danh sách chờ vào một giao dịch cho FCFS. | Đã sửa |
| 8 | Danh sách chờ dùng `position` nhưng chưa nói rõ có cần renumber khi hủy/chọn lên. | Thấp | Chốt `position` là khóa thứ tự ưu tiên; thứ hạng ACTIVE hiển thị được tính động. | Đã sửa |
| 9 | Vé Trạng thái có nhánh hủy do Suất sự kiện nhưng Yêu cầu chưa mô tả cascade. | Trung bình | Thêm BR-19: hủy Session hủy Đăng ký hoạt động và Vé VALID; hủy Sự kiện cascade xuống Session chưa hoàn tất. | Đã sửa |
| 10 | Thiếu Trạng thái Diagram cho Sự kiện dù requirement đã định nghĩa Sự kiện lifecycle. | Trung bình | Bổ sung `07_Trạng thái/04-event-state.puml`. | Đã sửa |
| 11 | Bộ Tuần tự mới có 4 luồng lõi, thiếu luồng setup Sự kiện để giải thích UC09. | Thấp | Bổ sung `05_Tuần tự/05-uc09-create-event.puml`. | Đã sửa |

## 3. Truy vết các nghiệp vụ lõi

| Yêu cầu / Rule | Ca sử dụng | Domain/Class chính | Bảng chính | Dynamic diagram |
|---|---|---|---|---|
| FR-05, FR-06, BR-01, BR-17 | UC09, UC10, UC11 | Sự kiện, Suất sự kiện, Dịch vụ sự kiện, Dịch vụ suất | events, event_sessions | Tuần tự UC09, Trạng thái Sự kiện, Trạng thái Suất sự kiện |
| FR-08..FR-11, BR-03..BR-07, BR-14, BR-18 | UC05 | Đăng ký, Dịch vụ đăng ký, Dịch vụ chống bot, Dịch vụ phân bổ, Chiến lược FCFS | registrations, event_sessions, tickets, danh sách chờ_entries | Tuần tự UC05, Hoạt động Đăng ký, Trạng thái Đăng ký |
| FR-12, FR-24, BR-08, BR-16, BR-18 | UC12 | Dịch vụ phân bổ, Chiến lược bốc thăm, Lần phân bổ, Kế hoạch phân bổ | phân bổ_runs, registrations, tickets, danh sách chờ_entries | Tuần tự UC12, Hoạt động Lottery, Trạng thái Đăng ký |
| FR-15, FR-16, BR-10, BR-18, BR-20 | UC06 | Dịch vụ đăng ký, Dịch vụ danh sách chờ, Dịch vụ vé | registrations, danh sách chờ_entries, tickets | Tuần tự UC06, Hoạt động Cancel/Promote, Trạng thái Đăng ký/Vé |
| FR-17, FR-18, BR-11..BR-13 | UC14 | Dịch vụ check-in, Dịch vụ vé, Vé, Lượt check-in | tickets, check_ins | Tuần tự UC14, Trạng thái Vé |
| FR-19, FR-20, BR-15 | UC10, UC03/04 | Đặc tính hỗ trợ tiếp cận, Dịch vụ hỗ trợ tiếp cận | hỗ trợ tiếp cận_features, event_hỗ trợ tiếp cận | Tuần tự UC09 (setup), Biểu đồ thành phần |
| BR-19 | UC10/UC11 | Dịch vụ sự kiện, Dịch vụ suất, Dịch vụ đăng ký, Dịch vụ vé | events, event_sessions, registrations, tickets | Trạng thái Sự kiện, Suất sự kiện, Đăng ký, Vé |

## 4. Cardinality mốc chuẩn đã khóa

| Quan hệ | Cardinality |
|---|---|
| Người dùng -> Sự kiện | `1 -> 0..*` |
| Địa điểm -> Sự kiện | `1 -> 0..*` |
| Sự kiện -> Suất sự kiện | `1 -> 0..*` (DRAFT có thể chưa có suất; công bố cần >=1) |
| Người dùng -> Đăng ký | `1 -> 0..*` |
| Suất sự kiện -> Đăng ký | `1 -> 0..*` |
| Đăng ký -> Mục danh sách chờ | `1 -> 0..1` |
| Đăng ký -> Vé | `1 -> 0..1` |
| Vé -> Lượt check-in | `1 -> 0..1` |
| Sự kiện <-> Đặc tính hỗ trợ tiếp cận | `0..* <-> 0..*` |
| Suất sự kiện -> Lần phân bổ | `1 -> 0..1` trong MVP |
| Người dùng -> Lần phân bổ | `1 -> 0..*` |

## 5. Invariant phải giữ nguyên khi code
1. `đã xác nhận registrations <= session.sức chứa`.
2. `UNIQUE(attendee_id, session_id)`.
3. `UNIQUE(tickets.registration_id)`.
4. `UNIQUE(check_ins.ticket_id)`.
5. `UNIQUE(phân bổ_runs.session_id)` cho Lottery MVP.
6. Sự kiện chỉ công bố khi có ít nhất một Suất sự kiện hợp lệ.
7. Vé chỉ phát khi Đăng ký đã `CONFIRMED`.
8. Vé `USED` không quay lại `VALID` theo luồng thường.
9. Hủy Đăng ký CONFIRMED + chọn lên danh sách chờ là một giao dịch.
10. Lottery phân bổ là một giao dịch và chỉ một run được commit.
11. FCFS phải khóa/serialize phần kiểm tra sức chứa để không oversell.

## 6. Kết luận review
Về **logic PTTK**, mốc chuẩn giữa kỳ đã nhất quán sau vòng review này. Từ thời điểm này không nên tự ý đổi entity, tên trạng thái, cardinality hoặc quy tắc nghiệp vụ trong lúc code. Nếu có thay đổi, phải cập nhật lại các tài liệu phụ thuộc theo traceability ở trên.

### Gate cuối trước khi merge `dev -> main`
- Preview toàn bộ `.puml` bằng PlantUML trong VS Code để kiểm tra lỗi render/layout.
- Kiểm tra chữ không bị chồng/diagram quá rộng khi đưa vào báo cáo.
- Sau khi preview đạt, tạo PR `dev -> main` và chỉ merge mốc chuẩn giữa kỳ đã kiểm tra.
