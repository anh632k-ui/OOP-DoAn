import {
  Body, Controller, Get, Param, ParseUUIDPipe,
  Patch, Post, Put, Query, Req, UseGuards,
} from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ManagementService } from './management.service';
import { OrganizerInsightsService } from './organizer-insights.service';
import { AllocationsService } from '../allocations/allocations.service';

@Controller('manage')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORGANIZER', 'ADMIN')
export class ManagementController {
  constructor(private readonly management: ManagementService,
    private readonly allocations: AllocationsService,
    private readonly insights: OrganizerInsightsService) {}

  @Get('events')
  events(@Req() req: AuthenticatedRequest) {
    return this.management.listEvents(req.user!);
  }
  @Post('events')
  createEvent(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.management.createEvent(req.user!, body);
  }
  @Patch('events/:id')
  updateEvent(@Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.management.updateEvent(req.user!, id, body);
  }
  @Post('events/:id/publish')
  publish(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.management.publishEvent(req.user!, id);
  }
  @Post('events/:id/cancel')
  cancel(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.management.cancelEmptyEvent(req.user!, id);
  }
  @Get('venues')
  venues() { return this.management.listVenues(); }
  @Post('venues')
  createVenue(@Body() body: unknown) { return this.management.createVenue(body); }
  @Get('events/:id/sessions')
  sessions(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.management.listSessions(req.user!, id);
  }
  @Post('events/:id/sessions')
  createSession(@Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.management.createSession(req.user!, id, body);
  }
  @Put('sessions/:id/policy')
  policy(@Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.management.setPolicy(req.user!, id, body);
  }
  @Get('sessions/:id/overview')
  overview(@Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('status') status?: string) {
    return this.insights.overview(req.user!, id, page, status);
  }

  @Post('sessions/:id/draw')
  draw(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.allocations.draw(req.user!, id);
  }

  @Get('sessions/:id/draw')
  drawReport(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.allocations.report(req.user!, id);
  }

  @Get('accessibility/options')
  accessibilityOptions() { return this.management.accessibilityOptions(); }
  @Put('events/:id/accessibility')
  accessibility(@Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.management.setAccessibility(req.user!, id, body);
  }
}
