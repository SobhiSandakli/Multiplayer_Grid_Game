import { TestBed } from '@angular/core/testing';
import { Socket } from 'socket.io-client';
import { SocketService } from './socket.service';
import { GameInfo } from '@app/interfaces/socket.interface';
class MockSocket {
    id: string = '';
    private events: { [key: string]: ((data?: unknown) => void)[] } = {};

    emit(event: string, data?: unknown) {
        if (this.events[event]) {
            this.events[event].forEach((callback) => callback(data));
        }
    }

    on(event: string, callback: (data?: unknown) => void) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event: string) {
        delete this.events[event];
    }
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    trigger(event: string, data: any) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].forEach((callback) => callback(data));
    }
}
describe('SocketService', () => {
    let socketService: SocketService;
    let mockSocket: MockSocket;
    beforeEach(() => {
        mockSocket = new MockSocket();
        TestBed.configureTestingModule({
            providers: [SocketService, { provide: Socket, useValue: mockSocket as unknown as Socket }],
        });

        socketService = TestBed.inject(SocketService);
        socketService['socket'] = mockSocket as unknown as Socket;
    });

    it('should create the SocketService', () => {
        expect(socketService).toBeTruthy();
    });

    it('should join a room', () => {
        const room = 'room1';
        const name = 'user1';
        const showSystemMessage = true;
        socketService.joinRoom(room, name, showSystemMessage);
        mockSocket.emit('joinRoom', { room, name, showSystemMessage });
    });
    it('should emit attack event', () => {
        spyOn(mockSocket, 'emit');
        const sessionCode = 'session123';
        socketService.emitAttack(sessionCode);
        expect(mockSocket.emit).toHaveBeenCalledWith('attack', { sessionCode });
    });
    it('should listen for evasionResult event', (done) => {
        const evasionResultData = { success: true };
        socketService.onEvasionResult().subscribe((data) => {
            expect(data).toEqual(evasionResultData);
            done();
        });

        mockSocket.trigger('evasionResult', evasionResultData);
    });
    it('should listen for combatStarted event', (done) => {
        const combatStartedData = {
            opponentAvatar: 'avatar2.png',
            opponentName: 'Player2',
            opponentAttributes: { strength: 10 },
            startsFirst: true,
        };

        socketService.onCombatStarted().subscribe((data) => {
            expect(data).toEqual(combatStartedData);
            done();
        });

        mockSocket.trigger('combatStarted', combatStartedData);
    });
    it('should listen for defeated event', (done) => {
        const defeatedData = { message: 'You have been defeated' };
        socketService.onDefeated().subscribe((data) => {
            expect(data).toEqual(defeatedData);
            done();
        });

        mockSocket.trigger('defeated', defeatedData);
    });
    it('should listen for gameStarted event', (done) => {
        const gameStartedData = { sessionCode: 'session123' };
        socketService.onGameStarted().subscribe((data) => {
            expect(data).toEqual(gameStartedData);
            done();
        });

        mockSocket.trigger('gameStarted', gameStartedData);
    });

    it('should send a room message', () => {
        const room = 'room1';
        const message = 'Hello!';
        const sender = 'user1';
        socketService.sendRoomMessage(room, message, sender);
        mockSocket.emit('roomMessage', { room, message, sender });
    });

    it('should listen for room messages', (done) => {
        const data = 'Hello!';

        socketService.onRoomMessage().subscribe((receivedData) => {
            expect(receivedData).toBe(data);
            done();
        });

        mockSocket.emit('roomMessage', data);
    });

    it('should listen for general messages', (done) => {
        const data = 'Hello!';

        socketService.onMessage().subscribe((receivedData) => {
            expect(receivedData).toBe(data);
            done();
        });

        mockSocket.emit('message', data);
    });
    it('should emit gridArrayChange$ when sessionCode matches', (done) => {
        const sessionCode = 'session123';
        const gridData = { sessionCode, grid: [[{ images: ['img1.png'], isOccuped: false }]] };

        socketService.getGridArrayChange$(sessionCode).subscribe((data) => {
            expect(data).toEqual(gridData);
            done();
        });

        socketService['gridArrayChangeSubject'].next(gridData);
    });

    it('should not emit gridArrayChange$ when sessionCode does not match', (done) => {
        const sessionCode = 'session123';
        const gridData = { sessionCode: 'differentSession', grid: [[{ images: ['img1.png'], isOccuped: false }]] };

        socketService.getGridArrayChange$(sessionCode).subscribe(() => {
            fail('Should not emit data with different sessionCode');
        });
        socketService['gridArrayChangeSubject'].next(gridData);

        setTimeout(() => done(), 100);
    });

    it('should return the socket id', () => {
        mockSocket['id'] = '12345';
        const socketId = socketService.getSocketId();
        expect(socketId).toBe('12345');
    });

    it('should listen for player list updates', (done) => {
        const playerList = { players: [{ name: 'Player1', id: '123', score: 0, socketId: 'socket-123', avatar: 'avatar1.png', isOrganizer: false }] };
        socketService.onPlayerListUpdate().subscribe((data) => {
            expect(data).toEqual(playerList);
            done();
        });
        mockSocket.emit('playerListUpdate', playerList);
    });

    it('should listen for exclusion events', (done) => {
        const exclusionData = { message: 'Kicked' };
        socketService.onExcluded().subscribe((data) => {
            expect(data).toEqual(exclusionData);
            done();
        });
        mockSocket.emit('excluded', exclusionData);
    });

    it('should listen for session creation events', (done) => {
        const sessionData = { sessionCode: 'ABC123' };
        socketService.onSessionCreated().subscribe((data) => {
            expect(data).toEqual(sessionData);
            done();
        });
        mockSocket.emit('sessionCreated', sessionData);
    });

    it('should create a character', () => {
        const sessionCode = 'ABC123';
        const characterData = { name: 'Hero', avatar: 'default-avatar.png', attributes: {} };
        socketService.createCharacter(sessionCode, characterData);
        mockSocket.emit('createCharacter', { sessionCode, characterData });
    });
    it('should emit toggleDoorState event', () => {
        spyOn(mockSocket, 'emit');
        const sessionCode = 'session123';
        const row = 1;
        const col = 2;
        const newState = 'open';
        socketService.toggleDoorState(sessionCode, row, col, newState);
        expect(mockSocket.emit).toHaveBeenCalledWith('toggleDoorState', { sessionCode, row, col, newState });
    });

    it('should listen for doorStateUpdated event', (done) => {
        const doorStateData = { row: 1, col: 2, newState: 'open' };
        socketService.onDoorStateUpdated().subscribe((data) => {
            expect(data).toEqual(doorStateData);
            done();
        });

        mockSocket.trigger('doorStateUpdated', doorStateData);
    });

    it('should listen for character creation events', (done) => {
        const character = {
            name: 'Hero',
            sessionCode: 'ABC123',
            avatar: 'avatar.png',
            gameId: 'game123',
            attributes: {
                baseValue: 100,
                currentValue: 100,
                name: 'Life',
                description: 'Life attribute',
            },
        };

        socketService.onCharacterCreated().subscribe((data) => {
            expect(data).toEqual(jasmine.objectContaining(character));
            done();
        });

        mockSocket.emit('characterCreated', character);
    });
    it('should emit evasion event', () => {
        spyOn(mockSocket, 'emit');
        const sessionCode = 'session123';
        socketService.emitEvasion(sessionCode);
        expect(mockSocket.emit).toHaveBeenCalledWith('evasion', { sessionCode });
    });

    it('should join a game', (done) => {
        const secretCode = 'SECRET';
        const joinGameResponse = { success: true, message: 'Game joined successfully' };

        socketService.joinGame(secretCode).subscribe((data) => {
            expect(data).toEqual(joinGameResponse);
            done();
        });
        mockSocket.emit('joinGameResponse', joinGameResponse);
    });

    it('should get taken avatars', (done) => {
        const sessionCode = 'ABC123';
        const takenAvatarsResponse = { takenAvatars: ['avatar1', 'avatar2'] };

        socketService.getTakenAvatars(sessionCode).subscribe((data) => {
            expect(data).toEqual(takenAvatarsResponse);
            done();
        });
        mockSocket.emit('takenAvatars', takenAvatarsResponse);
    });
    it('should listen for combatTurnStarted event', (done) => {
        const combatTurnData = { playerSocketId: 'player1', timeLeft: 30 };
        socketService.onCombatTurnStarted().subscribe((data) => {
            expect(data).toEqual(combatTurnData);
            done();
        });

        mockSocket.trigger('combatTurnStarted', combatTurnData);
    });

    it('should listen for combatTimeLeft event', (done) => {
        const timeLeftData = { timeLeft: 25, playerSocketId: 'player1' };
        socketService.onCombatTimeLeft().subscribe((data) => {
            expect(data).toEqual(timeLeftData);
            done();
        });

        mockSocket.trigger('combatTimeLeft', timeLeftData);
    });

    it('should listen for combatTurnEnded event', (done) => {
        const combatTurnEndedData = { playerSocketId: 'player1' };
        socketService.onCombatTurnEnded().subscribe((data) => {
            expect(data).toEqual(combatTurnEndedData);
            done();
        });

        mockSocket.trigger('combatTurnEnded', combatTurnEndedData);
    });

    it('should listen for combatEnded event', (done) => {
        const combatEndedData = { message: 'Combat has ended' };
        socketService.onCombatEnded().subscribe((data) => {
            expect(data).toEqual(combatEndedData);
            done();
        });

        mockSocket.trigger('combatEnded', combatEndedData);
    });

    it('should delete a session', () => {
        const sessionCode = 'ABC123';
        socketService.deleteSession(sessionCode);
        mockSocket.emit('deleteSession', { sessionCode });
    });

    it('should create a new session', (done) => {
        const maxPlayers = 4;
        const selectedGameID = 'game1';
        const sessionData = { sessionCode: 'session-1' };

        socketService.createNewSession(maxPlayers, selectedGameID).subscribe((data) => {
            expect(data).toEqual(sessionData);
            done();
        });
        mockSocket.emit('sessionCreated', sessionData);
    });

    it('should leave a session', () => {
        const sessionCode = 'ABC123';
        socketService.leaveSession(sessionCode);
        mockSocket.emit('leaveSession', { sessionCode });
    });

    it('should listen for session deletion events', (done) => {
        const messageData = { message: 'Session deleted' };
        socketService.onSessionDeleted().subscribe((data) => {
            expect(data).toEqual(messageData);
            done();
        });
        mockSocket.emit('sessionDeleted', messageData);
    });
    it('should listen for attackResult event', (done) => {
        const attackResultData = {
            attackBase: 5,
            attackRoll: 4,
            defenceBase: 3,
            defenceRoll: 2,
            success: true,
        };
        socketService.onAttackResult().subscribe((data) => {
            expect(data).toEqual(attackResultData);
            done();
        });

        mockSocket.trigger('attackResult', attackResultData);
    });

    it('should exclude a player', () => {
        const sessionCode = 'ABC123';
        const playerSocketId = 'PLAYER123';
        socketService.excludePlayer(sessionCode, playerSocketId);
        mockSocket.emit('excludePlayer', { sessionCode, playerSocketId });
    });

    it('should toggle room lock', () => {
        const sessionCode = 'ABC123';
        const lock = true;
        socketService.toggleRoomLock(sessionCode, lock);
        mockSocket.emit('toggleLock', { sessionCode, lock });
    });

    it('should listen for room lock events', (done) => {
        const roomLockData = { locked: true };
        socketService.onRoomLocked().subscribe((data) => {
            expect(data).toEqual(roomLockData);
            done();
        });
        mockSocket.emit('roomLocked', roomLockData);
    });
    it('should listen for turnStarted event', (done) => {
        const turnData = { playerSocketId: 'player1' };
        socketService.onTurnStarted().subscribe((data) => {
            expect(data).toEqual(turnData);
            done();
        });

        mockSocket.trigger('turnStarted', turnData);
    });
    it('should listen for defeated event', (done) => {
        const defeatedData = { message: 'You have been defeated' };
        socketService.onDefeated().subscribe((data) => {
            expect(data).toEqual(defeatedData);
            done();
        });

        mockSocket.trigger('defeated', defeatedData);
    });

    it('should listen for opponentDefeated event', (done) => {
        const opponentDefeatedData = { message: 'Opponent has been defeated' };
        socketService.onOpponentDefeated().subscribe((data) => {
            expect(data).toEqual(opponentDefeatedData);
            done();
        });

        mockSocket.trigger('opponentDefeated', opponentDefeatedData);
    });

    it('should listen for evasionSuccessful event', (done) => {
        const evasionSuccessData = { message: 'Evasion successful' };
        socketService.onEvasionSuccess().subscribe((data) => {
            expect(data).toEqual(evasionSuccessData);
            done();
        });

        mockSocket.trigger('evasionSuccessful', evasionSuccessData);
    });

    it('should listen for opponentEvaded event', (done) => {
        const opponentEvadedData = { playerName: 'Player2' };
        socketService.onOpponentEvaded().subscribe((data) => {
            expect(data).toEqual(opponentEvadedData);
            done();
        });

        mockSocket.trigger('opponentEvaded', opponentEvadedData);
    });

    it('should listen for evasionResult event', (done) => {
        const evasionResultData = { success: true };
        socketService.onEvasionResult().subscribe((data) => {
            expect(data).toEqual(evasionResultData);
            done();
        });

        mockSocket.trigger('evasionResult', evasionResultData);
    });
    it('should listen for turnEnded event', (done) => {
        const turnData = { playerSocketId: 'player1' };
        socketService.onTurnEnded().subscribe((data) => {
            expect(data).toEqual(turnData);
            done();
        });

        mockSocket.trigger('turnEnded', turnData);
    });
    it('should listen for timeLeft event', (done) => {
        const timeData = { timeLeft: 30, playerSocketId: 'player1' };
        socketService.onTimeLeft().subscribe((data) => {
            expect(data).toEqual(timeData);
            done();
        });

        mockSocket.trigger('timeLeft', timeData);
    });
    it('should listen for nextTurnNotification event', (done) => {
        const notificationData = { playerSocketId: 'player1', inSeconds: 5 };
        socketService.onNextTurnNotification().subscribe((data) => {
            expect(data).toEqual(notificationData);
            done();
        });

        mockSocket.trigger('nextTurnNotification', notificationData);
    });
    it('should listen for combatNotification event', (done) => {
        const combatNotificationData = {
            player1: { name: 'Player1', avatar: 'avatar1.png' },
            player2: { name: 'Player2', avatar: 'avatar2.png' },
            combat: true,
        };
        socketService.onCombatNotification().subscribe((data) => {
            expect(data).toEqual(combatNotificationData);
            done();
        });

        mockSocket.trigger('combatNotification', combatNotificationData);
    });

    it('should emit endTurn event', () => {
        spyOn(mockSocket, 'emit');
        const sessionCode = 'session123';
        socketService.endTurn(sessionCode);
        expect(mockSocket.emit).toHaveBeenCalledWith('endTurn', { sessionCode });
    });

    // Test for onGameInfo
    it('should emit getGameInfo and listen for getGameInfo event', (done) => {
        spyOn(mockSocket, 'emit');
        const sessionCode = 'session123';
        const gameInfo = { gameData: 'someData' } as unknown as GameInfo;
        socketService.onGameInfo(sessionCode).subscribe((data) => {
            expect(data).toEqual(gameInfo);
            done();
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('getGameInfo', { sessionCode });
        mockSocket.trigger('getGameInfo', gameInfo);
    });

    // Test for getAccessibleTiles
    it('should emit getAccessibleTiles and listen for accessibleTiles event', (done) => {
        spyOn(mockSocket, 'emit');
        const sessionCode = 'session123';
        const tilesData = { accessibleTiles: [{ row: 0, col: 1 }] };
        socketService.getAccessibleTiles(sessionCode).subscribe((data) => {
            expect(data).toEqual(tilesData);
            done();
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('getAccessibleTiles', { sessionCode });
        mockSocket.trigger('accessibleTiles', tilesData);
    });

    // Test for onNoMovementPossible
    it('should listen for noMovementPossible event', (done) => {
        const eventData = { playerName: 'Player1' };
        socketService.onNoMovementPossible().subscribe((data) => {
            expect(data).toEqual(eventData);
            done();
        });

        mockSocket.trigger('noMovementPossible', eventData);
    });

    // Test for onPlayerMovement
    it('should listen for playerMovement event', (done) => {
        const movementData = {
            avatar: 'avatar1.png',
            desiredPath: [{ row: 0, col: 1 }],
            realPath: [{ row: 0, col: 1 }],
        };
        socketService.onPlayerMovement().subscribe((data) => {
            expect(data).toEqual(movementData);
            done();
        });

        mockSocket.trigger('playerMovement', movementData);
    });

    // Test for emitStartCombat
    it('should emit startCombat event', () => {
        spyOn(mockSocket, 'emit');
        const sessionCode = 'session123';
        const avatar1 = 'avatar1.png';
        const avatar2 = 'avatar2.png';
        socketService.emitStartCombat(sessionCode, avatar1, avatar2);
        expect(mockSocket.emit).toHaveBeenCalledWith('startCombat', { sessionCode, avatar1, avatar2 });
    });

    // Test for emitTileInfoRequest
    it('should emit tileInfoRequest event', () => {
        spyOn(mockSocket, 'emit');
        const sessionCode = 'session123';
        const row = 1;
        const col = 2;
        socketService.emitTileInfoRequest(sessionCode, row, col);
        expect(mockSocket.emit).toHaveBeenCalledWith('tileInfoRequest', { sessionCode, row, col });
    });

    // Test for emitAvatarInfoRequest
    it('should emit avatarInfoRequest event', () => {
        spyOn(mockSocket, 'emit');
        const sessionCode = 'session123';
        const avatar = 'avatar1.png';
        socketService.emitAvatarInfoRequest(sessionCode, avatar);
        expect(mockSocket.emit).toHaveBeenCalledWith('avatarInfoRequest', { sessionCode, avatar });
    });

    // Test for onAvatarInfo
    it('should listen for avatarInfo event', (done) => {
        const avatarInfo = { name: 'Player1', avatar: 'avatar1.png' };
        socketService.onAvatarInfo().subscribe((data) => {
            expect(data).toEqual(avatarInfo);
            done();
        });

        mockSocket.trigger('avatarInfo', avatarInfo);
    });

    // Test for onTileInfo
    it('should listen for tileInfo event', (done) => {
        const tileInfo = { cost: 2, effect: 'slow' };
        socketService.onTileInfo().subscribe((data) => {
            expect(data).toEqual(tileInfo);
            done();
        });

        mockSocket.trigger('tileInfo', tileInfo);
    });

    // Test for onPlayerInfo
    it('should listen for playerInfo event', (done) => {
        const playerInfo = { name: 'Player1', avatar: 'avatar1.png' };
        socketService.onPlayerInfo().subscribe((data) => {
            expect(data).toEqual(playerInfo);
            done();
        });

        mockSocket.trigger('playerInfo', playerInfo);
    });

    // Test for movePlayer
    it('should emit movePlayer event', () => {
        spyOn(mockSocket, 'emit');
        const sessionCode = 'session123';
        const source = { row: 0, col: 0 };
        const destination = { row: 1, col: 1 };
        const movingImage = 'avatar1.png';

        socketService.movePlayer(sessionCode, source, destination, movingImage);

        expect(mockSocket.emit).toHaveBeenCalledWith('movePlayer', {
            sessionCode,
            movingImage,
            source,
            destination,
        });
    });

    // Test for onOrganizerLeft
    it('should listen for organizerLeft event', (done) => {
        socketService.onOrganizerLeft().subscribe(() => {
            expect(true).toBeTrue();
            done();
        });

        mockSocket.trigger('organizerLeft', null);
    });
});
