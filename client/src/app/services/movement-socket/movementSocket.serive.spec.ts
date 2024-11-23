/* eslint-disable */
import { TestBed } from '@angular/core/testing';
import { MovementSocket } from './movementSocket.service';
import { SocketService } from '@app/services/socket/socket.service';

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

describe('MovementSocket', () => {
    let service: MovementSocket;
    let mockSocketService: MockSocketService;

    beforeEach(() => {
        mockSocketService = new MockSocketService();

        TestBed.configureTestingModule({
            providers: [MovementSocket, { provide: SocketService, useValue: mockSocketService }],
        });

        service = TestBed.inject(MovementSocket);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should emit toggleDoorState event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'testSession';
        const row = 1;
        const col = 2;
        const newState = 'open';

        service.toggleDoorState(sessionCode, row, col, newState);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('toggleDoorState', {
            sessionCode,
            row,
            col,
            newState,
        });
    });

    it('should receive data from onDoorStateUpdated observable when doorStateUpdated event is triggered', (done) => {
        const testData = { row: 1, col: 2, newState: 'closed' };
        service.onDoorStateUpdated().subscribe((data: { row: number; col: number; newState: string }) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('doorStateUpdated', testData);
    });

    it('should receive data from onNoMovementPossible observable when noMovementPossible event is triggered', (done) => {
        const testData = { playerName: 'player1' };
        service.onNoMovementPossible().subscribe((data: { playerName: string }) => {
            expect(data).toEqual(testData);
            done();
        });

        mockSocketService.socket.trigger('noMovementPossible', testData);
    });

    it('should receive data from onPlayerMovement observable when playerMovement event is triggered', (done) => {
        const testData = {
            avatar: 'avatar1',
            desiredPath: [
                { row: 1, col: 2 },
                { row: 2, col: 2 },
            ],
            realPath: [
                { row: 1, col: 2 },
                { row: 2, col: 2 },
            ],
        };
        service
            .onPlayerMovement()
            .subscribe((data: { avatar: string; desiredPath: { row: number; col: number }[]; realPath: { row: number; col: number }[] }) => {
                expect(data).toEqual(testData);
                done();
            });

        mockSocketService.socket.trigger('playerMovement', testData);
    });

    it('should emit movePlayer event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'testSession';
        const source = { row: 1, col: 1 };
        const destination = { row: 2, col: 2 };
        const movingImage = 'playerAvatar';

        service.movePlayer(sessionCode, source, destination, movingImage);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('movePlayer', {
            sessionCode,
            movingImage,
            source,
            destination,
        });
    });

    it('should emit getAccessibleTiles and receive data from observable when accessibleTiles event is triggered', (done) => {
        spyOn(mockSocketService.socket, 'emit');
        const sessionCode = 'testSession';
        const testData = {
            accessibleTiles: [
                {
                    position: { row: 2, col: 2 },
                    path: [
                        { row: 1, col: 1 },
                        { row: 2, col: 2 },
                    ],
                },
            ],
        };

        service.getAccessibleTiles(sessionCode).subscribe((data) => {
            expect(data).toEqual(testData);
            done();
        });

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('getAccessibleTiles', { sessionCode });
        mockSocketService.socket.trigger('accessibleTiles', testData);
    });
});
