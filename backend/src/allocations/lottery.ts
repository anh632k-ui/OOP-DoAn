import { createHmac } from 'node:crypto';

// Order is reproducible using the published seed. HMAC yields independent,
// uniformly-distributed 256-bit ranking values for different UUIDs.
export function lotteryOrder(ids: string[], hexSeed: string): string[] {
  const seed = Buffer.from(hexSeed, 'hex');
  if (seed.length !== 32 || !/^[0-9a-f]{64}$/i.test(hexSeed)) {
    throw new Error('Invalid lottery audit seed');
  }
  return [...ids].sort((a, b) => {
    const ha = createHmac('sha256', seed).update(a).digest('hex');
    const hb = createHmac('sha256', seed).update(b).digest('hex');
    return ha.localeCompare(hb) || a.localeCompare(b);
  });
}
