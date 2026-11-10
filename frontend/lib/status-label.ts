/** UI labels only. API and database enum values are unchanged. */
const statuses: Record<string, string> = {
  NHAP: 'Bản nháp', DA_CONG_BO: 'Đã công bố', TAM_NGUNG: 'Tạm ngưng',
  MO_DANG_KY: 'Đang mở đăng ký', DONG_DANG_KY: 'Đã đóng đăng ký',
  HOAN_TAT: 'Đã hoàn tất', DA_HUY: 'Đã hủy',
  CHO_PHAN_BO: 'Chờ phân bổ vé', DANH_SACH_CHO: 'Trong danh sách chờ',
  DA_XAC_NHAN: 'Đã xác nhận', TU_CHOI: 'Bị từ chối',
  CHUA_SU_DUNG: 'Chưa sử dụng', DA_SU_DUNG: 'Đã sử dụng',
  VO_HIEU: 'Đã vô hiệu', DANG_CHO: 'Đang chờ',
  DA_DON_LEN: 'Đã được đôn lên', DA_RUT: 'Đã rút khỏi danh sách',
  HOAT_DONG: 'Đang hoạt động', KHOA: 'Đã khóa',
};
const roles: Record<string,string> = {
  ADMIN: 'Quản trị viên', ORGANIZER: 'Ban tổ chức',
  CHECKIN: 'Nhân viên check-in', ATTENDEE: 'Người tham dự',
};
export function labelStatus(value: string | null | undefined): string {
  if (!value) return 'Chưa xác định';
  return statuses[value] ?? value.replaceAll('_', ' ').toLowerCase();
}
export function labelRole(value: string): string { return roles[value] ?? value; }
