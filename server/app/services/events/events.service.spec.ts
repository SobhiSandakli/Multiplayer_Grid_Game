/* eslint-disable  @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';
import { EventsGateway } from './events.service';

describe('EventsGateway', () => {
    let gateway: EventsGateway;
    let mockServer: Partial<Server>;

    beforeEach(async () => {
        mockServer = {
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsGateway,
                {
                    provide: Server,
                    useValue: mockServer,
                },
            ],
        }).compile();

        gateway = module.get<EventsGateway>(EventsGateway);
        (gateway as any).server = mockServer;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should emit a new event to all clients', () => {
        const event: [string, string[]] = ['Test message', ['Player1', 'Player2']];

        gateway.emitNewEvent(event);

        expect(mockServer.emit).toHaveBeenCalledWith('newEvent', event);
    });

    it('should call emitNewEvent when addEventToSession is called', () => {
        const spy = jest.spyOn(gateway, 'emitNewEvent');
        const sessionCode = 'testSession';
        const message = 'Test event message';
        const names = ['Player1', 'Player2'];

        gateway.addEventToSession(sessionCode, message, names);
        expect(spy).toHaveBeenCalledWith([message, names]);
    });
});
