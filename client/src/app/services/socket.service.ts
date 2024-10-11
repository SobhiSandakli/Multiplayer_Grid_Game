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

    // Créer une session
    createSession(maxPlayers: number): void {
        this.socket.emit('createSession', { maxPlayers });
    }

    // Écouter la création de session
    onSessionCreated(): Observable<any> {
        return fromEvent(this.socket, 'sessionCreated');
    }

    createCharacter(sessionCode: string | null, characterData: any): void {
        console.log('Emitting createCharacter event:', { sessionCode, characterData });
        this.socket.emit('createCharacter', { sessionCode, characterData });
    }

    // Écouter la confirmation de création du personnage
    onCharacterCreated(): Observable<any> {
        return fromEvent(this.socket, 'characterCreated');
    }
}
