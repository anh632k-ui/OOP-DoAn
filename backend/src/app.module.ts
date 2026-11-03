import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { ManagementModule } from './management/management.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { CheckinModule } from './checkin/checkin.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    EventsModule,
    AuthModule,
    ManagementModule,
    RegistrationsModule,
    CheckinModule,
    MediaModule,
  ],
})
export class AppModule {}
