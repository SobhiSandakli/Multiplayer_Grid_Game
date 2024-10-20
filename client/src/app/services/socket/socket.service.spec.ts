import { TestBed } from '@angular/core/testing';
import { Socket } from 'socket.io-client';
import { SocketService } from './socket.service';
// it's important to have function type in the mock for testing purposes
class MockSocket {
    id: string = '';
    private events: {
        // eslint-disable-next-line @typescript-eslint/ban-types
        [key: string]: Function[];
    } = {};

    emit(event: string, data?: unknown) {
        if (this.events[event]) {
            this.events[event].forEach((callback) => callback(data));
        }
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    on(event: string, callback: Function) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event: string) {
        delete this.events[event];
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
        socketService.joinRoom(room, name);
        mockSocket.emit('joinRoom', { room, name });
    });

    it('should send a room message', () => {
        const room = 'room1';
        const message = 'Hello!';
        const sender = 'user1';
        socketService.sendRoomMessage(room, message, sender);
        mockSocket.emit('roomMessage', { room, message, sender });
    });

    it('should listen for room messages', (done) => {
        const data = { room: 'room1', message: 'Hello!', sender: 'user1' };

        socketService.onRoomMessage().subscribe((receivedData) => {
            expect(receivedData).toEqual(data);
            done(); // Call done to end the test when the observable emits
        });

        mockSocket.emit('roomMessage', data); // Emit the event from the mock socket
    });

    it('should listen for general messages', (done) => {
        const data = { message: 'Hello!', sender: 'user1' };

        socketService.onMessage().subscribe((receivedData) => {
            expect(receivedData).toEqual(data);
            done(); // Call done to end the test when the observable emits
        });

        mockSocket.emit('message', data); // Emit the event from the mock socket
    });
    it('should return the socket id', () => {
        mockSocket['id'] = '12345';
        const socketId = socketService.getSocketId();
        expect(socketId).toBe('12345');
    });

    it('should listen for player list updates', (done) => {
        const playerList = [{ name: 'Player1' }];
        socketService.onPlayerListUpdate().subscribe((data) => {
            expect(data).toEqual(playerList);
            done();
        });
        mockSocket.emit('playerListUpdate', playerList);
    });

    it('should listen for exclusion events', (done) => {
        const exclusionData = { reason: 'Kicked' };
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
        const characterData = { name: 'Hero' };
        socketService.createCharacter(sessionCode, characterData);
        mockSocket.emit('createCharacter', { sessionCode, characterData });
    });

    it('should listen for character creation events', (done) => {
        const character = { name: 'Hero' };
        socketService.onCharacterCreated().subscribe((data) => {
            expect(data).toEqual(character);
            done();
        });
        mockSocket.emit('characterCreated', character);
    });

    it('should join a game', (done) => {
        const secretCode = 'SECRET';
        const joinGameResponse = { success: true };

        socketService.joinGame(secretCode).subscribe((data) => {
            expect(data).toEqual(joinGameResponse);
            done();
        });
        mockSocket.emit('joinGameResponse', joinGameResponse);
    });

    it('should get taken avatars', (done) => {
        const sessionCode = 'ABC123';
        const takenAvatars = ['avatar1', 'avatar2'];

        socketService.getTakenAvatars(sessionCode).subscribe((data) => {
            expect(data).toEqual(takenAvatars);
            done();
        });
        mockSocket.emit('takenAvatars', takenAvatars);
    });

    it('should delete a session', () => {
        const sessionCode = 'ABC123';
        socketService.deleteSession(sessionCode);
        mockSocket.emit('deleteSession', { sessionCode });
    });

    it('should create a new session', (done) => {
        const maxPlayers = 4;
        const selectedGameID = 'game1';
        const sessionData = { sessionCode: 'ABC123' };

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
        const sessionCode = 'ABC123';
        socketService.onSessionDeleted().subscribe((data) => {
            expect(data).toEqual(sessionCode);
            done();
        });
        mockSocket.emit('sessionDeleted', sessionCode);
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
});
