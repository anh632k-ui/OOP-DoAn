import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { RegistrationsController, TicketsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { AccountThrottlerGuard } from './account-throttler.guard';

@Module({
  imports: [AuthModule, ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])],
  providers: [RegistrationsService, AccountThrottlerGuard],
  controllers: [RegistrationsController, TicketsController],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
