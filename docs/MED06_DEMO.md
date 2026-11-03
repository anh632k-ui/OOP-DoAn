# MED-06 — Kịch bản demo và nói 5–7 phút

**Chuẩn bị:** chạy script start + test, mở sẵn các trang chính. Có ít nhất hai tài khoản ATTENDEE và một tài khoản ORGANIZER/CHECKIN trong DB demo. Có sẵn sự kiện FCFS sức chứa 1 và một suất LOTTERY chuẩn bị đóng đăng ký.

**0:00–0:40 — Bài toán.** Vé miễn phí có hạn, đăng ký đồng thời, phân bổ công bằng, tránh dùng một mã vé nhiều lần. Actor: Guest, Attendee, Organizer, Check-in và Admin.

**0:40–1:20 — Phân tích thiết kế.** Trình chiếu Use Case, Class Diagram, ERD. Sự kiện có nhiều suất. Đăng ký thuộc người và suất. Vé thuộc một đăng ký, trạng thái vé quyết định check-in. Giải thích 16 bảng nghiệp vụ + schema_migrations kỹ thuật.

**1:20–2:20 — Ban tổ chức.** Mở /organizer, tạo sự kiện nháp, địa điểm, suất, sức chứa, policy và công bố. Thao tác bị từ chối nếu thiếu suất hoặc policy.

**2:20–3:20 — FCFS.** Hai tài khoản đăng ký suất có 1 chỗ. Một được cấp vé, một vào danh sách chờ. Hủy vé người đầu, F5 người thứ hai để chứng minh được đôn lên.

**3:20–4:10 — Lottery.** Với suất đã đóng đăng ký, bấm bốc thăm một lần. Thứ tự được xếp bằng HMAC theo seed ngẫu nhiên; có thể đối chiếu lại kết quả. Không cho chạy lại cùng suất.

**4:10–5:10 — QR và check-in.** Vào /tickets lấy mã QR. Dùng /checkin chọn mã suất và quét/nhập vé. Quét lần 1 thành công, quét lần 2 từ chối, số vé đã sử dụng chỉ tăng một lần.

**5:10–5:50 — Search/accessibility/object storage.** Lọc sự kiện theo tên và tiện ích hỗ trợ đã xác nhận; ảnh bìa lưu ngoài PostgreSQL.

**5:50–6:40 — Kiểm thử và giới hạn.** Giới thiệu GitHub Actions, transaction và DB unique/trigger. Nêu trung thực giới hạn chống bot cơ bản, không có pre-commit seed và chưa triển khai theo quy mô Internet production.

## Hỏi đáp thường gặp

- FCFS có tranh chấp? Khóa dòng suất trong PostgreSQL trước khi tính số vé, trigger bảo vệ sức chứa. Người đến sau chuyển sang chờ nếu hết vé.
- Lottery công bằng thế nào? Seed ngẫu nhiên xếp thứ tự HMAC, có thể tái kiểm tra sau draw; chưa pre-commit trước hạn đăng ký.
- Cùng QR quét hai lần? Unique index chỉ cho một check-in thành công trên một vé; trigger chuyển trạng thái DA_SU_DUNG.
- Vì sao ERD 16 bảng còn PostgreSQL 17? schema_migrations chỉ lưu lịch sử DDL.
- Composition giữa sự kiện và suất? Suất phụ thuộc nghiệp vụ vào sự kiện, không phải kế thừa.
- Docker có quản lý VS Code không? Không; VS Code dùng sửa source, Docker vận hành container, pgAdmin là công cụ xem CSDL.
