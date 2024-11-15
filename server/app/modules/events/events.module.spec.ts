import { Test, TestingModule } from '@nestjs/testing';
import { EventsModule } from './events.module';
import { EventsGateway } from '@app/gateways/events/events.gateway';

describe('EventsModule', () => {
    let module: TestingModule;
    let eventsGateway: EventsGateway;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [EventsModule],
        }).compile();

        eventsGateway = module.get<EventsGateway>(EventsGateway);
    });

    it('should compile the module', () => {
        expect(module).toBeDefined();
    });

    it('should provide EventsGateway', () => {
        expect(eventsGateway).toBeDefined();
    });
});