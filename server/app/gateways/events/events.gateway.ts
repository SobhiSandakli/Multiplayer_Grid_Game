import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
    namespace: '/events',
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingInterval: 120000,
    pingTimeout: 600000,
})
export class EventsGateway {
    @WebSocketServer()
    private server: Server;

    emitNewEvent(event: [string, string[]]) {
        this.server.emit('newEvent', event);
    }

    addEventToSession(sessionCode: string, message: string, names: string[]) {
        const event: [string, string[]] = [message, names];
        this.emitNewEvent(event);
    }
}
