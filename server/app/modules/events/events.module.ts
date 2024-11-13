import { EventsGateway } from '@app/gateways/events/events.gateway';
import { Module } from '@nestjs/common';

@Module({
    providers: [EventsGateway],
    exports: [EventsGateway],
})
export class EventsModule {}
