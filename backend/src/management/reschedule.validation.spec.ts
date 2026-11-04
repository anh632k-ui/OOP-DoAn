import { BadRequestException } from '@nestjs/common';
import { rescheduleInput } from './reschedule.validation';

describe('reschedule validation', () => {
  it('requires timezone and a meaningful reason', () => {
    expect(() => rescheduleInput({
      startsAt: '2030-06-01T12:00',
      endsAt: '2030-06-01T13:00:00Z',
      reason: 'A genuine schedule change',
    })).toThrow(BadRequestException);
    expect(() => rescheduleInput({
      startsAt: '2030-06-01T12:00:00Z',
      endsAt: '2030-06-01T13:00:00Z',
      reason: 'short',
    })).toThrow(BadRequestException);
  });

  it('rejects inverted times and extra unvalidated fields', () => {
    expect(() => rescheduleInput({
      startsAt: '2030-06-01T13:00:00Z',
      endsAt: '2030-06-01T12:00:00Z',
      reason: 'Need to change opening hours',
    })).toThrow(BadRequestException);
    expect(() => rescheduleInput({
      startsAt: '2030-06-01T12:00:00Z',
      endsAt: '2030-06-01T13:00:00Z',
      reason: 'Need to change opening hours',
      capacity: 999999,
    })).toThrow(BadRequestException);
  });

  it('normalizes ISO timezones to Date objects', () => {
    const input = rescheduleInput({
      startsAt: '2030-06-01T19:00:00+07:00',
      endsAt: '2030-06-01T20:30:00+07:00',
      reason: 'A confirmed change in opening hours',
    });
    expect(input.startsAt.toISOString()).toBe('2030-06-01T12:00:00.000Z');
    expect(input.endsAt.toISOString()).toBe('2030-06-01T13:30:00.000Z');
  });
});
