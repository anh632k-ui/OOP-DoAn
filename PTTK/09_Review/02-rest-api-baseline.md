# REST API mốc chuẩn - MED-06

Tài liệu này khóa naming sơ bộ giữa PTTK và backend NestJS. Đây chưa phải OpenAPI chi tiết; mục tiêu là tránh lúc code tự phát sinh đường dẫn không nhất quán với Ca sử dụng/Tuần tự.

## 1. Auth / Người dùngs
| Method | Đường dẫn | Tác nhân | Mục đích |
|---|---|---|---|
| POST | `/auth/register` | Khách | Tạo tài khoản Người tham dự |
| POST | `/auth/login` | Khách | Đăng nhập |
| GET | `/me` | Người dùng đã đăng nhập | Xem thông tin tài khoản hiện tại |
| PATCH | `/admin/users/{userId}/trạng thái` | Admin | Khóa/mở khóa tài khoản |

## 2. Sự kiệns / Tìm kiếm / Accessibility
| Method | Đường dẫn | Tác nhân | Ca sử dụng |
|---|---|---|---|
| GET | `/events` | Public | UC03 - danh sách/tìm kiếm/lọc; query hỗ trợ `q`, thời gian, hỗ trợ tiếp cận |
| GET | `/events/{eventId}` | Public | UC04 - chi tiết Sự kiện + sessions + hỗ trợ tiếp cận |
| POST | `/events` | Ban tổ chức | UC09 - tạo Sự kiện NHÁP |
| PATCH | `/events/{eventId}` | Ban tổ chức owner | UC09 - cập nhật Sự kiện |
| POST | `/events/{eventId}/công bố` | Ban tổ chức owner | UC11 - công bố Sự kiện |
| POST | `/events/{eventId}/hủy` | Ban tổ chức owner | UC11 - hủy Sự kiện và cascade các Session chưa hoàn tất |
| PUT | `/events/{eventId}/hỗ trợ tiếp cận` | Ban tổ chức owner | UC10 - gán Đặc tính hỗ trợ tiếp cận |

## 3. Suất sự kiện
| Method | Đường dẫn | Tác nhân | Ca sử dụng |
|---|---|---|---|
| POST | `/events/{eventId}/sessions` | Ban tổ chức owner | UC10 - tạo suất |
| PATCH | `/sessions/{sessionId}` | Ban tổ chức owner | UC10 - cập nhật suất |
| POST | `/sessions/{sessionId}/registration/open` | Ban tổ chức owner | UC11 - mở đăng ký |
| POST | `/sessions/{sessionId}/registration/close` | Ban tổ chức owner | UC11 - đóng đăng ký |
| POST | `/sessions/{sessionId}/hủy` | Ban tổ chức owner | UC10 - hủy suất/cascade Đăng ký + Vé |

## 4. Đăng ký / Danh sách chờ / Vé
| Method | Đường dẫn | Tác nhân | Ca sử dụng |
|---|---|---|---|
| POST | `/sessions/{sessionId}/registrations` | Người tham dự | UC05 - đăng ký suất |
| DELETE | `/registrations/{registrationId}` | Người tham dự owner | UC06 - hủy đăng ký |
| GET | `/me/registrations` | Người tham dự | UC07 - xem Đăng ký + trạng thái danh sách chờ |
| GET | `/me/tickets` | Người tham dự | UC08 - xem vé điện tử |
| GET | `/me/tickets/{ticketId}` | Người tham dự owner | UC08 - chi tiết/QR vé |

## 5. Phân bổ / Ban tổ chức statistics
| Method | Đường dẫn | Tác nhân | Ca sử dụng |
|---|---|---|---|
| POST | `/sessions/{sessionId}/phân bổ` | Ban tổ chức owner | UC12 - chạy Lottery Lần phân bổ |
| GET | `/sessions/{sessionId}/phân bổ` | Ban tổ chức owner | UC12/13 - xem kết quả Lần phân bổ |
| GET | `/sessions/{sessionId}/statistics` | Ban tổ chức owner | UC13 - registration/ticket/danh sách chờ/check-in counts |

> FCFS không có batch phân bổ endpoint riêng. FCFS được thực hiện atomically khi gọi `POST /sessions/{sessionId}/registrations`.

## 6. Check-in
| Method | Đường dẫn | Tác nhân | Ca sử dụng |
|---|---|---|---|
| POST | `/check-ins` | Nhân viên check-in | UC14 - body gồm `sessionId`, `mãVé`, `method` |
| GET | `/sessions/{sessionId}/check-ins` | Ban tổ chức owner/Admin | UC13/15 - xem lịch sử check-in |

## 7. HTTP behavior mốc chuẩn
- `200 OK`: đọc/cập nhật thành công có nội dung phản hồi.
- `201 Created`: tạo Sự kiện/Session/Đăng ký/Vé-related result/Lượt check-in thành công.
- `204 No Content`: thao tác command thành công nhưng không cần body, ví dụ hủy/update association.
- `400 Bad Yêu cầu`: dữ liệu sai/business precondition đơn giản không đạt.
- `401 Unauthorized`: chưa đăng nhập/token không hợp lệ.
- `403 Forbidden`: sai vai trò hoặc không sở hữu Sự kiện/Đăng ký.
- `404 Not Found`: tài nguyên không tồn tại.
- `409 Conflict`: trùng lặp registration, Lần phân bổ đã tồn tại, race/concurrency conflict hoặc state transition xung đột.
- `429 Too Many Yêu cầus`: rate limit/anti-bot.

## 8. Quy ước implementation
1. Bộ điều khiển chỉ validate transport/auth và gọi dịch vụ; không tự cập nhật entity trạng thái.
2. Ownership check đặt trong application dịch vụ/repository query phù hợp, không tin `organizerId` từ body.
3. Giao dịch phải nằm ở dịch vụ/use-case boundary cho UC05 FCFS, UC06 chọn lên, UC12 Lottery và UC14 Lượt check-in.
4. Đường dẫn naming trong Tuần tự Diagram phải bám tài liệu này khi code backend.
5. DTO/API có thể phát triển chi tiết hơn nhưng không đổi business semantics đã khóa trong PTTK.
