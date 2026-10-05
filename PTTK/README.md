# PTTK - MED-06

## 1. Đề tài
**MED-06 - Cổng quản lý sự kiện văn hóa và vé miễn phí**

Hệ thống hỗ trợ công bố sự kiện văn hóa, quản lý các suất diễn, đăng ký vé miễn phí, phân bổ vé công bằng, danh sách chờ, phát vé QR và check-in. Hai điểm nhấn bổ sung là chống bot cơ bản và thông tin accessibility của sự kiện.

## 2. Nguyên tắc thiết kế
- Kiến trúc định hướng: **Modular Monolith**.
- Backend: **TypeScript + NestJS**.
- Frontend: **Next.js**.
- CSDL: **PostgreSQL**.
- UML lưu dạng **PlantUML (`.puml`)** để chỉnh sửa/preview trực tiếp trong VS Code.
- `dev` là nhánh phát triển; chỉ đưa sang `main` sau khi review.
- Mọi sơ đồ dùng chung thuật ngữ, cardinality và business rule.
- Sơ đồ dùng trong báo cáo ưu tiên **một mục tiêu / một hình**, tránh nhồi toàn bộ chi tiết vào một canvas.

## 3. Thứ tự PTTK đã thực hiện
1. Yêu cầu và business rules.
2. Actor + Use Case.
3. Domain Model.
4. Class Diagram.
5. Thiết kế CSDL: ERD + Data Dictionary + PostgreSQL physical schema + indexes/constraints.
6. Sequence Diagram.
7. Activity Diagram và State Diagram.
8. Component/Deployment Architecture.
9. Consistency Review + REST API baseline + Verification Matrix.

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
- [x] Actor + Use Case
- [x] Domain Model
- [x] Class Diagram
- [x] ERD
- [x] Từ điển dữ liệu
- [x] PostgreSQL physical schema (DDL)
- [x] Constraints / indexes / transaction rules của CSDL
- [x] Sequence Diagram
- [x] Activity Diagram
- [x] State Diagram
- [x] Component/Deployment Diagram
- [x] Consistency Review / Traceability
- [x] REST API baseline
- [x] Verification/Test Design baseline
- [x] Refactor layout nhóm sơ đồ 1-4 cho dễ đọc
- [ ] Preview trực quan toàn bộ `.puml` trong VS Code và chỉnh layout cuối nếu cần

## 6. Bộ tài liệu hiện có
### 01 - Actor / Use Case
- `01_Actor_UseCase/01-use-case-overview.puml` - bản tổng quan gọn để đưa vào báo cáo.
- `01_Actor_UseCase/03-use-case-relations.puml` - include/extend và business relation quan trọng.
- `01_Actor_UseCase/02-use-case-specifications.md` - đặc tả Use Case lõi.

### 02 - Domain Model
- `02_DomainModel/01-domain-model.puml` - entity nghiệp vụ và quan hệ cốt lõi.
- `02_DomainModel/02-domain-status-enums.puml` - enum/status tách riêng.

### 03 - Class Diagram
- `03_ClassDiagram/01-class-diagram-entities.puml` - domain entities.
- `03_ClassDiagram/02-class-diagram-services.puml` - application/domain services.
- `03_ClassDiagram/03-class-diagram-strategy.puml` - Strategy Pattern cho FCFS/LOTTERY.

### 04 - Thiết kế CSDL / ERD
- `04_ERD/01-erd-core.puml` - các bảng nghiệp vụ cốt lõi và cardinality.
- `04_ERD/02-erd-supporting.puml` - accessibility và bảng nối.
- `04_ERD/03-data-dictionary.md` - từ điển dữ liệu chi tiết cho 11 bảng.
- `04_ERD/04-postgresql-schema.sql` - PostgreSQL DDL: enum, table, PK/FK/UQ/CHECK và indexes.
- `04_ERD/05-database-design-notes.md` - quyết định thiết kế, transaction boundary và rule phân chia DB/service.

### 05 - Sequence
- `05_Sequence/01-uc05-register-session.puml`
- `05_Sequence/02-uc06-cancel-promote-waitlist.puml`
- `05_Sequence/03-uc12-lottery-allocation.puml`
- `05_Sequence/04-uc14-check-in.puml`
- `05_Sequence/05-uc09-create-event.puml`

### 06 - Activity
- `06_Activity/01-registration-flow.puml`
- `06_Activity/02-cancel-promote-flow.puml`
- `06_Activity/03-lottery-allocation-flow.puml`

### 07 - State
- `07_State/01-registration-state.puml`
- `07_State/02-ticket-state.puml`
- `07_State/03-event-session-state.puml`
- `07_State/04-event-state.puml`

### 08 - Architecture
- `08_Architecture/01-component-diagram.puml`
- `08_Architecture/02-deployment-diagram.puml`

### 09 - Review / khóa thiết kế
- `09_Review/01-consistency-review.md`
- `09_Review/02-rest-api-baseline.md`
- `09_Review/03-verification-matrix.md`

## 7. Baseline giữa kỳ v1
Bộ PTTK đã phủ và đồng bộ các luồng cốt lõi: tạo/công bố sự kiện, quản lý suất, đăng ký FCFS/LOTTERY, waitlist, phát vé, hủy và promote, check-in, accessibility, chống bot cơ bản, audit allocation, search/object storage và kiến trúc triển khai.

Thiết kế dữ liệu đã được hiện thực hóa từ ERD xuống PostgreSQL DDL. DB bảo vệ integrity cơ bản bằng PK/FK/UNIQUE/CHECK/index; các invariant liên quan concurrency và nhiều bảng được giao cho service + transaction/locking.

Các quyết định đã khóa sau review:
- Event DRAFT có thể có `0..*` EventSession; publish cần ít nhất 1 session hợp lệ.
- Một Attendee chỉ có một Registration cho một EventSession trong MVP.
- FCFS allocation chạy tại UC05; Lottery dùng tối đa một AllocationRun đã commit / EventSession.
- `confirmed registrations <= capacity` luôn phải được bảo vệ bằng transaction/locking.
- Một Registration có tối đa một Ticket; một Ticket có tối đa một CheckIn.
- Hủy CONFIRMED + promote waitlist, Lottery allocation và check-in là các transaction boundary bắt buộc.
- Event/Session cancellation phải cascade theo business rules đã định nghĩa.

## 8. Gate trước khi merge sang main
Về **logic PTTK + thiết kế CSDL**, baseline v1 đã review xong và có thể dùng làm nguồn chuẩn để code. Các sơ đồ tổng hợp quá lớn đã được tách thành nhiều hình nhỏ để phục vụ báo cáo và trình chiếu.

Trước khi merge `dev -> main`, mở/preview các file `.puml` trên VS Code để kiểm tra lỗi render, chữ chồng hoặc layout chưa cân đối; đồng thời chạy thử `04_ERD/04-postgresql-schema.sql` trên PostgreSQL/pgAdmin để xác nhận DDL tạo schema thành công. Nếu chỉ chỉnh bố cục/cú pháp thì không thay đổi business logic.

> Nếu thay đổi business rule, phải cập nhật đồng bộ Requirement -> Use Case -> Domain/Class -> Database/ERD -> Dynamic Diagram -> API/Test liên quan theo `09_Review/01-consistency-review.md`.
