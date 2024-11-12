import { Attribute, Injectable } from '@angular/core';
import { CharacterInfo } from '@app/interfaces/attributes.interface';
import {
    CharacterCreatedData,
    GameInfo,
    JoinGameResponse,
    Message,
    PlayerListUpdate,
    RoomLockedResponse,
    TakenAvatarsResponse,
} from '@app/interfaces/socket.interface';
import { environment } from '@environments/environment';
import { BehaviorSubject, fromEvent, Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    public socket: Socket;
    private gridArrayChangeSubject = new BehaviorSubject<{ sessionCode: string; grid: { images: string[]; isOccuped: boolean }[][] } | null>(null);
    private gameInfoSubject = new Subject<GameInfo>();
    constructor() {
        this.socket = io(environment.serverUrl);
        this.socket.on('gridArray', (data: { sessionCode: string; grid: { images: string[]; isOccuped: boolean }[][] }) => {
            this.gridArrayChangeSubject.next(data);
        });
        this.socket.on('getGameInfo', (data: GameInfo) => {
            this.gameInfoSubject.next(data);
        });
    }
    onUpdateLifePoints(): Observable<{ playerLife: number; opponentLife: number }> {
        return fromEvent(this.socket, 'updateLifePoints');
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
        return this.gridArrayChangeSubject.asObservable().pipe(filter((data) => data !== null && data.sessionCode === sessionCode));
    }
    onGameInfo(sessionCode: string): Observable<GameInfo> {
        this.socket.emit('getGameInfo', { sessionCode });
        return fromEvent<GameInfo>(this.socket, 'getGameInfo');
    }
    emitTileInfoRequest(sessionCode: string, row: number, col: number): void {
        this.socket.emit('tileInfoRequest', { sessionCode, row, col });
    }

    emitAvatarInfoRequest(sessionCode: string, avatar: string): void {
        this.socket.emit('avatarInfoRequest', { sessionCode, avatar });
    }

    onAvatarInfo(): Observable<{ name: string; avatar: string }> {
        return fromEvent(this.socket, 'avatarInfo');
    }

    onTileInfo(): Observable<{ cost: number; effect: string }> {
        return fromEvent(this.socket, 'tileInfo');
    }

    onPlayerInfo(): Observable<{ name: string; avatar: string }> {
        return fromEvent(this.socket, 'playerInfo');
    }
}
