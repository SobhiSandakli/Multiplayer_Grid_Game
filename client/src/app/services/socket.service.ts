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
        this.socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });  
    }
    onPlayerListUpdate(): Observable<any> {
        return fromEvent(this.socket, 'playerListUpdate');
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

    onSessionCreated(): Observable<any> {
        return fromEvent(this.socket, 'sessionCreated');
    }

    createCharacter(sessionCode: string, characterData: any): void {
        console.log('Emitting createCharacter event:', { sessionCode, characterData }); // FOR TESTS - TO BE REMOVED
        this.socket.emit('createCharacter', { sessionCode, characterData });
    }

    onCharacterCreated(): Observable<any> {
        return fromEvent(this.socket, 'characterCreated');
    }
    joinGame(secretCode: string): Observable<any> {
        this.socket.emit('joinGame', { secretCode });
        return fromEvent(this.socket, 'joinGameResponse');
    }

    getTakenAvatars(sessionCode: string): Observable<any> {
        this.socket.emit('getTakenAvatars', { sessionCode });
        return fromEvent(this.socket, 'takenAvatars');
    }

    deleteSession(sessionCode: string): void {
        this.socket.emit('deleteSession', { sessionCode });
    }

    createNewSession(maxPlayers: number, selectedGameID: string): Observable<any> {
        this.socket.emit('createNewSession', { maxPlayers, selectedGameID });
        return fromEvent(this.socket, 'sessionCreated');
    }

    leaveSession(sessionCode: string): void {
        this.socket.emit('leaveSession', { sessionCode });
    }

    onSessionDeleted(): Observable<any> {
        return fromEvent(this.socket, 'sessionDeleted');
    }
}
