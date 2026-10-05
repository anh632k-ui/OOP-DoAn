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

## 5. Trạng thái PTTK
- [x] Yêu cầu nghiệp vụ
- [x] Actor + Use Case tổng quan
- [x] Đặc tả các Use Case lõi
- [ ] Domain Model
- [ ] Class Diagram
- [ ] ERD
- [ ] Sequence Diagram
- [ ] Activity Diagram
- [ ] State Diagram
- [ ] Component/Deployment Diagram

> Các mục đã đánh dấu chỉ được coi là baseline hiện tại trên `dev`; nếu thay đổi business rule về sau phải cập nhật đồng bộ các sơ đồ phụ thuộc.
