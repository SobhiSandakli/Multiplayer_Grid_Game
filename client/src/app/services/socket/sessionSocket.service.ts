import { Injectable } from '@angular/core';
import { GameInfo, Message, PlayerListUpdate, SessionCreatedData } from '@app/interfaces/socket.interface';
import { environment } from '@environments/environment';
import { fromEvent, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root',
})
export class SessionSocket {
    private socket: Socket;
    private gameInfoSubject = new Subject<GameInfo>();
    constructor() {
        this.socket = io(environment.serverUrl);
        this.socket.on('getGameInfo', (data: GameInfo) => {
            this.gameInfoSubject.next(data);
        });
    }
    onPlayerListUpdate(): Observable<PlayerListUpdate> {
        return fromEvent(this.socket, 'playerListUpdate');
    }
    getSocketId(): string {
        return this.socket.id ?? '';
    }
    onExcluded(): Observable<Message> {
        return fromEvent(this.socket, 'excluded');
    }
    onSessionCreated(): Observable<SessionCreatedData> {
        return fromEvent(this.socket, 'sessionCreated');
    }

    deleteSession(sessionCode: string): void {
        this.socket.emit('deleteSession', { sessionCode });
    }
    createNewSession(maxPlayers: number, selectedGameID: string): Observable<SessionCreatedData> {
        this.socket.emit('createNewSession', { maxPlayers, selectedGameID });
        return fromEvent<SessionCreatedData>(this.socket, 'sessionCreated');
    }

    leaveSession(sessionCode: string): void {
        this.socket.emit('leaveSession', { sessionCode });
    }
    onSessionDeleted(): Observable<Message> {
        return fromEvent(this.socket, 'sessionDeleted');
    }
    onGameInfo(sessionCode: string): Observable<GameInfo> {
        this.socket.emit('getGameInfo', { sessionCode });
        return fromEvent<GameInfo>(this.socket, 'getGameInfo');
    }
}
