import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { Message, SessionCreatedData } from '@app/interfaces/socket.interface';
import { Observable, fromEvent } from 'rxjs';
@Injectable({
    providedIn: 'root',
})
export class SessionSocket {
    constructor(private socketService: SocketService) {}

    onSessionCreated(): Observable<SessionCreatedData> {
        return fromEvent(this.socketService.socket, 'sessionCreated');
    }

    deleteSession(sessionCode: string): void {
        this.socketService.socket.emit('deleteSession', { sessionCode });
    }
    createNewSession(maxPlayers: number, selectedGameID: string): Observable<SessionCreatedData> {
        this.socketService.socket.emit('createNewSession', { maxPlayers, selectedGameID });
        return fromEvent<SessionCreatedData>(this.socketService.socket, 'sessionCreated');
    }

    leaveSession(sessionCode: string): void {
        this.socketService.socket.emit('leaveSession', { sessionCode });
    }
    onSessionDeleted(): Observable<Message> {
        return fromEvent(this.socketService.socket, 'sessionDeleted');
    }
}
