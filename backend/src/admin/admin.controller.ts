import {
  Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, Req, UseGuards,
} from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('audit')
  audit(@Query('page') page?: string, @Query('action') action?: string) {
    return this.service.listAudit(page, action);
  }

  @Get('organizer-requests')
  organizerRequests() {
    return this.service.listOrganizerRequests();
  }

  @Post('organizer-requests/:id/review')
  reviewOrganizerRequest(@Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.service.reviewOrganizerRequest(req.user!, id, body);
  }

  @Get('users')
  users(@Query('page') page?: string, @Query('q') q?: string) {
    return this.service.listUsers(page, q);
  }

  @Patch('users/:id/status')
  setStatus(@Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.service.setAccountLocked(req.user!, id, body);
  }

  @Put('users/:id/roles')
  updateRoles(@Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown) {
    return this.service.updateRoles(req.user!, id, body);
  }
}
