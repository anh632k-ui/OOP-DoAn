/**
 * MED-06 operates on Hanoi time (UTC+07:00). Asia/Ho_Chi_Minh is the
 * canonical IANA timezone for all of Vietnam, including Hanoi.
 * Store instants as ISO/UTC; display and parse wall times consistently.
 */
export const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const HANOI_OFFSET_MS = 7 * 60 * 60 * 1000;

export function formatVietnamDate(
  value: string | Date | null | undefined,
  style: 'short' | 'medium' | 'full' = 'medium',
): string {
  if (!value) return 'Chưa có lịch';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Thời gian không hợp lệ';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: style, timeStyle: 'short',
    timeZone: VIETNAM_TIME_ZONE, hourCycle: 'h23',
  }).format(date);
}

/** ISO UTC instant -> value for a datetime-local field in Hanoi time. */
export function toHanoiInput(instant: string | Date): string {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) throw new Error('Thời gian không hợp lệ');
  return new Date(date.getTime() + HANOI_OFFSET_MS).toISOString().slice(0, 16);
}

/** Treat a datetime-local value as Hanoi wall time regardless of device TZ. */
export function hanoiInputToIso(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new Error('Ngày giờ phải có dạng YYYY-MM-DDTHH:mm (giờ Hà Nội)');
  }
  const date = new Date(value + ':00+07:00');
  if (Number.isNaN(date.getTime()) || toHanoiInput(date) !== value) {
    throw new Error('Ngày giờ Hà Nội không hợp lệ');
  }
  return date.toISOString();
}
