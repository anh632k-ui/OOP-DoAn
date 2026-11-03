import { ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const ping = jest.fn<Promise<void>, []>();
  const database = { ping } as unknown as DatabaseService;
  const service = new HealthService(database);

  beforeEach(() => jest.resetAllMocks());

  it('reports the real database connection', async () => {
    ping.mockResolvedValue(undefined);
    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      service: 'med06-backend',
      database: 'connected',
    });
    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('returns 503 when PostgreSQL is unreachable', async () => {
    ping.mockRejectedValue(new Error('connection refused'));
    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
