import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VIETNAM_TIME_ZONE, formatVietnamDate, toHanoiInput, hanoiInputToIso,
} from '../lib/vietnam-time.ts';
import { labelStatus } from '../lib/status-label.ts';

test('Hanoi IANA timezone is UTC+7 for Vietnam', () => {
  assert.equal(VIETNAM_TIME_ZONE, 'Asia/Ho_Chi_Minh');
  assert.equal(toHanoiInput('2026-12-05T16:05:00.000Z'), '2026-12-05T23:05');
  assert.equal(toHanoiInput('2026-12-05T17:05:00.000Z'), '2026-12-06T00:05');
  assert.equal(hanoiInputToIso('2026-12-06T00:05'), '2026-12-05T17:05:00.000Z');
});

test('Hanoi datetime-local input is independent of device timezone', () => {
  const previous = process.env.TZ;
  try {
    for (const zone of ['UTC', 'Asia/Shanghai', 'Pacific/Honolulu']) {
      process.env.TZ = zone;
      assert.equal(toHanoiInput('2026-12-05T16:05:00Z'), '2026-12-05T23:05');
      assert.equal(hanoiInputToIso('2026-12-05T23:05'), '2026-12-05T16:05:00.000Z');
      assert.match(formatVietnamDate('2026-12-05T16:05:00Z', 'short'), /23:05/);
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('Hanoi local date parser rejects malformed or impossible dates', () => {
  for (const value of ['2026-02-30T10:20', '2026-13-01T10:20', '2026-12-05T25:10', '2026-12-05 23:05']) {
    assert.throws(() => hanoiInputToIso(value));
  }
});

test('Vietnamese status labels do not alter business enum values', () => {
  assert.equal(labelStatus('DA_XAC_NHAN'), 'Đã xác nhận');
  assert.equal(labelStatus('CHO_PHAN_BO'), 'Chờ phân bổ vé');
  assert.equal(labelStatus('CHUA_SU_DUNG'), 'Chưa sử dụng');
});
