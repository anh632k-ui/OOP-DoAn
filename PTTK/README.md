# PTTK - MED-06 - Bản tiếng Việt

## 1. Đề tài
**MED-06 - Cổng quản lý sự kiện văn hóa và vé miễn phí**

Hệ thống hỗ trợ công bố sự kiện văn hóa, quản lý các suất, đăng ký vé miễn phí, phân bổ vé công bằng, danh sách chờ, phát vé QR và check-in. Hai điểm nhấn là chống bot cơ bản và hỗ trợ tiếp cận cho người tham dự.

## 2. Nguyên tắc thiết kế
- Kiến trúc: **khối nguyên khối mô-đun (Modular Monolith)**.
- Phía máy chủ: **TypeScript + NestJS**.
- Giao diện: **Next.js**.
- Cơ sở dữ liệu: **PostgreSQL**.
- Sơ đồ lưu bằng **PlantUML (.puml)**; một số sơ đồ có thêm bản Mermaid để chỉnh trong draw.io.
- Nhánh TV là bản Việt hóa phục vụ PTTK/báo cáo; được đồng bộ từ dev.
- Tên miền nghiệp vụ, lớp, thuộc tính, trạng thái và bảng trong nhánh này ưu tiên tiếng Việt.
- Các tên công nghệ như NestJS, PostgreSQL, REST, HTTP, UUID, JSONB, QR, FCFS, LOTTERY được giữ nguyên vì là thuật ngữ kỹ thuật.

## 3. Chuỗi PTTK
1. Yêu cầu và quy tắc nghiệp vụ.
2. Tác nhân và ca sử dụng.
3. Mô hình miền.
4. Biểu đồ lớp.
5. Thiết kế CSDL: ERD + từ điển dữ liệu + lược đồ PostgreSQL.
6. Biểu đồ tuần tự.
7. Biểu đồ hoạt động và trạng thái.
8. Biểu đồ thành phần và triển khai.
9. Rà soát nhất quán + REST API + ma trận kiểm chứng.

## 4. Thuật ngữ chuẩn bản tiếng Việt
| Thuật ngữ | Ý nghĩa |
|---|---|
| Người dùng | Tài khoản trong hệ thống. |
| Địa điểm | Nơi tổ chức sự kiện. |
| Sự kiện | Chương trình văn hóa tổng thể. |
| Suất sự kiện | Một suất cụ thể của sự kiện, có thời gian và sức chứa riêng. |
| Đăng ký | Yêu cầu tham dự của người dùng cho một suất. |
| Chính sách phân bổ | Cách phân vé: FCFS hoặc LOTTERY. |
| Mục danh sách chờ | Bản ghi xác định thứ tự ưu tiên khi suất đã đủ chỗ. |
| Vé | Vé điện tử được phát khi đăng ký được xác nhận. |
| Lượt check-in | Bản ghi xác nhận vé đã được sử dụng để vào sự kiện. |
| Đặc tính hỗ trợ tiếp cận | Thông tin hỗ trợ người tham dự có nhu cầu tiếp cận đặc biệt. |
| Lần phân bổ | Bản ghi một lần phân bổ LOTTERY đã hoàn tất để phục vụ kiểm chứng. |

## 5. Trạng thái PTTK
- [x] Yêu cầu nghiệp vụ
- [x] Tác nhân + Ca sử dụng
- [x] Mô hình miền
- [x] Biểu đồ lớp
- [x] ERD
- [x] Từ điển dữ liệu
- [x] Lược đồ vật lý PostgreSQL
- [x] Ràng buộc / chỉ mục / quy tắc giao dịch
- [x] Biểu đồ tuần tự
- [x] Biểu đồ hoạt động
- [x] Biểu đồ trạng thái
- [x] Biểu đồ thành phần / triển khai
- [x] Rà soát nhất quán / truy vết
- [x] REST API
- [x] Ma trận kiểm chứng / thiết kế kiểm thử
- [x] Việt hóa thuật ngữ PTTK trên nhánh TV
- [ ] Xem lại trực quan toàn bộ sơ đồ sau khi kéo nhánh TV về máy

## 6. Bộ tài liệu
### 01 - Tác nhân / Ca sử dụng
- 01_Actor_UseCase/01-use-case-overview.puml
- 01_Actor_UseCase/01-use-case-overview.mmd
- 01_Actor_UseCase/02-use-case-specifications.md
- 01_Actor_UseCase/03-use-case-relations.puml
- 01_Actor_UseCase/04-use-case-event-management.puml
- 01_Actor_UseCase/05-use-case-checkin-admin.puml

### 02 - Mô hình miền
- 02_DomainModel/01-domain-model.puml
- 02_DomainModel/02-domain-status-enums.puml

### 03 - Biểu đồ lớp
- 03_ClassDiagram/01-class-diagram-entities.puml
- 03_ClassDiagram/02-class-diagram-services.puml
- 03_ClassDiagram/03-class-diagram-strategy.puml

### 04 - Thiết kế CSDL / ERD
- 04_ERD/01-erd-core.puml
- 04_ERD/02-erd-supporting.puml
- 04_ERD/03-data-dictionary.md
- 04_ERD/04-postgresql-schema.sql
- 04_ERD/05-database-design-notes.md

### 05 - Biểu đồ tuần tự
- UC05 đăng ký suất
- UC06 hủy đăng ký + chọn người trong danh sách chờ
- UC12 phân bổ LOTTERY
- UC14 check-in vé
- UC09 tạo sự kiện

### 06 - Biểu đồ hoạt động
- Đăng ký suất
- Hủy đăng ký + danh sách chờ
- Phân bổ LOTTERY

### 07 - Biểu đồ trạng thái
- Đăng ký
- Vé
- Suất sự kiện
- Sự kiện

### 08 - Kiến trúc
- Biểu đồ thành phần
- Biểu đồ triển khai

### 09 - Rà soát
- Rà soát nhất quán
- REST API
- Ma trận kiểm chứng

## 7. Các quyết định đã khóa
- Sự kiện nháp có thể có 0..* suất; chỉ được công bố khi có ít nhất một suất hợp lệ.
- Một người tham dự chỉ có một đăng ký cho một suất trong MVP.
- FCFS phân bổ ngay tại UC05; LOTTERY dùng tối đa một lần phân bổ đã ghi nhận cho mỗi suất.
- Số đăng ký đã xác nhận không được vượt sức chứa.
- Một đăng ký có tối đa một vé; một vé có tối đa một lượt check-in.
- Hủy đăng ký đã xác nhận + chọn người chờ, phân bổ LOTTERY và check-in là các biên giao dịch bắt buộc.
- Khi hủy sự kiện/suất phải cập nhật dây chuyền các đăng ký và vé liên quan.

## 8. Ghi chú về bản tiếng Việt
Nhánh TV ưu tiên ngôn ngữ báo cáo. Tên bảng/cột PostgreSQL cũng đã có bản tiếng Việt không dấu để đồng bộ với ERD và từ điển dữ liệu. Nhánh dev vẫn giữ bản gốc để đối chiếu khi cần.
