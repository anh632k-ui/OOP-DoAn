import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const passwords = new PasswordService();

  it('uses a salted one-way scrypt hash', async () => {
    const a = await passwords.hash('ExamplePassword123');
    const b = await passwords.hash('ExamplePassword123');
    expect(a).not.toEqual(b);
    expect(a).not.toContain('ExamplePassword123');
    expect(await passwords.verify('ExamplePassword123', a)).toBe(true);
    expect(await passwords.verify('WrongPassword123', a)).toBe(false);
    expect(await passwords.verify('ExamplePassword123', null)).toBe(false);
  });

  it('rejects malformed password hashes', async () => {
    expect(await passwords.verify('anything', 'test:deadbeef')).toBe(false);
  });
});
