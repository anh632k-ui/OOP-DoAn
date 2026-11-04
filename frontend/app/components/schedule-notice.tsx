type Props = {
  scheduleChangedAt?: string | null;
  previousStartsAt?: string | null;
  scheduleChangeReason?: string | null;
};
const DATE = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'full', timeStyle: 'short',
});

export default function ScheduleNotice({
  scheduleChangedAt, previousStartsAt, scheduleChangeReason,
}: Props) {
  if (!scheduleChangedAt) return null;
  return <aside role="status" className="schedule-notice">
    <strong>Thông báo thay đổi lịch tổ chức</strong>
    <p>Ban tổ chức cập nhật lúc {DATE.format(new Date(scheduleChangedAt))}.</p>
    {previousStartsAt && <p>Giờ bắt đầu trước đây:
      {' '}{DATE.format(new Date(previousStartsAt))}</p>}
    <p>Lý do: {scheduleChangeReason ?? 'Ban tổ chức đã thay đổi lịch'}</p>
    <p className="note">Vui lòng kiểm tra lại thời gian mới trước khi tham dự.</p>
  </aside>;
}
