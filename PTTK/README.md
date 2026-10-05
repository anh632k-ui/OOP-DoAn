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
- Mọi sơ đồ dùng chung một bộ thuật ngữ, cardinality và business rule; không tự ý đổi tên entity/use case giữa các sơ đồ.

## 3. Thứ tự PTTK đã thực hiện
1. Yêu cầu và business rules.
2. Actor + Use Case.
3. Domain Model.
4. Class Diagram.
5. ERD.
6. Sequence Diagram.
7. Activity Diagram và State Diagram.
8. Component/Deployment Architecture.
9. Consistency Review + Traceability + REST API baseline + Verification Matrix.

## 4. Thuật ngữ chuẩn
| Thuật ngữ | Ý nghĩa |
|---|---|
| Event | Sự kiện văn hóa tổng thể. |
| EventSession | Một suất cụ thể của Event, có thời gian và sức chứa riêng. |
| Registration | Yêu cầu đăng ký của Attendee cho một EventSession. |
| AllocationPolicy | Chính sách phân bổ vé: `FCFS` hoặc `LOTTERY`. |
| WaitlistEntry | Entry xác định thứ tự ưu tiên trong danh sách chờ của EventSession. |
| Ticket | Vé điện tử được phát khi Registration được xác nhận. |
| CheckIn | Bản ghi xác nhận Ticket đã được sử dụng để vào sự kiện. |
| AccessibilityFeature | Một đặc tính hỗ trợ tiếp cận của sự kiện/địa điểm. |
| AllocationRun | Bản ghi một lần chạy LOTTERY đã commit, dùng cho audit/kiểm chứng. |

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
- [x] Consistency Review / Traceability
- [x] REST API baseline
- [x] Verification/Test Design baseline
- [ ] Preview trực quan toàn bộ `.puml` trong VS Code và chỉnh layout nếu cần

## 6. Bộ sơ đồ hiện có
### Sequence
- `05_Sequence/01-uc05-register-session.puml`
- `05_Sequence/02-uc06-cancel-promote-waitlist.puml`
- `05_Sequence/03-uc12-lottery-allocation.puml`
- `05_Sequence/04-uc14-check-in.puml`
- `05_Sequence/05-uc09-create-event.puml`

### Activity
- `06_Activity/01-registration-flow.puml`
- `06_Activity/02-cancel-promote-flow.puml`
- `06_Activity/03-lottery-allocation-flow.puml`

### State
- `07_State/01-registration-state.puml`
- `07_State/02-ticket-state.puml`
- `07_State/03-event-session-state.puml`
- `07_State/04-event-state.puml`

### Architecture
- `08_Architecture/01-component-diagram.puml`
- `08_Architecture/02-deployment-diagram.puml`

### Review / khóa thiết kế
- `09_Review/01-consistency-review.md`
- `09_Review/02-rest-api-baseline.md`
- `09_Review/03-verification-matrix.md`

## 7. Baseline giữa kỳ v1
Bộ PTTK đã phủ và đồng bộ các luồng nghiệp vụ cốt lõi: tạo/công bố sự kiện, quản lý suất, đăng ký FCFS/LOTTERY, waitlist, phát vé, hủy và promote, check-in, accessibility, chống bot cơ bản, audit allocation, search/object storage và kiến trúc triển khai.

Các quyết định đã khóa sau review:
- Event DRAFT có thể có `0..*` EventSession; publish cần ít nhất 1 session hợp lệ.
- Một Attendee chỉ có một Registration cho một EventSession trong MVP.
- FCFS allocation chạy tại UC05; Lottery dùng tối đa một AllocationRun đã commit / EventSession.
- `confirmed registrations <= capacity` luôn phải được bảo vệ bằng transaction/locking.
- Một Registration có tối đa một Ticket; một Ticket có tối đa một CheckIn.
- Hủy CONFIRMED + promote waitlist, Lottery allocation và check-in là các transaction boundary bắt buộc.
- Event/Session cancellation phải cascade theo business rules đã định nghĩa.

## 8. Gate trước khi merge sang main
Về **logic PTTK**, baseline v1 đã review xong và có thể dùng làm nguồn chuẩn để code. Trước khi merge `dev -> main`, cần mở/preview toàn bộ `.puml` trên VS Code để kiểm tra lỗi render hoặc sơ đồ quá rộng/chồng chữ; đây là kiểm tra trình bày, không thay đổi business logic nếu không phát hiện vấn đề mới.

> Nếu sau này thay đổi business rule, phải cập nhật đồng bộ Requirement -> Use Case -> Domain/Class -> ERD -> Dynamic Diagram -> API/Test liên quan theo `09_Review/01-consistency-review.md`.
