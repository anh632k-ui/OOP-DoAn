# Verification / Test Design baseline - MED-06

Mục tiêu của tài liệu này là biến các business invariant trong PTTK thành test có thể hiện thực sau khi code. Đây là baseline kiểm chứng, chưa phải test code.

## 1. Unit tests trọng yếu
| ID | Đối tượng | Tình huống | Kỳ vọng |
|---|---|---|---|
| UT-01 | Event | publish khi chưa có session hợp lệ | từ chối |
| UT-02 | Event | publish khi có >=1 session hợp lệ | `PUBLISHED` |
| UT-03 | EventSession | kiểm tra registration window đúng thời gian | `true` |
| UT-04 | FcfsAllocationStrategy | confirmedCount < capacity | registration mới nằm trong confirmed plan |
| UT-05 | FcfsAllocationStrategy | confirmedCount >= capacity | registration mới nằm trong waitlisted plan |
| UT-06 | LotteryAllocationStrategy | N ứng viên, K slot | đúng `min(N,K)` confirmed, còn lại waitlisted; không trùng ID |
| UT-07 | Ticket | `VALID -> USED` | hợp lệ |
| UT-08 | Ticket | `USED -> VALID` | bị từ chối |
| UT-09 | Registration | WAITLISTED được promote | `CONFIRMED` |

## 2. Integration tests nghiệp vụ
| ID | Luồng | Dữ liệu | Kỳ vọng |
|---|---|---|---|
| IT-01 | UC05 FCFS còn chỗ | capacity=2, confirmed=1 | Registration CONFIRMED + đúng 1 Ticket |
| IT-02 | UC05 FCFS hết chỗ | capacity=1, confirmed=1 | Registration WAITLISTED + WaitlistEntry, không Ticket |
| IT-03 | Duplicate registration | cùng attendee + session gọi lần 2 | `409`, chỉ 1 Registration trong DB |
| IT-04 | UC05 LOTTERY | policy=LOTTERY, window open | Registration PENDING, không Ticket |
| IT-05 | UC12 Lottery | 150 ứng viên, capacity=100 | 100 CONFIRMED, 50 WAITLISTED, 100 Ticket, 1 AllocationRun |
| IT-06 | Lottery rerun | đã có AllocationRun | `409`, không thay đổi kết quả cũ |
| IT-07 | UC06 cancel confirmed | waitlist có người | ticket cũ CANCELLED, người đầu waitlist CONFIRMED + ticket mới |
| IT-08 | Cancel waitlisted | user đang WAITLISTED | Registration/entry CANCELLED, không promote người khác |
| IT-09 | UC14 check-in | Ticket VALID đúng session | 1 CheckIn + Ticket USED |
| IT-10 | Check-in lần 2 | Ticket USED | bị từ chối, vẫn chỉ 1 CheckIn |
| IT-11 | Check-in sai session | ticket thuộc session khác | bị từ chối |
| IT-12 | Cancel Session | có PENDING/WAITLISTED/CONFIRMED + VALID tickets | registrations active -> CANCELLED, VALID tickets -> CANCELLED |

## 3. Concurrency tests bắt buộc
| ID | Tình huống | Cách kích hoạt | Invariant cần chứng minh |
|---|---|---|---|
| CT-01 | FCFS slot cuối | 2 request đồng thời tranh 1 slot | chỉ 1 CONFIRMED; request còn lại WAITLISTED |
| CT-02 | Duplicate request cùng user | 2 request đồng thời cùng attendee/session | chỉ 1 Registration do unique constraint |
| CT-03 | Check-in đồng thời | 2 request cùng ticketCode | chỉ 1 CheckIn; Ticket USED |
| CT-04 | Hủy + đăng ký/promote đồng thời | cancel confirmed khi queue có người | confirmed count không vượt capacity; không cấp 2 ticket cho cùng registration |
| CT-05 | Hai Lottery run đồng thời | 2 POST allocation cùng session | chỉ 1 AllocationRun commit do lock + unique session_id |

## 4. Anti-bot / Authorization tests
| ID | Tình huống | Kỳ vọng |
|---|---|---|
| SEC-01 | user chưa đăng nhập gọi register | `401` |
| SEC-02 | account LOCKED gọi register | từ chối |
| SEC-03 | vượt rate limit register | `429` |
| SEC-04 | Organizer A sửa Event của Organizer B | `403` |
| SEC-05 | Attendee A hủy Registration của B | `403` hoặc `404` theo policy chống enumeration |
| SEC-06 | role ATTENDEE gọi Lottery allocation | `403` |
| SEC-07 | role ATTENDEE gọi check-in | `403` |

## 5. Accessibility / Search tests
| ID | Tình huống | Kỳ vọng |
|---|---|---|
| ACC-01 | Event có WHEELCHAIR_ACCESS | filter theo feature trả về Event |
| ACC-02 | Event không có feature yêu cầu | không nằm trong kết quả filter |
| ACC-03 | UI control chính | có label/keyboard navigation cơ bản |

## 6. Exit criteria trước demo cuối kỳ
- Toàn bộ test bảo vệ invariant phải pass.
- Không có test concurrency nào cho phép oversell hoặc double check-in.
- Luồng chính UC05, UC06, UC12, UC14 có integration/E2E test.
- Authorization theo ownership/role có test âm tính.
- Docker Compose khởi động được frontend, backend, PostgreSQL và object storage dev/test.
