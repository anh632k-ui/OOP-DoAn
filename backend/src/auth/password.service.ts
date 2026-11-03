import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(nodeScrypt);
const HASH_LENGTH = 64;

@Injectable()
export class PasswordService {
  private async derive(password: string, salt: Buffer): Promise<Buffer> {
    return (await scrypt(password, salt, HASH_LENGTH, {
      N: 16384,
      r: 8,
      p: 1,
      maxmem: 64 * 1024 * 1024,
    })) as Buffer;
  }

  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const hash = await this.derive(password, salt);
    return ['scrypt', salt.toString('hex'), hash.toString('hex')].join('$');
  }

  async verify(password: string, encoded: string | null): Promise<boolean> {
    if (!encoded) return false;
    const [algorithm, saltHex, hashHex, extra] = encoded.split('$');
    if (algorithm !== 'scrypt' || extra !== undefined
      || !/^[0-9a-f]{32}$/.test(saltHex ?? '')
      || !/^[0-9a-f]{128}$/.test(hashHex ?? '')) {
      return false;
    }
    const actual = await this.derive(password, Buffer.from(saltHex, 'hex'));
    return timingSafeEqual(actual, Buffer.from(hashHex, 'hex'));
  }
}
