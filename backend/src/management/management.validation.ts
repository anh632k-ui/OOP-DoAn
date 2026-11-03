import { BadRequestException } from '@nestjs/common';

export type Input = Record<string, unknown>;
export function asObject(value: unknown): Input {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Dữ liệu phải là đối tượng JSON');
  }
  return value as Input;
}
export function requiredText(obj: Input, key: string, max: number): string {
  const v = obj[key];
  if (typeof v !== 'string' || !v.trim() || v.trim().length > max) {
    throw new BadRequestException(key + ' phải là chuỗi không rỗng, tối đa ' + max + ' ký tự');
  }
  return v.trim();
}
export function description(obj: Input): string {
  const v = obj.description;
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string' || v.length > 4000) {
    throw new BadRequestException('Mô tả phải là chuỗi tối đa 4000 ký tự');
  }
  return v.trim();
}
export function optionalPatch(obj: Input): { title?: string; description?: string } {
  if (Object.keys(obj).some(k => k !== 'title' && k !== 'description')) {
    throw new BadRequestException('Chỉ cho phép sửa title và description');
  }
  if (!Object.keys(obj).length) throw new BadRequestException('Không có dữ liệu cập nhật');
  const result: { title?: string; description?: string } = {};
  if ('title' in obj) result.title = requiredText(obj, 'title', 200);
  if ('description' in obj) result.description = description(obj);
  return result;
}
export function uuid(value: unknown, key: string): string {
  if (typeof value !== 'string' ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) {
    throw new BadRequestException(key + ' không phải UUID hợp lệ');
  }
  return value;
}
export function sessionInput(value: unknown) {
  const obj = asObject(value);
  const venueId = uuid(obj.venueId, 'venueId');
  if (!Number.isInteger(obj.capacity) || (obj.capacity as number) <= 0
    || (obj.capacity as number) > 100000) {
    throw new BadRequestException('Sức chứa phải là số nguyên từ 1 đến 100000');
  }
  function date(key: string): Date {
    const v = obj[key];
    if (typeof v !== 'string' ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/i.test(v)) {
      throw new BadRequestException(key + ' phải là thời gian ISO 8601 có múi giờ');
    }
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) throw new BadRequestException(key + ' không hợp lệ');
    return d;
  }
  const startsAt = date('startsAt');
  const endsAt = date('endsAt');
  const registrationOpensAt = date('registrationOpensAt');
  const registrationClosesAt = date('registrationClosesAt');
  if (startsAt.getTime() <= Date.now() || endsAt <= startsAt
    || registrationClosesAt <= registrationOpensAt || registrationClosesAt > startsAt) {
    throw new BadRequestException('Thời gian suất hoặc thời gian đăng ký không hợp lệ');
  }
  return {
    venueId, capacity: obj.capacity as number, startsAt, endsAt,
    registrationOpensAt, registrationClosesAt,
  };
}
export function allocationMethod(value: unknown): 'FCFS' | 'LOTTERY' {
  const obj = asObject(value);
  if (obj.method !== 'FCFS' && obj.method !== 'LOTTERY') {
    throw new BadRequestException('Phương thức phải là FCFS hoặc LOTTERY');
  }
  return obj.method;
}
export function verifiedAccessibility(value: unknown) {
  const obj = asObject(value);
  if (obj.verified !== true) {
    throw new BadRequestException('Ban tổ chức phải xác nhận các đặc tính đã được kiểm chứng');
  }
  if (!Array.isArray(obj.featureIds) || obj.featureIds.length > 20) {
    throw new BadRequestException('featureIds phải là mảng tối đa 20 phần tử');
  }
  const ids: string[] = obj.featureIds.map(v => uuid(v, 'featureId'));
  if (new Set(ids).size !== ids.length) {
    throw new BadRequestException('Danh sách đặc tính không được trùng');
  }
  const note = obj.note === undefined ? '' : obj.note;
  if (typeof note !== 'string' || note.length > 500) {
    throw new BadRequestException('Ghi chú quá dài');
  }
  return { ids, note: note.trim() };
}
