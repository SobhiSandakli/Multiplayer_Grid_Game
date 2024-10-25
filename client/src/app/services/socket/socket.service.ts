import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { fromEvent, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import {
    PlayerListUpdate,
    Message,
    SessionCreatedData,
    CharacterCreatedData,
    JoinGameResponse,
    TakenAvatarsResponse,
    RoomLockedResponse,
} from '@app/interfaces/socket.interface';
import { CharacterInfo } from '@app/interfaces/attributes.interface';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    private socket: Socket;

    constructor() {
        this.socket = io(environment.serverUrl);
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
    joinRoom(room: string, name: string, showSystemMessage: boolean) {
        this.socket.emit('joinRoom', { room, name, showSystemMessage });
    }
    sendRoomMessage(room: string, message: string, sender: string) {
        this.socket.emit('roomMessage', { room, message, sender });
    }

    onRoomMessage(): Observable<string> {
        return new Observable((observer) => {
            this.socket.on('roomMessage', (data) => {
                observer.next(data);
            });
        });
    }

    onMessage(): Observable<string> {
        return new Observable((observer) => {
            this.socket.on('message', (data) => {
                observer.next(data);
            });
        });
    }
    onSessionCreated(): Observable<SessionCreatedData> {
        return fromEvent(this.socket, 'sessionCreated');
    }

    createCharacter(sessionCode: string, characterData: CharacterInfo): void {
        this.socket.emit('createCharacter', { sessionCode, characterData });
    }
    onCharacterCreated(): Observable<CharacterCreatedData & { gameId: string }> {
        return fromEvent<CharacterCreatedData & { gameId: string }>(this.socket, 'characterCreated');
    }
    joinGame(secretCode: string): Observable<JoinGameResponse> {
        this.socket.emit('joinGame', { secretCode });
        return fromEvent(this.socket, 'joinGameResponse');
    }
    getTakenAvatars(sessionCode: string): Observable<TakenAvatarsResponse> {
        this.socket.emit('getTakenAvatars', { sessionCode });
        return fromEvent<TakenAvatarsResponse>(this.socket, 'takenAvatars');
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

    excludePlayer(sessionCode: string, playerSocketId: string): void {
        this.socket.emit('excludePlayer', { sessionCode, playerSocketId });
    }
    toggleRoomLock(sessionCode: string, lock: boolean): void {
        this.socket.emit('toggleLock', { sessionCode, lock });
    }
    onRoomLocked(): Observable<RoomLockedResponse> {
        return fromEvent(this.socket, 'roomLocked');
    }
    emitStartGame(sessionCode: string): void {
        this.socket.emit('startGame', { sessionCode });
    }
    onGameStarted(): Observable<{ sessionCode: string; gameId: string }> {
        return fromEvent<{ sessionCode: string; gameId: string }>(this.socket, 'gameStarted');
    }
}
