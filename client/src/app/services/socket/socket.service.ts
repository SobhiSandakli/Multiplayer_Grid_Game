import { Attribute, Injectable } from '@angular/core';
import { CharacterInfo } from '@app/interfaces/attributes.interface';
import {
    CharacterCreatedData,
    GameInfo,
    JoinGameResponse,
    RoomLockedResponse,
    TakenAvatarsResponse,
} from '@app/interfaces/socket.interface';
import { environment } from '@environments/environment';
import { BehaviorSubject, fromEvent, Observable, Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';

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
            this.gridArrayChangeSubject.next(data);
        });
        this.socket.on('getGameInfo', (data: GameInfo) => {
            this.gameInfoSubject.next(data);
        });
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

    movePlayer(sessionCode: string, source: { row: number; col: number }, destination: { row: number; col: number }, movingImage: string): void {
        this.socket.emit('movePlayer', {
            sessionCode,
            movingImage,
            source,
            destination,
        });
    }

    onTurnStarted(): Observable<{ playerSocketId: string }> {
        return fromEvent(this.socket, 'turnStarted');
    }

    onTurnEnded(): Observable<{ playerSocketId: string }> {
        return fromEvent(this.socket, 'turnEnded');
    }

    onTimeLeft(): Observable<{ timeLeft: number; playerSocketId: string }> {
        return fromEvent(this.socket, 'timeLeft');
    }

    onNextTurnNotification(): Observable<{ playerSocketId: string; inSeconds: number }> {
        return fromEvent(this.socket, 'nextTurnNotification');
    }

    endTurn(sessionCode: string): void {
        this.socket.emit('endTurn', { sessionCode });
    }


    getAccessibleTiles(sessionCode: string): Observable<{
        accessibleTiles: {
            position: { row: number; col: number };
            path: { row: number; col: number }[];
        }[];
    }> {
        this.socket.emit('getAccessibleTiles', { sessionCode });
        return fromEvent<{
            accessibleTiles: {
                position: { row: number; col: number };
                path: { row: number; col: number }[];
            }[];
        }>(this.socket, 'accessibleTiles');
    }

    onNoMovementPossible(): Observable<{ playerName: string }> {
        return fromEvent<{ playerName: string }>(this.socket, 'noMovementPossible');
    }

    onPlayerMovement(): Observable<{ avatar: string; desiredPath: { row: number; col: number }[]; realPath: { row: number; col: number }[] }> {
        return fromEvent<{ avatar: string; desiredPath: { row: number; col: number }[]; realPath: { row: number; col: number }[] }>(
            this.socket,
            'playerMovement',
        );
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
    toggleDoorState(sessionCode: string, row: number, col: number, newState: string): void {
        this.socket.emit('toggleDoorState', { sessionCode, row, col, newState });
    }
    onDoorStateUpdated(): Observable<{ row: number; col: number; newState: string }> {
        return fromEvent(this.socket, 'doorStateUpdated');
    }

    emitStartCombat(sessionCode: string, avatar1: string, avatar2: string): void {
        const data = { sessionCode, avatar1, avatar2 };
        this.socket.emit('startCombat', data);
    }

    emitAttack(sessionCode: string): void {
        const data = { sessionCode };
        this.socket.emit('attack', data);
    }

    emitEvasion(sessionCode: string): void {
        const data = { sessionCode };
        this.socket.emit('evasion', data);
    }

    onCombatStarted(): Observable<{
        opponentAvatar: string;
        opponentName: string;
        opponentAttributes: { [key: string]: Attribute };
        startsFirst: boolean;
    }> {
        return fromEvent(this.socket, 'combatStarted').pipe(tap());
    }

    onCombatTurnStarted(): Observable<{ playerSocketId: string; timeLeft: number }> {
        return fromEvent(this.socket, 'combatTurnStarted').pipe(tap());
    }

    onCombatTimeLeft(): Observable<{ timeLeft: number; playerSocketId: string }> {
        return fromEvent(this.socket, 'combatTimeLeft').pipe(tap());
    }

    onCombatTurnEnded(): Observable<{ playerSocketId: string }> {
        return fromEvent(this.socket, 'combatTurnEnded').pipe(tap());
    }

    onCombatEnded(): Observable<{ message: string }> {
        return fromEvent(this.socket, 'combatEnded').pipe(tap());
    }

    onAttackResult(): Observable<{ attackBase: number; attackRoll: number; defenceBase: number; defenceRoll: number; success: boolean }> {
        return fromEvent(this.socket, 'attackResult').pipe(tap());
    }

    onDefeated(): Observable<{ message: string; winner: string }> {
        return fromEvent(this.socket, 'defeated');
    }

    onOpponentDefeated(): Observable<{ message: string; winner: string }> {
        return fromEvent(this.socket, 'opponentDefeated');
    }

    onEvasionSuccess(): Observable<{ message: string }> {
        return fromEvent(this.socket, 'evasionSuccessful');
    }

    onOpponentEvaded(): Observable<{ playerName: string }> {
        return fromEvent(this.socket, 'opponentEvaded');
    }

    onEvasionResult(): Observable<{ success: boolean }> {
        return fromEvent(this.socket, 'evasionResult').pipe(tap());
    }

    onCombatNotification(): Observable<{
        player1: { avatar: string; name: string };
        player2: { avatar: string; name: string };
        combat: boolean;
        result: string;
    }> {
        return fromEvent(this.socket, 'combatNotification');
    }

    onGameEnded(): Observable<{ winner: string }> {
        return fromEvent(this.socket, 'gameEnded');
    }
}
