import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(@Query('q') q?: string, @Query('featureId') featureId?: string) {
    return this.events.listPublished(q, featureId);
  }

  @Get('accessibility/options')
  accessibilityOptions() {
    return this.events.accessibilityOptions();
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.events.getPublished(id);
  }

  @Get(':id/sessions')
  sessions(@Param('id', ParseUUIDPipe) id: string) {
    return this.events.listSessions(id);
  }
}
