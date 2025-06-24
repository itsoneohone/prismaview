import { Module } from '@nestjs/common';
import { EventsGateway } from '@events/events.gateway';
import { EventsService } from '@events/events.service';

@Module({
  providers: [EventsGateway, EventsService],
  exports: [EventsService],
})
export class EventsModule {}
