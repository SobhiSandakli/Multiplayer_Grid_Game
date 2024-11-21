import { Injectable } from '@angular/core';
import { Message, RoomLockedResponse, SessionCreatedData } from '@app/interfaces/socket.interface';
import { Observable, fromEvent } from 'rxjs';
import { SocketService } from './socket.service';
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
    createNewSession(maxPlayers: number, selectedGameID: string, mode: string): Observable<SessionCreatedData> {
        this.socketService.socket.emit('createNewSession', { maxPlayers, selectedGameID, mode });
        return fromEvent<SessionCreatedData>(this.socketService.socket, 'sessionCreated');
    }

    leaveSession(sessionCode: string): void {
        this.socketService.socket.emit('leaveSession', { sessionCode });
    }
    onSessionDeleted(): Observable<Message> {
        return fromEvent(this.socketService.socket, 'sessionDeleted');
    }
    toggleRoomLock(sessionCode: string, lock: boolean): void {
        this.socketService.socket.emit('toggleLock', { sessionCode, lock });
    }
    onRoomLocked(): Observable<RoomLockedResponse> {
        return fromEvent(this.socketService.socket, 'roomLocked');
    }
    onExcluded(): Observable<Message> {
        return fromEvent(this.socketService.socket, 'excluded');
    }
    excludePlayer(sessionCode: string, playerSocketId: string): void {
        this.socketService.socket.emit('excludePlayer', { sessionCode, playerSocketId });
    }
    createVirtualPlayer(sessionCode: string, playerType: string): void {
        this.socketService.socket.emit('createVirtualPlayer', { sessionCode, playerType });
    }
    toggleDebugMode(sessionCode: string): void {
        this.socketService.socket.emit('toggleDebugMode', { sessionCode });
    }
    onDebugModeToggled(): Observable<{ isDebugMode: boolean }> {
        return fromEvent<{ isDebugMode: boolean }>(this.socketService.socket, 'debugModeToggled');
    }
}
