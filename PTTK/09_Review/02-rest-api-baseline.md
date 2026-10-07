# REST API - Mốc thiết kế MED-06 (bản tiếng Việt)

Tài liệu khóa tên đường dẫn sơ bộ giữa PTTK và phía máy chủ NestJS. Đường dẫn dùng tiếng Việt không dấu để đồng bộ với nhánh TV.

## 1. Xác thực / Người dùng
| Phương thức | Đường dẫn | Tác nhân | Mục đích |
|---|---|---|---|
| POST | `/xac-thuc/dang-ky` | Khách | Tạo tài khoản người tham dự |
| POST | `/xac-thuc/dang-nhap` | Khách | Đăng nhập |
| GET | `/toi` | Người dùng đã đăng nhập | Xem thông tin tài khoản hiện tại |
| PATCH | `/quan-tri/nguoi-dung/{maNguoiDung}/trang-thai` | Quản trị viên | Khóa/mở khóa tài khoản |

## 2. Sự kiện / Tìm kiếm / Hỗ trợ tiếp cận
| Phương thức | Đường dẫn | Tác nhân | Ca sử dụng |
|---|---|---|---|
| GET | `/su-kien` | Công khai | UC03 - danh sách/tìm kiếm/lọc |
| GET | `/su-kien/{maSuKien}` | Công khai | UC04 - chi tiết sự kiện + suất + hỗ trợ tiếp cận |
| POST | `/su-kien` | Ban tổ chức | UC09 - tạo sự kiện NHÁP |
| PATCH | `/su-kien/{maSuKien}` | Ban tổ chức sở hữu | UC09 - cập nhật sự kiện |
| POST | `/su-kien/{maSuKien}/cong-bo` | Ban tổ chức sở hữu | UC11 - công bố sự kiện |
| POST | `/su-kien/{maSuKien}/huy` | Ban tổ chức sở hữu | UC11 - hủy sự kiện |
| PUT | `/su-kien/{maSuKien}/ho-tro-tiep-can` | Ban tổ chức sở hữu | UC10 - gán đặc tính hỗ trợ tiếp cận |

## 3. Suất sự kiện
| Phương thức | Đường dẫn | Tác nhân | Ca sử dụng |
|---|---|---|---|
| POST | `/su-kien/{maSuKien}/suat` | Ban tổ chức sở hữu | UC10 - tạo suất |
| PATCH | `/suat/{maSuat}` | Ban tổ chức sở hữu | UC10 - cập nhật suất |
| POST | `/suat/{maSuat}/dang-ky/mo` | Ban tổ chức sở hữu | UC11 - mở đăng ký |
| POST | `/suat/{maSuat}/dang-ky/dong` | Ban tổ chức sở hữu | UC11 - đóng đăng ký |
| POST | `/suat/{maSuat}/huy` | Ban tổ chức sở hữu | UC10 - hủy suất và cập nhật dây chuyền |

## 4. Đăng ký / Danh sách chờ / Vé
| Phương thức | Đường dẫn | Tác nhân | Ca sử dụng |
|---|---|---|---|
| POST | `/suat/{maSuat}/dang-ky` | Người tham dự | UC05 - đăng ký suất |
| DELETE | `/dang-ky/{maDangKy}` | Người tham dự sở hữu | UC06 - hủy đăng ký |
| GET | `/toi/dang-ky` | Người tham dự | UC07 - xem đăng ký + danh sách chờ |
| GET | `/toi/ve` | Người tham dự | UC08 - xem vé điện tử |
| GET | `/toi/ve/{maVe}` | Người tham dự sở hữu | UC08 - chi tiết/QR vé |

## 5. Phân bổ / Thống kê
| Phương thức | Đường dẫn | Tác nhân | Ca sử dụng |
|---|---|---|---|
| POST | `/suat/{maSuat}/phan-bo` | Ban tổ chức sở hữu | UC12 - chạy phân bổ LOTTERY |
| GET | `/suat/{maSuat}/phan-bo` | Ban tổ chức sở hữu | UC12/13 - xem kết quả phân bổ |
| GET | `/suat/{maSuat}/thong-ke` | Ban tổ chức sở hữu | UC13 - số đăng ký/vé/danh sách chờ/check-in |

> FCFS không có đường dẫn phân bổ theo lô riêng; được xử lý ngay khi gọi đăng ký suất.

## 6. Check-in
| Phương thức | Đường dẫn | Tác nhân | Ca sử dụng |
|---|---|---|---|
| POST | `/check-in` | Nhân viên check-in | UC14 - dữ liệu gồm mã suất, mã vé, phương thức |
| GET | `/suat/{maSuat}/check-in` | Ban tổ chức sở hữu / Quản trị viên | UC13/15 - xem lịch sử check-in |

## 7. Quy ước mã HTTP
- `200 OK`: đọc/cập nhật thành công.
- `201 Created`: tạo tài nguyên thành công.
- `204 No Content`: lệnh thành công nhưng không cần nội dung phản hồi.
- `400 Bad Request`: dữ liệu gửi lên không hợp lệ.
- `401 Unauthorized`: chưa đăng nhập hoặc thông tin xác thực không hợp lệ.
- `403 Forbidden`: sai vai trò hoặc không có quyền sở hữu.
- `404 Not Found`: tài nguyên không tồn tại.
- `409 Conflict`: đăng ký trùng, lần phân bổ đã tồn tại hoặc xung đột trạng thái.
- `429 Too Many Requests`: vượt giới hạn tần suất.

## 8. Quy ước hiện thực
1. Bộ điều khiển chỉ xử lý dữ liệu truyền vào/xác thực và gọi dịch vụ.
2. Kiểm tra quyền sở hữu nằm trong lớp dịch vụ hoặc truy vấn kho dữ liệu phù hợp.
3. UC05 FCFS, UC06 chọn người chờ, UC12 LOTTERY và UC14 check-in phải có biên giao dịch rõ.
4. Đường dẫn khi code phải bám tài liệu này hoặc cập nhật lại PTTK nếu thay đổi.
5. DTO/API có thể chi tiết hơn nhưng không làm thay đổi ý nghĩa nghiệp vụ đã khóa.
