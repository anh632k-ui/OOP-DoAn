# Review consistency PTTK giữa kỳ - MED-06

## 1. Mục tiêu review
Kiểm tra tính nhất quán theo chuỗi:

`Requirement -> Use Case -> Domain Model -> Class Diagram -> ERD -> Sequence/Activity/State -> Architecture`

Baseline review này áp dụng cho nhánh `dev` trước khi mở Pull Request sang `main`.

## 2. Kết quả review

| # | Phát hiện | Mức độ | Cách xử lý | Trạng thái |
|---|---|---|---|---|
| 1 | Quan hệ `<<extend>>` của promote waitlist trong Use Case Diagram bị đảo chiều. | Cao | Đổi thành `Promote waitlist -> UC06 Hủy đăng ký` với `<<extend>>`. | Đã sửa |
| 2 | Requirement/Domain/Class dùng `Event 1..* EventSession`, nhưng UC09 cho phép tạo Event DRAFT trước khi thêm suất và DB không thể ép Event phải có session ngay khi insert. | Cao | Đổi cardinality thành `Event 1 -> 0..* EventSession`; thêm invariant chỉ được publish khi có ít nhất 1 EventSession hợp lệ. | Đã sửa |
| 3 | `AllocationRun` thiếu người kích hoạt nên audit chưa đủ. | Trung bình | Thêm `executedByUserId` / `executed_by_user_id` và quan hệ User -> AllocationRun. | Đã sửa |
| 4 | UC12 dùng khái niệm `completed AllocationRun` nhưng model không có trạng thái run. | Cao | MVP coi AllocationRun chỉ tồn tại sau commit; dùng `UNIQUE(session_id)` và tối đa 1 Lottery AllocationRun / Session. | Đã sửa |
| 5 | Class Diagram đặt `addSession` và accessibility vào EventService trong khi Component Diagram đã tách Sessions/Accessibility Module. | Trung bình | Tách `SessionService` và `AccessibilityService`, giữ EventService tập trung lifecycle Event. | Đã sửa |
| 6 | Sequence UC06 kiểm tra Ticket `USED` nhưng chưa hề tải Ticket. | Cao | Thêm `TicketService.findByRegistrationId()` trước khi quyết định cho phép hủy. | Đã sửa |
| 7 | Transaction boundary FCFS trong UC05 chưa rõ, có nguy cơ để lại Registration PENDING khi allocate lỗi. | Cao | Gom create Registration + lock Session + allocation + ticket/waitlist vào một transaction cho FCFS. | Đã sửa |
| 8 | Waitlist dùng `position` nhưng chưa nói rõ có cần renumber khi hủy/promote. | Thấp | Chốt `position` là khóa thứ tự ưu tiên; thứ hạng ACTIVE hiển thị được tính động. | Đã sửa |
| 9 | Ticket State có nhánh hủy do EventSession nhưng Requirement chưa mô tả cascade. | Trung bình | Thêm BR-19: hủy Session hủy Registration hoạt động và Ticket VALID; hủy Event cascade xuống Session chưa hoàn tất. | Đã sửa |
| 10 | Thiếu State Diagram cho Event dù requirement đã định nghĩa Event lifecycle. | Trung bình | Bổ sung `07_State/04-event-state.puml`. | Đã sửa |
| 11 | Bộ Sequence mới có 4 luồng lõi, thiếu luồng setup Event để giải thích UC09. | Thấp | Bổ sung `05_Sequence/05-uc09-create-event.puml`. | Đã sửa |

## 3. Traceability các nghiệp vụ lõi

| Requirement / Rule | Use Case | Domain/Class chính | Bảng chính | Dynamic diagram |
|---|---|---|---|---|
| FR-05, FR-06, BR-01, BR-17 | UC09, UC10, UC11 | Event, EventSession, EventService, SessionService | events, event_sessions | Sequence UC09, State Event, State EventSession |
| FR-08..FR-11, BR-03..BR-07, BR-14, BR-18 | UC05 | Registration, RegistrationService, BotProtectionService, AllocationService, FcfsAllocationStrategy | registrations, event_sessions, tickets, waitlist_entries | Sequence UC05, Activity Registration, State Registration |
| FR-12, FR-24, BR-08, BR-16, BR-18 | UC12 | AllocationService, LotteryAllocationStrategy, AllocationRun, AllocationPlan | allocation_runs, registrations, tickets, waitlist_entries | Sequence UC12, Activity Lottery, State Registration |
| FR-15, FR-16, BR-10, BR-18, BR-20 | UC06 | RegistrationService, WaitlistService, TicketService | registrations, waitlist_entries, tickets | Sequence UC06, Activity Cancel/Promote, State Registration/Ticket |
| FR-17, FR-18, BR-11..BR-13 | UC14 | CheckInService, TicketService, Ticket, CheckIn | tickets, check_ins | Sequence UC14, State Ticket |
| FR-19, FR-20, BR-15 | UC10, UC03/04 | AccessibilityFeature, AccessibilityService | accessibility_features, event_accessibility | Sequence UC09 (setup), Component Diagram |
| BR-19 | UC10/UC11 | EventService, SessionService, RegistrationService, TicketService | events, event_sessions, registrations, tickets | State Event, EventSession, Registration, Ticket |

## 4. Cardinality baseline đã khóa

| Quan hệ | Cardinality |
|---|---|
| User -> Event | `1 -> 0..*` |
| Venue -> Event | `1 -> 0..*` |
| Event -> EventSession | `1 -> 0..*` (DRAFT có thể chưa có suất; publish cần >=1) |
| User -> Registration | `1 -> 0..*` |
| EventSession -> Registration | `1 -> 0..*` |
| Registration -> WaitlistEntry | `1 -> 0..1` |
| Registration -> Ticket | `1 -> 0..1` |
| Ticket -> CheckIn | `1 -> 0..1` |
| Event <-> AccessibilityFeature | `0..* <-> 0..*` |
| EventSession -> AllocationRun | `1 -> 0..1` trong MVP |
| User -> AllocationRun | `1 -> 0..*` |

## 5. Invariant phải giữ nguyên khi code
1. `confirmed registrations <= session.capacity`.
2. `UNIQUE(attendee_id, session_id)`.
3. `UNIQUE(tickets.registration_id)`.
4. `UNIQUE(check_ins.ticket_id)`.
5. `UNIQUE(allocation_runs.session_id)` cho Lottery MVP.
6. Event chỉ publish khi có ít nhất một EventSession hợp lệ.
7. Ticket chỉ phát khi Registration đã `CONFIRMED`.
8. Ticket `USED` không quay lại `VALID` theo luồng thường.
9. Hủy Registration CONFIRMED + promote waitlist là một transaction.
10. Lottery allocation là một transaction và chỉ một run được commit.
11. FCFS phải khóa/serialize phần kiểm tra capacity để không oversell.

## 6. Kết luận review
Về **logic PTTK**, baseline giữa kỳ đã nhất quán sau vòng review này. Từ thời điểm này không nên tự ý đổi entity, tên trạng thái, cardinality hoặc business rule trong lúc code. Nếu có thay đổi, phải cập nhật lại các tài liệu phụ thuộc theo traceability ở trên.

### Gate cuối trước khi merge `dev -> main`
- Preview toàn bộ `.puml` bằng PlantUML trong VS Code để kiểm tra lỗi render/layout.
- Kiểm tra chữ không bị chồng/diagram quá rộng khi đưa vào báo cáo.
- Sau khi preview đạt, tạo PR `dev -> main` và chỉ merge baseline giữa kỳ đã kiểm tra.
