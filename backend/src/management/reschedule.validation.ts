import { BadRequestException } from '@nestjs/common';
import { asObject, requiredText } from './management.validation';

function iso(value: unknown, key: string): Date {
  if (typeof value !== 'string'
      || !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/i.test(value)) {
    throw new BadRequestException(key + ' phải là ISO 8601 có múi giờ');
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new BadRequestException(key + ' không hợp lệ');
  return parsed;
}

export function rescheduleInput(body: unknown) {
  const obj = asObject(body);
  if (Object.keys(obj).some(key => !['startsAt','endsAt','reason'].includes(key))) {
    throw new BadRequestException('Chỉ được thay đổi thời gian và lý do');
  }
  const startsAt = iso(obj.startsAt,'startsAt');
  const endsAt = iso(obj.endsAt,'endsAt');
  const reason = requiredText(obj,'reason',500);
  if (reason.length < 10) throw new BadRequestException('Lý do cần tối thiểu 10 ký tự');
  if (startsAt >= endsAt) throw new BadRequestException('Giờ kết thúc phải sau giờ bắt đầu');
  return { startsAt, endsAt, reason };
}
