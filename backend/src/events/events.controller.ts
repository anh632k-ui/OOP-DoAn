import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list() {
    return this.events.listPublished();
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
