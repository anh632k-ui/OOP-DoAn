import { Module } from '@nestjs/common';
import { RegistrationsModule } from '../registrations/registrations.module';
import { AllocationsService } from './allocations.service';

@Module({
  imports: [RegistrationsModule],
  providers: [AllocationsService],
  exports: [AllocationsService],
})
export class AllocationsModule {}
