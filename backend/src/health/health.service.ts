import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseService) {}

  async check(): Promise<{ status: string; service: string; database: string }> {
    try {
      await this.database.ping();
      return { status: 'ok', service: 'med06-backend', database: 'connected' };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'med06-backend',
        database: 'disconnected',
      });
    }
  }
}
