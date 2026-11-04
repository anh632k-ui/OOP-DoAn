import {
  Body, Controller, Get, Param, ParseUUIDPipe,
  Post, Req, UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CheckinService } from './checkin.service';

@Controller('checkin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CHECKIN', 'ADMIN')
export class CheckinController {
  constructor(private readonly checkin: CheckinService) {}

  @Post('scan')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  scan(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.checkin.scan(body, req.user!);
  }

  @Get('sessions/:id/stats')
  stats(@Param('id', ParseUUIDPipe) id: string) {
    return this.checkin.stats(id);
  }
}
