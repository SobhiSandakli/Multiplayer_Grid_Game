/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { GameInfo, JoinGameResponse } from '@app/interfaces/socket.interface';
import { GameSocket } from './gameSocket.service';
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

describe('GameSocket', () => {
    let service: GameSocket;
    let mockSocketService: MockSocketService;

    beforeEach(() => {
        mockSocketService = new MockSocketService();

        TestBed.configureTestingModule({
            providers: [GameSocket, { provide: SocketService, useValue: mockSocketService }],
        });

        service = TestBed.inject(GameSocket);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should emit startGame event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'testSession';

        service.emitStartGame(sessionCode);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('startGame', { sessionCode });
    });

    it('should receive data from onGameStarted observable when gameStarted event is triggered', (done) => {
        const testData = { sessionCode: 'testSession' };
        service.onGameStarted().subscribe((data: { sessionCode: string }) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('gameStarted', testData);
    });

    it('should emit getGameInfo and receive data from onGameInfo observable', (done) => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'testSession';
        const testData: GameInfo = {
            name: '',
            size: '',
        };

        service.onGameInfo(sessionCode).subscribe((data: GameInfo) => {
            expect(data).toEqual(testData);
            done();
        });

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('getGameInfo', { sessionCode });
        mockSocketService.socket.trigger('getGameInfo', testData);
    });

    it('should emit joinGame and receive data from joinGame observable', (done) => {
        spyOn(mockSocketService.socket, 'emit');
        const secretCode = 'secretCode';
        const testData: JoinGameResponse = { success: true, message: 'Joined successfully' };

        service.joinGame(secretCode).subscribe((data: JoinGameResponse) => {
            expect(data).toEqual(testData);
            done();
        });

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('joinGame', { secretCode });
        mockSocketService.socket.trigger('joinGameResponse', testData);
    });

    it('should receive grid array changes matching the session code', (done) => {
        const sessionCode = 'testSession';
        const testData = {
            sessionCode,
            grid: [[{ images: ['image1'], isOccuped: false }]],
        };

        service.getGridArrayChange$(sessionCode).subscribe((data) => {
            expect(data).toEqual(testData);
            done();
        });

        // Triggering with matching session code
        mockSocketService.socket.trigger('gridArray', testData);
    });

    it('should not receive grid array changes with different session code', () => {
        const sessionCode = 'testSession';
        const testData = {
            sessionCode: 'differentSession',
            grid: [[{ images: ['image1'], isOccuped: false }]],
        };

        let received = false;

        service.getGridArrayChange$(sessionCode).subscribe(() => {
            received = true;
        });

        // Triggering with different session code
        mockSocketService.socket.trigger('gridArray', testData);

        expect(received).toBeFalse();
    });

    it('should receive onOrganizerLeft event', (done) => {
        service.onOrganizerLeft().subscribe(() => {
            expect(true).toBeTrue();
            done();
        });

        mockSocketService.socket.trigger('organizerLeft');
    });

    it('should emit tileInfoRequest with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'testSession';
        const row = 1;
        const col = 2;

        service.emitTileInfoRequest(sessionCode, row, col);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('tileInfoRequest', { sessionCode, row, col });
    });

    it('should receive data from onTileInfo observable when tileInfo event is triggered', (done) => {
        const testData = { cost: 10, effect: 'someEffect' };
        service.onTileInfo().subscribe((data: { cost: number; effect: string }) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('tileInfo', testData);
    });
});
