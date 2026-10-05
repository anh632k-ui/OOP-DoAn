# MED-06 - Ghi chú thiết kế CSDL

## 1. Mục tiêu
Phần CSDL của PTTK gồm ba lớp tài liệu:
1. ERD để nhìn quan hệ.
2. Data Dictionary để hiểu từng bảng/cột/constraint.
3. PostgreSQL DDL để chứng minh thiết kế có thể hiện thực trực tiếp.

## 2. Quyết định thiết kế chính
- Dùng PostgreSQL.
- Khóa chính dùng UUID.
- Trạng thái nghiệp vụ dùng PostgreSQL ENUM để giữ miền giá trị rõ ràng.
- Không xóa vật lý các bản ghi nghiệp vụ chính trong luồng thông thường; dùng status như CANCELLED/LOCKED để giữ audit.
- Object Storage chỉ lưu file ảnh; CSDL chỉ lưu `image_url`.
- Search MVP dùng PostgreSQL Full Text Search, chưa cần Elasticsearch.

## 3. Cardinality đã khóa
- User 1 - N Event với vai trò Organizer.
- Venue 1 - N Event.
- Event 1 - N EventSession; Event DRAFT có thể tạm thời có 0 Session.
- User 1 - N Registration.
- EventSession 1 - N Registration.
- Registration 1 - 0..1 WaitlistEntry.
- Registration 1 - 0..1 Ticket.
- Ticket 1 - 0..1 CheckIn.
- Event N - N AccessibilityFeature qua `event_accessibility`.
- EventSession 1 - 0..1 AllocationRun trong Lottery MVP.

## 4. Constraint cấp DB
Các constraint bắt buộc đã được đưa vào DDL:
- unique email.
- `UNIQUE(registrations.attendee_id, registrations.session_id)`.
- `UNIQUE(waitlist_entries.registration_id)`.
- `UNIQUE(tickets.registration_id)` và unique ticket_code.
- `UNIQUE(check_ins.ticket_id)`.
- `UNIQUE(allocation_runs.session_id)`.
- capacity > 0.
- start/end time hợp lệ.
- registration window hợp lệ.
- candidate_count/confirmed_count không âm.

## 5. Rule không thể chỉ dùng CHECK constraint
Một số rule phụ thuộc nhiều dòng/bảng hoặc cần concurrency control, nên để service + transaction xử lý:
- không oversell capacity;
- session capacity không vượt Venue capacity;
- phát Ticket chỉ khi Registration CONFIRMED;
- promote waitlist đúng thứ tự;
- Lottery chỉ chạy sau khi đóng đăng ký;
- check-in đồng thời chỉ một request thành công.

Đây là quyết định có chủ đích: DB bảo vệ integrity cơ bản, application/domain layer bảo vệ business invariant và transaction boundary.

## 6. Transaction boundary quan trọng
### FCFS registration
Khóa EventSession -> tạo Registration -> đếm CONFIRMED -> xác nhận hoặc đưa waitlist -> phát Ticket nếu cần -> commit.

### Hủy confirmed + promote
Khóa EventSession -> CANCEL Registration -> CANCEL Ticket -> lấy WaitlistEntry ACTIVE đầu tiên -> promote -> phát Ticket mới -> commit.

### Lottery
Khóa EventSession -> kiểm tra chưa có AllocationRun -> lấy candidates -> tính AllocationPlan -> cập nhật Registration -> phát Ticket / tạo WaitlistEntry -> ghi AllocationRun -> commit.

### Check-in
Khóa Ticket -> kiểm tra VALID và chưa có CheckIn -> tạo CheckIn -> Ticket USED -> commit.

## 7. Index phục vụ nghiệp vụ
Các index chính:
- Events theo organizer, status, start_date.
- EventSession theo event, status và registration window.
- Registration theo `(session_id, status)` và attendee.
- Waitlist partial index trên `position WHERE status='ACTIVE'`.
- Ticket theo status.
- CheckIn theo staff.
- AllocationRun theo executor.
- GIN Full Text Search trên Event name + description.

## 8. ORM sau giữa kỳ
DDL này là nguồn chuẩn của thiết kế vật lý giữa kỳ. Khi bắt đầu code NestJS, schema sẽ được ánh xạ sang ORM (Prisma hoặc TypeORM). Migration ORM phải giữ nguyên các constraint và invariant đã khóa ở đây; không được tự đổi cardinality/business rule mà không cập nhật PTTK.
