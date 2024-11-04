import { Attribute, Injectable } from '@angular/core';
import { CharacterInfo } from '@app/interfaces/attributes.interface';
import {
    CharacterCreatedData,
    GameInfo,
    JoinGameResponse,
    Message,
    PlayerListUpdate,
    RoomLockedResponse,
    SessionCreatedData,
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

    // Émission de l'événement pour terminer le tour
    endTurn(sessionCode: string): void {
        this.socket.emit('endTurn', { sessionCode });
    }
    onGameInfo(sessionCode: string): Observable<GameInfo> {
        this.socket.emit('getGameInfo', { sessionCode });
        return fromEvent<GameInfo>(this.socket, 'getGameInfo');
    }

    getAccessibleTiles(sessionCode: string): Observable<{ accessibleTiles: any[] }> {
        this.socket.emit('getAccessibleTiles', { sessionCode });
        return fromEvent<{ accessibleTiles: any[] }>(this.socket, 'accessibleTiles');
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
    
    /** Emit Events */

    // Start combat between two players
    StartCombat(sessionCode: string, avatar1: string, avatar2: string): void {
        const data = { sessionCode, avatar1, avatar2 };
        console.log('Data sending to the server in emitStartCombat:', data);
        this.socket.emit('startCombat', data);
    }

    // Emit an attack during combat
    emitAttack(sessionCode: string): void {
        const data = { sessionCode };
        console.log('Data sending to the server in emitAttack:', data);
        this.socket.emit('attack', data);
    }

    // Attempt evasion during combat
    emitEvasion(sessionCode: string): void {
        const data = { sessionCode };
        console.log('Data sending to the server in emitEvasion:', data);
        this.socket.emit('evasion', data);
    }

    // End combat
    endCombat(sessionCode: string): void {
        const data = { sessionCode };
        console.log('Data sending to the server in endCombat:', data);
        this.socket.emit('endCombat', data);
    }

    /** Combat Start Event */

    // Listen for the start of combat
    onCombatStarted(): Observable<{ opponentAvatar: string; opponentName: string; opponentAttributes: any; startsFirst: boolean }> {
        return fromEvent(this.socket, 'combatStarted').pipe(
            tap(data => console.log('Data got back from the server with combatStarted:', data))
        );
    }

    /** Combat Turn Events */

    // Listen for the start of a combat turn
    onCombatTurnStarted(): Observable<{ playerSocketId: string; timeLeft: number }> {
        return fromEvent(this.socket, 'combatTurnStarted').pipe(
            tap(data => console.log('Data got back from the server with combatTurnStarted:', data))
        );
    }

    // Listen for remaining time in the current combat turn
    onCombatTimeLeft(): Observable<{ timeLeft: number; playerSocketId: string }> {
        return fromEvent(this.socket, 'combatTimeLeft').pipe(
            tap(data => console.log('Data got back from the server with combatTimeLeft:', data))
        );
    }

    // Listen for the end of a combat turn
    onCombatTurnEnded(): Observable<{ playerSocketId: string }> {
        return fromEvent(this.socket, 'combatTurnEnded').pipe(
            tap(data => console.log('Data got back from the server with combatTurnEnded:', data))
        );
    }

    // Listen for combat end
    onCombatEnded(): Observable<{ message: string }> {
        return fromEvent(this.socket, 'combatEnded').pipe(
            tap(data => console.log('Data got back from the server with combatEnded:', data))
        );
    }

    /** Attack Result Events */

    // Listen for attack result
    onAttackResult(): Observable<{ attackRoll: number; defenceRoll: number; success: boolean }> {
        return fromEvent(this.socket, 'attackResult').pipe(
            tap(data => console.log('Data got back from the server with attackResult:', data))
        );
    }

    // Listen for defeated notification if the player loses
    onDefeated(): Observable<{ message: string }> {
        return fromEvent(this.socket, 'defeated').pipe(
            tap(data => console.log('Data got back from the server with defeated:', data))
        );
    }

    // Listen for notification if the opponent is defeated
    onOpponentDefeated(): Observable<{ message: string }> {
        return fromEvent(this.socket, 'opponentDefeated').pipe(
            tap(data => console.log('Data got back from the server with opponentDefeated:', data))
        );
    }

    /** Evasion Result Events */

    // Listen for evasion result
    onEvasionResult(): Observable<{ success: boolean }> {
        return fromEvent(this.socket, 'evasionResult').pipe(
            tap(data => console.log('Data got back from the server with evasionResult:', data))
        );
    }

    // Listen for opponent evasion notification
    onOpponentEvaded(): Observable<{ playerName: string }> {
        return fromEvent(this.socket, 'opponentEvaded').pipe(
            tap(data => console.log('Data got back from the server with opponentEvaded:', data))
        );
    }

    /** Combat Notification */

    // Listen for general combat notifications for other players
    onCombatNotification(): Observable<{ player1: {}; player2: {}; combat: boolean }> {
        return fromEvent(this.socket, 'combatNotification').pipe(
            tap(data => console.log('Data got back from the server with combatNotification:', data))
        );
    }
}
