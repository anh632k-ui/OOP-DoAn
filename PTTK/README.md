# PTTK - MED-06

## 1. Đề tài
**MED-06 - Cổng quản lý sự kiện văn hóa và vé miễn phí**

Hệ thống hỗ trợ công bố sự kiện văn hóa, quản lý các suất diễn, đăng ký vé miễn phí, phân bổ vé công bằng, danh sách chờ, phát vé QR và check-in. Hai điểm nhấn bổ sung là chống bot cơ bản và thông tin accessibility của sự kiện.

## 2. Nguyên tắc thiết kế
- Kiến trúc định hướng: **Modular Monolith**.
- Backend: **TypeScript + NestJS**.
- Frontend: **Next.js**.
- CSDL: **PostgreSQL**.
- UML được lưu dưới dạng **PlantUML (`.puml`)** để chỉnh sửa và preview trực tiếp trong VS Code.
- `dev` là nhánh phát triển; chỉ đưa sang `main` khi thiết kế/mã nguồn đã được kiểm tra.
- Mọi sơ đồ phải dùng chung một bộ thuật ngữ và business rule; không tự ý đổi tên entity/use case giữa các sơ đồ.

## 3. Thứ tự hoàn thiện PTTK
1. Yêu cầu và business rules.
2. Actor + Use Case.
3. Domain Model.
4. Class Diagram.
5. ERD.
6. Sequence Diagram.
7. Activity Diagram và State Diagram.
8. Component/Deployment Architecture.

## 4. Thuật ngữ chuẩn
| Thuật ngữ | Ý nghĩa |
|---|---|
| Event | Sự kiện văn hóa tổng thể. |
| EventSession | Một suất cụ thể của Event, có thời gian và sức chứa riêng. |
| Registration | Yêu cầu đăng ký của Attendee cho một EventSession. |
| AllocationPolicy | Chính sách phân bổ vé: `FCFS` hoặc `LOTTERY`. |
| WaitlistEntry | Vị trí của người dùng trong danh sách chờ của một EventSession. |
| Ticket | Vé điện tử được phát khi Registration được xác nhận. |
| CheckIn | Bản ghi xác nhận Ticket đã được sử dụng để vào sự kiện. |
| AccessibilityFeature | Một đặc tính hỗ trợ tiếp cận của sự kiện/địa điểm. |
| AllocationRun | Bản ghi một lần thực hiện phân bổ vé, dùng cho audit/kiểm chứng. |

## 5. Trạng thái PTTK
- [x] Yêu cầu nghiệp vụ
- [x] Actor + Use Case tổng quan
- [x] Đặc tả các Use Case lõi
- [x] Domain Model
- [x] Class Diagram
- [x] ERD
- [x] Sequence Diagram
- [x] Activity Diagram
- [x] State Diagram
- [x] Component/Deployment Diagram

## 6. Bộ sơ đồ hiện có
### Sequence
- `05_Sequence/01-uc05-register-session.puml`
- `05_Sequence/02-uc06-cancel-promote-waitlist.puml`
- `05_Sequence/03-uc12-lottery-allocation.puml`
- `05_Sequence/04-uc14-check-in.puml`

### Activity
- `06_Activity/01-registration-flow.puml`
- `06_Activity/02-cancel-promote-flow.puml`
- `06_Activity/03-lottery-allocation-flow.puml`

### State
- `07_State/01-registration-state.puml`
- `07_State/02-ticket-state.puml`
- `07_State/03-event-session-state.puml`

### Architecture
- `08_Architecture/01-component-diagram.puml`
- `08_Architecture/02-deployment-diagram.puml`

## 7. Baseline giữa kỳ
Bộ PTTK hiện tại đã phủ luồng nghiệp vụ cốt lõi: tạo/công bố sự kiện, đăng ký FCFS/LOTTERY, waitlist, phát vé, hủy và promote, check-in, accessibility, chống bot cơ bản, audit allocation và kiến trúc triển khai.

Trước khi merge sang `main`, cần thực hiện một vòng review consistency giữa Requirement -> Use Case -> Domain Model -> Class Diagram -> ERD -> Sequence/Activity/State -> Architecture và preview tất cả file PlantUML để phát hiện lỗi cú pháp/trình bày.

> Các mục đã đánh dấu là baseline hiện tại trên `dev`; nếu thay đổi business rule về sau phải cập nhật đồng bộ các sơ đồ phụ thuộc.
