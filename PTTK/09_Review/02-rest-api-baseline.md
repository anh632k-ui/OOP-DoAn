# REST API baseline - MED-06

Tài liệu này khóa naming sơ bộ giữa PTTK và backend NestJS. Đây chưa phải OpenAPI chi tiết; mục tiêu là tránh lúc code tự phát sinh route không nhất quán với Use Case/Sequence.

## 1. Auth / Users
| Method | Route | Actor | Mục đích |
|---|---|---|---|
| POST | `/auth/register` | Guest | Tạo tài khoản Attendee |
| POST | `/auth/login` | Guest | Đăng nhập |
| GET | `/me` | Authenticated User | Xem thông tin tài khoản hiện tại |
| PATCH | `/admin/users/{userId}/status` | Admin | Khóa/mở khóa tài khoản |

## 2. Events / Search / Accessibility
| Method | Route | Actor | Use Case |
|---|---|---|---|
| GET | `/events` | Public | UC03 - danh sách/tìm kiếm/lọc; query hỗ trợ `q`, thời gian, accessibility |
| GET | `/events/{eventId}` | Public | UC04 - chi tiết Event + sessions + accessibility |
| POST | `/events` | Organizer | UC09 - tạo Event DRAFT |
| PATCH | `/events/{eventId}` | Organizer owner | UC09 - cập nhật Event |
| POST | `/events/{eventId}/publish` | Organizer owner | UC11 - publish Event |
| POST | `/events/{eventId}/cancel` | Organizer owner | UC11 - hủy Event và cascade các Session chưa hoàn tất |
| PUT | `/events/{eventId}/accessibility` | Organizer owner | UC10 - gán AccessibilityFeature |

## 3. EventSession
| Method | Route | Actor | Use Case |
|---|---|---|---|
| POST | `/events/{eventId}/sessions` | Organizer owner | UC10 - tạo suất |
| PATCH | `/sessions/{sessionId}` | Organizer owner | UC10 - cập nhật suất |
| POST | `/sessions/{sessionId}/registration/open` | Organizer owner | UC11 - mở đăng ký |
| POST | `/sessions/{sessionId}/registration/close` | Organizer owner | UC11 - đóng đăng ký |
| POST | `/sessions/{sessionId}/cancel` | Organizer owner | UC10 - hủy suất/cascade Registration + Ticket |

## 4. Registration / Waitlist / Ticket
| Method | Route | Actor | Use Case |
|---|---|---|---|
| POST | `/sessions/{sessionId}/registrations` | Attendee | UC05 - đăng ký suất |
| DELETE | `/registrations/{registrationId}` | Attendee owner | UC06 - hủy đăng ký |
| GET | `/me/registrations` | Attendee | UC07 - xem Registration + trạng thái waitlist |
| GET | `/me/tickets` | Attendee | UC08 - xem vé điện tử |
| GET | `/me/tickets/{ticketId}` | Attendee owner | UC08 - chi tiết/QR vé |

## 5. Allocation / Organizer statistics
| Method | Route | Actor | Use Case |
|---|---|---|---|
| POST | `/sessions/{sessionId}/allocation` | Organizer owner | UC12 - chạy Lottery AllocationRun |
| GET | `/sessions/{sessionId}/allocation` | Organizer owner | UC12/13 - xem kết quả AllocationRun |
| GET | `/sessions/{sessionId}/statistics` | Organizer owner | UC13 - registration/ticket/waitlist/check-in counts |

> FCFS không có batch allocation endpoint riêng. FCFS được thực hiện atomically khi gọi `POST /sessions/{sessionId}/registrations`.

## 6. Check-in
| Method | Route | Actor | Use Case |
|---|---|---|---|
| POST | `/check-ins` | CheckInStaff | UC14 - body gồm `sessionId`, `ticketCode`, `method` |
| GET | `/sessions/{sessionId}/check-ins` | Organizer owner/Admin | UC13/15 - xem lịch sử check-in |

## 7. HTTP behavior baseline
- `200 OK`: đọc/cập nhật thành công có response body.
- `201 Created`: tạo Event/Session/Registration/Ticket-related result/CheckIn thành công.
- `204 No Content`: thao tác command thành công nhưng không cần body, ví dụ cancel/update association.
- `400 Bad Request`: dữ liệu sai/business precondition đơn giản không đạt.
- `401 Unauthorized`: chưa đăng nhập/token không hợp lệ.
- `403 Forbidden`: sai role hoặc không sở hữu Event/Registration.
- `404 Not Found`: resource không tồn tại.
- `409 Conflict`: duplicate registration, AllocationRun đã tồn tại, race/concurrency conflict hoặc state transition xung đột.
- `429 Too Many Requests`: rate limit/anti-bot.

## 8. Quy ước implementation
1. Controller chỉ validate transport/auth và gọi service; không tự cập nhật entity status.
2. Ownership check đặt trong application service/repository query phù hợp, không tin `organizerId` từ body.
3. Transaction phải nằm ở service/use-case boundary cho UC05 FCFS, UC06 promote, UC12 Lottery và UC14 CheckIn.
4. Route naming trong Sequence Diagram phải bám tài liệu này khi code backend.
5. DTO/API có thể phát triển chi tiết hơn nhưng không đổi business semantics đã khóa trong PTTK.
