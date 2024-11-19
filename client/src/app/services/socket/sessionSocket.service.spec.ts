/* eslint-disable */
import { TestBed } from '@angular/core/testing';
import { Message, RoomLockedResponse, SessionCreatedData } from '@app/interfaces/socket.interface';
import { SessionSocket } from './sessionSocket.service';
import { SocketService } from './socket.service';

interface HandlerMap {
    [event: string]: ((...args: any[]) => void)[];
}

class MockSocket {
    private handlers: HandlerMap = {};

    emit(event: string, data?: any): void {
        // This method can be spied on
    }

    on(event: string, handler: (...args: any[]) => void): void {
        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(handler);
    }

    off(event: string, handler: (...args: any[]) => void): void {
        if (this.handlers[event]) {
            this.handlers[event] = this.handlers[event].filter((h) => h !== handler);
        }
    }

    trigger(event: string, data?: any): void {
        if (this.handlers[event]) {
            this.handlers[event].forEach((handler) => handler(data));
        }
    }
}

class MockSocketService {
    socket = new MockSocket();
}

describe('SessionSocket', () => {
    let service: SessionSocket;
    let mockSocketService: MockSocketService;

    beforeEach(() => {
        mockSocketService = new MockSocketService();

        TestBed.configureTestingModule({
            providers: [SessionSocket, { provide: SocketService, useValue: mockSocketService }],
        });

        service = TestBed.inject(SessionSocket);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should receive data from onSessionCreated observable when sessionCreated event is triggered', (done) => {
        const testData: SessionCreatedData = {
            sessionCode: 'ABC123',
        };

        service.onSessionCreated().subscribe((data: SessionCreatedData) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('sessionCreated', testData);
    });

    it('should emit deleteSession event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'ABC123';

        service.deleteSession(sessionCode);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('deleteSession', { sessionCode });
    });

    it('should emit createNewSession event and receive sessionCreated', (done) => {
        spyOn(mockSocketService.socket, 'emit');
        const maxPlayers = 4;
        const selectedGameID = 'game1';
        const mode = 'classic';
        const testData: SessionCreatedData = {
            sessionCode: 'ABC123',
        };

        service.createNewSession(maxPlayers, selectedGameID, mode).subscribe((data: SessionCreatedData) => {
            expect(data).toEqual(testData);
            done();
        });

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('createNewSession', { maxPlayers, selectedGameID, mode });
        mockSocketService.socket.trigger('sessionCreated', testData);
    });

    it('should emit leaveSession event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'ABC123';

        service.leaveSession(sessionCode);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('leaveSession', { sessionCode });
    });

    it('should receive data from onSessionDeleted observable when sessionDeleted event is triggered', (done) => {
        const testData: Message = {
            message: 'Session has been deleted',
        };

        service.onSessionDeleted().subscribe((data: Message) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('sessionDeleted', testData);
    });

    it('should emit toggleLock event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'ABC123';
        const lock = true;

        service.toggleRoomLock(sessionCode, lock);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('toggleLock', { sessionCode, lock });
    });

    it('should receive data from onRoomLocked observable when roomLocked event is triggered', (done) => {
        const testData: RoomLockedResponse = {
            locked: false,
        };

        service.onRoomLocked().subscribe((data: RoomLockedResponse) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('roomLocked', testData);
    });

    it('should receive data from onExcluded observable when excluded event is triggered', (done) => {
        const testData: Message = {
            message: 'You have been excluded from the session',
        };

        service.onExcluded().subscribe((data: Message) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('excluded', testData);
    });

    it('should emit excludePlayer event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'ABC123';
        const playerSocketId = 'socket123';

        service.excludePlayer(sessionCode, playerSocketId);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('excludePlayer', { sessionCode, playerSocketId });
    });
});
