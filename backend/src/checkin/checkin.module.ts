import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { StaffModule } from '../staff/staff.module';
import { CheckinController } from './checkin.controller';
import { CheckinService } from './checkin.service';

@Module({
  imports: [AuthModule, StaffModule, ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])],
  providers: [CheckinService],
  controllers: [CheckinController],
})
export class CheckinModule {}
