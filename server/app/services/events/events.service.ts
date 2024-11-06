import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingInterval: 120000, // Ping every 2 minutes
    pingTimeout: 600000, // Disconnect if no response within 10 minutes
})
export class EventsGateway {
    @WebSocketServer()
    private server: Server;

    constructor() {}

    emitNewEvent(event: [string, string[]]) {
        this.server.emit('newEvent', event); // Emit to all clients
    }

    addEventToSession(sessionCode: string, message: string, names: string[]) {
        const event: [string, string[]] = [message, names];
        this.emitNewEvent(event);
    }
}
