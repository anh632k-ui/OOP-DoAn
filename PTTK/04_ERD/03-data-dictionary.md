# MED-06 - Từ điển dữ liệu PostgreSQL

Tài liệu này mô tả thiết kế dữ liệu vật lý dùng cho baseline giữa kỳ. ERD chỉ thể hiện cấu trúc và quan hệ trực quan; file này mô tả chi tiết ý nghĩa cột, khóa, ràng buộc và trách nhiệm kiểm tra business rule.

## 1. users
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh người dùng |
| full_name | VARCHAR(120) | NOT NULL | Họ tên |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email đăng nhập |
| password_hash | VARCHAR(255) | NOT NULL | Mật khẩu đã băm |
| role | user_role | NOT NULL | ATTENDEE / ORGANIZER / STAFF / ADMIN |
| status | account_status | NOT NULL | ACTIVE / LOCKED |
| created_at | TIMESTAMPTZ | NOT NULL | Thời điểm tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Thời điểm cập nhật |

## 2. venues
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh địa điểm |
| name | VARCHAR(200) | NOT NULL | Tên địa điểm |
| address | TEXT | NOT NULL | Địa chỉ |
| capacity | INTEGER | NOT NULL, CHECK > 0 | Sức chứa tối đa |
| created_at | TIMESTAMPTZ | NOT NULL | Thời điểm tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Thời điểm cập nhật |

## 3. events
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh Event |
| organizer_id | UUID | FK -> users.id | Organizer sở hữu Event |
| venue_id | UUID | FK -> venues.id | Địa điểm tổ chức |
| name | VARCHAR(200) | NOT NULL | Tên sự kiện |
| description | TEXT | NULL | Mô tả |
| status | event_status | NOT NULL | DRAFT / PUBLISHED / COMPLETED / CANCELLED |
| start_date | TIMESTAMPTZ | NOT NULL | Ngày bắt đầu |
| end_date | TIMESTAMPTZ | NOT NULL | Ngày kết thúc |
| image_url | TEXT | NULL | URL ảnh trên object storage |
| created_at | TIMESTAMPTZ | NOT NULL | Thời điểm tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Thời điểm cập nhật |

Ràng buộc logic: `start_date < end_date`. Event DRAFT được phép chưa có EventSession; khi publish, service phải kiểm tra có ít nhất một EventSession hợp lệ.

## 4. event_sessions
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh suất |
| event_id | UUID | FK -> events.id | Event cha |
| start_time | TIMESTAMPTZ | NOT NULL | Bắt đầu suất |
| end_time | TIMESTAMPTZ | NOT NULL | Kết thúc suất |
| capacity | INTEGER | NOT NULL, CHECK > 0 | Sức chứa suất |
| registration_open_at | TIMESTAMPTZ | NOT NULL | Mở đăng ký |
| registration_close_at | TIMESTAMPTZ | NOT NULL | Đóng đăng ký |
| allocation_policy | allocation_policy | NOT NULL | FCFS / LOTTERY |
| status | session_status | NOT NULL | Vòng đời EventSession |
| created_at | TIMESTAMPTZ | NOT NULL | Thời điểm tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Thời điểm cập nhật |

Ràng buộc logic: `start_time < end_time`, `registration_open_at < registration_close_at`. Rule `event_sessions.capacity <= venues.capacity` là rule liên bảng, kiểm tra ở service/domain thay vì CHECK constraint đơn giản.

## 5. registrations
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh đăng ký |
| attendee_id | UUID | FK -> users.id | Người đăng ký |
| session_id | UUID | FK -> event_sessions.id | Suất đăng ký |
| status | registration_status | NOT NULL | PENDING / CONFIRMED / WAITLISTED / CANCELLED |
| registered_at | TIMESTAMPTZ | NOT NULL | Thời điểm đăng ký |
| updated_at | TIMESTAMPTZ | NOT NULL | Thời điểm cập nhật |

