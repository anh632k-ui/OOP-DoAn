import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AllocationsModule } from '../allocations/allocations.module';
import { ManagementController } from './management.controller';
import { ManagementService } from './management.service';
import { OrganizerInsightsService } from './organizer-insights.service';

@Module({
  imports: [AuthModule, AllocationsModule],
  controllers: [ManagementController],
  providers: [ManagementService, OrganizerInsightsService],
})
export class ManagementModule {}
