# MED-06 — Báo cáo rà soát 5 lượt (30/10/2026)

Nhánh gốc: TV. Nhánh chỉnh: pttk-chuan-mau-thay-20261030.
Phương pháp đối chiếu: mẫu Bài 6 giảng viên (Use Case/Class/Sequence/Activity/ERD); bản Lab7 thiết kế lớp phân tích và CSDL; nghiệp vụ MED-06 trên nhánh TV.

## Lượt 1 — Yêu cầu và Use Case
- Giữ 15 UC và 5 actor. Bổ sung Người tham dự với UC03/04.
- Bỏ việc ép các tác vụ độc lập thành include: quản lý suất/hỗ trợ tiếp cận; quản trị người dùng/giám sát.
- Ghi nhận check-in chỉ là extend của UC14 khi xác minh thành công; cần xem lại cách diễn giải khi báo cáo.

## Lượt 2 — Domain và Class
- Bổ sung người thực hiện Lần phân bổ, nhân viên thực hiện Lượt check-in trong Class.
- Giữ composition Sự kiện–Suất sự kiện, Đăng ký–Vé, Vé–Lượt check-in theo phạm vi MVP.
- Bổ sung phương thức hủyMụcChờ; thay placeholder '...' của Service bằng tham số kiểu dữ liệu.

## Lượt 3 — ERD với PostgreSQL
- Thêm 00-erd-tong-the-11-bang.puml gồm đầy đủ 11 bảng đang có trong schema.
- Bao gồm hai FK người thực hiện lan_phan_bo và check_in; hai FK của su_kien_tiep_can.
- Lược đồ SQL cũ được giữ nguyên: các nghiệp vụ liên quan giao dịch vẫn do Service bảo vệ.

## Lượt 4 — Sequence/Activity/State
- 5 Sequence có Actor, Boundary, Control, Entity, Database và nhánh thay thế/lỗi.
- Các luồng FCFS, LOTTERY, danh sách chờ, hủy, check-in giữ yêu cầu chống trùng và giao dịch.
- Activity và State giữ các nhánh nghiệp vụ cũ, đổi màu/bố cục cho đồng nhất.

## Lượt 5 — Kiểm tra tĩnh định dạng, phạm vi và bàn giao
- Đã kiểm tra 25 file .puml cũ + 1 ERD tổng thể mới còn giữ @startuml/@enduml (tại thời điểm tạo bản sửa).
- Màu lớp vàng nhạt #FFF8CE, viền/mũi tên #C05773, nền trắng; tách phần tổng thể và phân rã.
- Chưa chạy PlantUML renderer, PostgreSQL, kiểm thử code NestJS hay kiểm tra ảnh ở mức 100%: KHÔNG tự ghi PASS đối với các mục này.

## Việc bắt buộc trước khi chốt báo cáo
1. Render tất cả .puml bằng VS Code + PlantUML; kiểm tra lỗi cú pháp và chữ chồng.
2. Xuất SVG/PNG từng sơ đồ, điều chỉnh sơ đồ có chữ nhỏ/đường chéo.
3. Thử chạy schema trong PostgreSQL ở môi trường dự án.
4. Đối chiếu method thực tế khi viết NestJS/Next.js với thông điệp Sequence.
5. Không merge vào TV/main trước khi các kiểm tra trên đạt.