Constraint quan trọng: `UNIQUE(attendee_id, session_id)` để một Attendee chỉ có một Registration cho một Session trong MVP.

## 6. waitlist_entries
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh phần tử waitlist |
| registration_id | UUID | FK, UNIQUE | Registration tương ứng |
| position | BIGINT | NOT NULL, CHECK > 0 | Thứ tự ưu tiên |
| joined_at | TIMESTAMPTZ | NOT NULL | Thời điểm vào waitlist |
| status | waitlist_status | NOT NULL | ACTIVE / PROMOTED / CANCELLED |
| updated_at | TIMESTAMPTZ | NOT NULL | Thời điểm cập nhật |

`position` là thứ tự ưu tiên ổn định; thứ hạng hiển thị của các entry ACTIVE có thể được tính động, không cần renumber toàn bộ sau mỗi lần hủy/promote.

## 7. tickets
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh Ticket |
| registration_id | UUID | FK, UNIQUE | Registration được cấp vé |
| ticket_code | VARCHAR(100) | NOT NULL, UNIQUE | Mã vé |
| qr_code | TEXT | NOT NULL | Payload/URL QR |
| status | ticket_status | NOT NULL | VALID / USED / CANCELLED / EXPIRED |
| issued_at | TIMESTAMPTZ | NOT NULL | Thời điểm phát vé |
| updated_at | TIMESTAMPTZ | NOT NULL | Thời điểm cập nhật |

Ticket chỉ được tạo khi Registration = CONFIRMED. Quy tắc này được service/transaction bảo vệ.

## 8. check_ins
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh CheckIn |
| ticket_id | UUID | FK, UNIQUE | Vé được check-in |
| staff_id | UUID | FK -> users.id | Nhân viên thực hiện |
| checked_in_at | TIMESTAMPTZ | NOT NULL | Thời điểm check-in |
| method | check_in_method | NOT NULL | QR / MANUAL_CODE |

`UNIQUE(ticket_id)` là lớp bảo vệ DB để một Ticket chỉ tạo tối đa một CheckIn record.

## 9. accessibility_features
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh feature |
| name | VARCHAR(120) | NOT NULL, UNIQUE | Tên feature |
| description | TEXT | NULL | Mô tả |

## 10. event_accessibility
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| event_id | UUID | PK, FK -> events.id | Event |
| accessibility_feature_id | UUID | PK, FK -> accessibility_features.id | Feature |

Khóa chính ghép ngăn gán trùng một AccessibilityFeature cho cùng Event.

## 11. allocation_runs
| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| id | UUID | PK | Định danh lần phân bổ |
| session_id | UUID | FK, UNIQUE | Session được phân bổ |
| executed_by_user_id | UUID | FK -> users.id | Organizer kích hoạt |
| policy | allocation_policy | NOT NULL | Chính sách phân bổ |
| executed_at | TIMESTAMPTZ | NOT NULL | Thời điểm chạy |
| candidate_count | INTEGER | NOT NULL, CHECK >= 0 | Số ứng viên |
| confirmed_count | INTEGER | NOT NULL, CHECK >= 0 | Số người được xác nhận |
| metadata | JSONB | NOT NULL | Audit: algorithm version, draw order/seed/hash... |

Trong MVP, AllocationRun chỉ dùng cho LOTTERY và `UNIQUE(session_id)` đảm bảo tối đa một run đã commit cho mỗi EventSession.

## 12. Invariant không thể chỉ giao cho DB
Các rule sau phải được bảo vệ ở application/domain service bằng transaction/locking:
- `COUNT(Registration CONFIRMED) <= EventSession.capacity`.
- Hai request FCFS tranh slot cuối chỉ một request được CONFIRMED.
- Hủy Registration CONFIRMED + hủy Ticket + promote Waitlist phải atomic.
- LOTTERY allocation phải atomic và chỉ một AllocationRun được commit.
- Check-in phải khóa/kiểm tra Ticket để hai request đồng thời không cùng thành công.
- Publish Event phải có ít nhất một EventSession hợp lệ.
