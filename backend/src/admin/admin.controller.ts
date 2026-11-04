import {
  Body, Controller, Get, Param, ParseUUIDPipe, Put, Query, Req, UseGuards,
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

  @Get('users')
  users(@Query('page') page?: string, @Query('q') q?: string) {
    return this.service.listUsers(page, q);
  }

  @Put('users/:id/roles')
  updateRoles(@Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown) {
    return this.service.updateRoles(req.user!, id, body);
  }
}
