import {
  BadRequestException, ConflictException, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { PasswordService } from './password.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const transaction = jest.fn();
  const queryRows = jest.fn();
  const password = new PasswordService();
  const signAsync = jest.fn().mockResolvedValue('signed-test-token');
  const service = new AuthService(
    { transaction, queryRows } as unknown as DatabaseService,
    password,
    { signAsync } as unknown as JwtService,
  );
  const user = {
    id: '20000000-0000-4000-8000-000000000012',
    email: 'new@example.invalid',
    name: 'New user',
    roles: ['ATTENDEE'],
  };

  beforeEach(() => {
    jest.resetAllMocks();
    signAsync.mockResolvedValue('signed-test-token');
  });

  it('registers without allowing users to select privileged roles', async () => {
    const query = jest.fn().mockResolvedValueOnce({
      rows: [{ id: user.id }],
    }).mockResolvedValueOnce({ rowCount: 1, rows: [{ ma_vai_tro: 'role' }] });
    transaction.mockImplementation(async (cb) => cb({ query }));
    queryRows.mockResolvedValue([user]);

    const result = await service.register({
      email: ' NEW@example.invalid ',
      name: 'New user',
      password: 'ExamplePassword123',
      roles: ['ADMIN'],
    });
    expect(result.user.roles).toEqual(['ATTENDEE']);
    expect(query.mock.calls[0][1][0]).toBe('new@example.invalid');
    expect(query.mock.calls[1][0]).toContain("ten_vai_tro='ATTENDEE'");
  });

  it('rejects duplicate emails', async () => {
    transaction.mockRejectedValue({ code: '23505' });
    await expect(service.register({
      email: 'new@example.invalid', name: 'New',
      password: 'ExamplePassword123',
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('enforces password strength', async () => {
    await expect(service.register({
      email: 'new@example.invalid', name: 'New', password: '123',
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('logs in with a matching password hash', async () => {
    const passwordHash = await password.hash('ExamplePassword123');
    queryRows.mockResolvedValueOnce([{ id: user.id, passwordHash }]);
    queryRows.mockResolvedValueOnce([user]);
    const result = await service.login({
      email: 'new@example.invalid', password: 'ExamplePassword123',
    });
    expect(result.accessToken).toBe('signed-test-token');
    expect(result.user.email).toBe('new@example.invalid');
  });

  it('rejects incorrect passwords', async () => {
    const passwordHash = await password.hash('ExamplePassword123');
    queryRows.mockResolvedValueOnce([{ id: user.id, passwordHash }]);
    await expect(service.login({
      email: 'new@example.invalid', password: 'InvalidPassword123',
    })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
