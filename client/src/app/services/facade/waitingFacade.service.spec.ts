import { TestBed } from '@angular/core/testing';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { GameSocket } from '@app/services/socket/gameSocket.service';
import { PlayerSocket } from '@app/services/socket/playerSocket.service';
import { SessionSocket } from '@app/services/socket/sessionSocket.service';
import { SocketService } from '@app/services/socket/socket.service';
import { of } from 'rxjs';
import { WaitingFacadeService } from './waitingFacade.service';

describe('WaitingFacadeService', () => {
    let service: WaitingFacadeService;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
    let sessionSocketSpy: jasmine.SpyObj<SessionSocket>;
    let playerSocketSpy: jasmine.SpyObj<PlayerSocket>;
    let gameSocketSpy: jasmine.SpyObj<GameSocket>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;

    beforeEach(() => {
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showMessage']);
        sessionSocketSpy = jasmine.createSpyObj('SessionSocket', [
            'excludePlayer',
            'toggleRoomLock',
            'onExcluded',
            'onRoomLocked',
            'onSessionDeleted',
        ]);
        playerSocketSpy = jasmine.createSpyObj('PlayerSocket', ['onPlayerListUpdate']);
        gameSocketSpy = jasmine.createSpyObj('GameSocket', ['emitStartGame', 'onGameStarted']);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['getSocketId']);

        TestBed.configureTestingModule({
            providers: [
                WaitingFacadeService,
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: SessionSocket, useValue: sessionSocketSpy },
                { provide: PlayerSocket, useValue: playerSocketSpy },
                { provide: GameSocket, useValue: gameSocketSpy },
                { provide: SocketService, useValue: socketServiceSpy },
            ],
        });

        service = TestBed.inject(WaitingFacadeService);
    });

    it('should get the socket ID', () => {
        socketServiceSpy.getSocketId.and.returnValue('socket123');
        const result = service.getSocketId();
        expect(result).toBe('socket123');
        expect(socketServiceSpy.getSocketId).toHaveBeenCalled();
    });

    it('should emit start game', () => {
        service.emitStartGame('session123');
        expect(gameSocketSpy.emitStartGame).toHaveBeenCalledWith('session123');
    });

    it('should exclude a player', () => {
        service.excludePlayer('session123', 'player123');
        expect(sessionSocketSpy.excludePlayer).toHaveBeenCalledWith('session123', 'player123');
    });

    it('should subscribe to onExcluded', (done) => {
        const mockMessage = { message: 'You have been excluded' };
        sessionSocketSpy.onExcluded.and.returnValue(of(mockMessage));

        service.onExcluded().subscribe((message) => {
            expect(message).toEqual(mockMessage);
            done();
        });

        expect(sessionSocketSpy.onExcluded).toHaveBeenCalled();
    });

    it('should toggle room lock', () => {
        service.toggleRoomLock('session123', true);
        expect(sessionSocketSpy.toggleRoomLock).toHaveBeenCalledWith('session123', true);
    });

    it('should subscribe to onRoomLocked', (done) => {
        const mockResponse = { locked: true };
        sessionSocketSpy.onRoomLocked.and.returnValue(of(mockResponse));

        service.onRoomLocked().subscribe((response) => {
            expect(response).toEqual(mockResponse);
            done();
        });

        expect(sessionSocketSpy.onRoomLocked).toHaveBeenCalled();
    });

    it('should display a message', () => {
        service.message('Test message');
        expect(notificationServiceSpy.showMessage).toHaveBeenCalledWith('Test message');
    });

    it('should subscribe to onSessionDeleted', (done) => {
        const mockMessage = { message: 'Session deleted' };
        sessionSocketSpy.onSessionDeleted.and.returnValue(of(mockMessage));

        service.onSessionDeleted().subscribe((message) => {
            expect(message).toEqual(mockMessage);
            done();
        });

        expect(sessionSocketSpy.onSessionDeleted).toHaveBeenCalled();
    });

    it('should subscribe to onPlayerListUpdate', (done) => {
        const mockPlayerListUpdate = { players: [] };
        playerSocketSpy.onPlayerListUpdate.and.returnValue(of(mockPlayerListUpdate));

        service.onPlayerListUpdate().subscribe((update) => {
            expect(update).toEqual(mockPlayerListUpdate);
            done();
        });

        expect(playerSocketSpy.onPlayerListUpdate).toHaveBeenCalled();
    });

    it('should subscribe to onGameStarted', (done) => {
        const mockData = { sessionCode: 'session123' };
        gameSocketSpy.onGameStarted.and.returnValue(of(mockData));

        service.onGameStarted().subscribe((data) => {
            expect(data).toEqual(mockData);
            done();
        });

        expect(gameSocketSpy.onGameStarted).toHaveBeenCalled();
    });
});
