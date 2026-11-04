import {
  Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AccountThrottlerGuard } from './account-throttler.guard';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RegistrationsService } from './registrations.service';

@Controller('registrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ATTENDEE')
export class RegistrationsController {
  constructor(private readonly service: RegistrationsService) {}

  @Post('sessions/:sessionId')
  @UseGuards(AccountThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Req() req: AuthenticatedRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.service.register(req.user!, sessionId);
  }

  @Get('mine')
  mine(@Req() req: AuthenticatedRequest) {
    return this.service.myRegistrations(req.user!);
  }

  @Post(':id/cancel')
  @UseGuards(AccountThrottlerGuard)
  cancel(@Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(req.user!, id);
  }
}

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ATTENDEE')
export class TicketsController {
  constructor(private readonly service: RegistrationsService) {}

  @Get('mine')
  mine(@Req() req: AuthenticatedRequest) {
    return this.service.myTickets(req.user!);
  }
}
