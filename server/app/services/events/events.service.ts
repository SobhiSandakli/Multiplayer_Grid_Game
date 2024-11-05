import { Server } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { SessionsService } from '@app/services/sessions/sessions.service';


@Injectable()
export class EventsService {
    sessionsService: any;
    constructor(private readonly server: Server) {}

    addNewEvent(sessionCode: string, message: string, names: string[]) {
        const newEvent = [message, names];
        
        // Find the session and update events
        const session = this.sessionsService.getSession(sessionCode);
        if (session) {
            session.events.push(newEvent);

            // Emit the new event to all clients in the session
            this.server.to(sessionCode).emit('newEvent', newEvent);
        }
    }
}