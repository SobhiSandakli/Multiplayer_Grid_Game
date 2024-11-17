/* eslint-disable */
import { TestBed } from '@angular/core/testing';
import { SocketService } from './socket.service';
import { TurnSocket } from './turnSocket.service';

interface HandlerMap {
    [event: string]: ((...args: any[]) => void)[];
}

class MockSocket {
    private handlers: HandlerMap = {};

    emit(event: string, data?: any): void {
        // This method can be spied on if needed
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

describe('TurnSocket', () => {
    let service: TurnSocket;
    let mockSocketService: MockSocketService;

    beforeEach(() => {
        mockSocketService = new MockSocketService();

        TestBed.configureTestingModule({
            providers: [TurnSocket, { provide: SocketService, useValue: mockSocketService }],
        });

        service = TestBed.inject(TurnSocket);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should receive data from onTurnStarted observable when turnStarted event is triggered', (done) => {
        const testData = { playerSocketId: 'player1' };
        service.onTurnStarted().subscribe((data: { playerSocketId: string }) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('turnStarted', testData);
    });

    it('should receive data from onTurnEnded observable when turnEnded event is triggered', (done) => {
        const testData = { playerSocketId: 'player1' };
        service.onTurnEnded().subscribe((data: { playerSocketId: string }) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('turnEnded', testData);
    });

    it('should receive data from onTimeLeft observable when timeLeft event is triggered', (done) => {
        const testData = { timeLeft: 30, playerSocketId: 'player1' };
        service.onTimeLeft().subscribe((data: { timeLeft: number; playerSocketId: string }) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('timeLeft', testData);
    });

    it('should receive data from onNextTurnNotification observable when nextTurnNotification event is triggered', (done) => {
        const testData = { playerSocketId: 'player2', inSeconds: 5 };
        service.onNextTurnNotification().subscribe((data: { playerSocketId: string; inSeconds: number }) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('nextTurnNotification', testData);
    });

    it('should emit endTurn event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'session123';

        service.endTurn(sessionCode);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('endTurn', { sessionCode });
    });
});
