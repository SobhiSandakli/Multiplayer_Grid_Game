import { Attribute, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { BehaviorSubject, fromEvent, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { filter } from 'rxjs/operators';
import {
    PlayerListUpdate,
    Message,
    SessionCreatedData,
    CharacterCreatedData,
    JoinGameResponse,
    TakenAvatarsResponse,
    RoomLockedResponse,
    GameInfo,
} from '@app/interfaces/socket.interface';
import { CharacterInfo } from '@app/interfaces/attributes.interface';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    private socket: Socket;
    private gridArrayChangeSubject = new BehaviorSubject<{ sessionCode: string; grid: { images: string[]; isOccuped: boolean }[][] } | null>(null);
    private gameInfoSubject = new Subject<GameInfo>();
    constructor() {
        this.socket = io(environment.serverUrl);
        this.socket.on('gridArray', (data: { sessionCode: string; grid: { images: string[]; isOccuped: boolean }[][] }) => {
            this.gridArrayChangeSubject.next(data); // Store the latest event data
        });
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
    onCharacterCreated(): Observable<CharacterCreatedData & { gameId: string } & { attributs: Attribute }> {
        return fromEvent<CharacterCreatedData & { gameId: string } & { attributs: Attribute }>(this.socket, 'characterCreated');
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
    onGameStarted(): Observable<{ sessionCode: string }> {
        return new Observable<{ sessionCode: string }>((subscriber) => {
            const eventHandler = (data: { sessionCode: string }) => {
                subscriber.next(data);
            };
            this.socket.on('gameStarted', eventHandler);
        });
    }

    onOrganizerLeft(): Observable<void> {
        return fromEvent(this.socket, 'organizerLeft');
    }

    getGridArrayChange$(sessionCode: string): Observable<{ sessionCode: string; grid: { images: string[]; isOccuped: boolean }[][] } | null> {
        return this.gridArrayChangeSubject.asObservable().pipe(
            filter((data) => data !== null && data.sessionCode === sessionCode), // Filter by sessionCode
        );
    }

    movePlayer(sessionCode: string, source: { row: number, col: number }, destination: { row: number, col: number }, movingImage : string): void {
        this.socket.emit('movePlayer', {
            sessionCode,
            movingImage,
            source,
            destination,
        });
    }
    
    onGameInfo(sessionCode: string): Observable<GameInfo> {
        this.socket.emit('getGameInfo', { sessionCode });
        return fromEvent<GameInfo>(this.socket, 'getGameInfo');
    }
}
