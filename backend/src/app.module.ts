import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { ManagementModule } from './management/management.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    EventsModule,
    AuthModule,
    ManagementModule,
  ],
})
export class AppModule {}
