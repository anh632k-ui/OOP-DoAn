import { lotteryOrder } from './lottery';

describe('Lottery deterministic audit ordering', () => {
  const ids = [
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
  ];
  const seed = 'ff'.repeat(32);

  it('is deterministic irrespective of insertion order', () => {
    expect(lotteryOrder(ids, seed)).toEqual(lotteryOrder([...ids].reverse(), seed));
    expect(new Set(lotteryOrder(ids, seed)).size).toBe(ids.length);
  });
  it('rejects malformed audit seeds', () => {
    expect(() => lotteryOrder(ids, 'bad')).toThrow();
  });
}
