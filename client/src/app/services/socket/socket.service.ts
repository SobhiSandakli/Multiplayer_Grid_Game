import { Injectable } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    private socket: Socket;

    constructor() {
        this.socket = io('http://localhost:3000');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onPlayerListUpdate(): Observable<any> {
        return fromEvent(this.socket, 'playerListUpdate');
    }
    getSocketId(): string {
        return this.socket.id ?? '';
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onExcluded(): Observable<any> {
        return fromEvent(this.socket, 'excluded');
    }
    joinRoom(room: string, name: string) {
        this.socket.emit('joinRoom', { room, name });
    }

    sendRoomMessage(room: string, message: string, sender: string) {
        this.socket.emit('roomMessage', { room, message, sender });
    }

    onRoomMessage(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on('roomMessage', (data) => {
                observer.next(data);
            });
        });
    }

    onMessage(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on('message', (data) => {
                observer.next(data);
            });
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSessionCreated(): Observable<any> {
        return fromEvent(this.socket, 'sessionCreated');
    }

    createCharacter(sessionCode: string, characterData: unknown): void {
        this.socket.emit('createCharacter', { sessionCode, characterData });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCharacterCreated(): Observable<any> {
        return fromEvent(this.socket, 'characterCreated');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    joinGame(secretCode: string): Observable<any> {
        this.socket.emit('joinGame', { secretCode });
        return fromEvent(this.socket, 'joinGameResponse');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getTakenAvatars(sessionCode: string): Observable<any> {
        this.socket.emit('getTakenAvatars', { sessionCode });
        return fromEvent(this.socket, 'takenAvatars');
    }

    deleteSession(sessionCode: string): void {
        this.socket.emit('deleteSession', { sessionCode });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createNewSession(maxPlayers: number, selectedGameID: string): Observable<any> {
        this.socket.emit('createNewSession', { maxPlayers, selectedGameID });
        return fromEvent(this.socket, 'sessionCreated');
    }

    leaveSession(sessionCode: string): void {
        this.socket.emit('leaveSession', { sessionCode });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSessionDeleted(): Observable<any> {
        return fromEvent(this.socket, 'sessionDeleted');
    }
    excludePlayer(sessionCode: string, playerSocketId: string): void {
        this.socket.emit('excludePlayer', { sessionCode, playerSocketId });
    }
    toggleRoomLock(sessionCode: string, lock: boolean): void {
        this.socket.emit('toggleLock', { sessionCode, lock });
    }
    onRoomLocked(): Observable<any> {
        return fromEvent(this.socket, 'roomLocked');
    }
}
