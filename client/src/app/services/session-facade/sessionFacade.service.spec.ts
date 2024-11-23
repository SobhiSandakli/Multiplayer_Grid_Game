import { TestBed } from '@angular/core/testing';
import { GameSocket } from '@app/services/game-socket/gameSocket.service';
import { PlayerSocket } from '@app/services/player-socket/playerSocket.service';
import { SessionSocket } from '@app/services/session-socket/sessionSocket.service';
import { SocketService } from '@app/services/socket/socket.service';
import { of } from 'rxjs';
import { SessionFacadeService } from './sessionFacade.service';

describe('SessionFacadeService', () => {
    let service: SessionFacadeService;
    let sessionSocketSpy: jasmine.SpyObj<SessionSocket>;
    let playerSocketSpy: jasmine.SpyObj<PlayerSocket>;
    let gameSocketSpy: jasmine.SpyObj<GameSocket>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;

    beforeEach(() => {
        sessionSocketSpy = jasmine.createSpyObj('SessionSocket', ['leaveSession', 'deleteSession']);
        playerSocketSpy = jasmine.createSpyObj('PlayerSocket', ['onPlayerListUpdate']);
        gameSocketSpy = jasmine.createSpyObj('GameSocket', ['onOrganizerLeft']);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['getSocketId']);

        TestBed.configureTestingModule({
            providers: [
                SessionFacadeService,
                { provide: SessionSocket, useValue: sessionSocketSpy },
                { provide: PlayerSocket, useValue: playerSocketSpy },
                { provide: GameSocket, useValue: gameSocketSpy },
                { provide: SocketService, useValue: socketServiceSpy },
            ],
        });

        service = TestBed.inject(SessionFacadeService);
    });

    it('should call leaveSession with correct session code', () => {
        const sessionCode = 'test-session';

        service.leaveSession(sessionCode);

        expect(sessionSocketSpy.leaveSession).toHaveBeenCalledWith(sessionCode);
    });

    it('should call deleteSession with correct session code', () => {
        const sessionCode = 'test-session';

        service.deleteSession(sessionCode);

        expect(sessionSocketSpy.deleteSession).toHaveBeenCalledWith(sessionCode);
    });

    it('should return an observable from onOrganizerLeft', (done) => {
        const mockObservable = of(void 0);
        gameSocketSpy.onOrganizerLeft.and.returnValue(mockObservable);

        service.onOrganizerLeft().subscribe((result) => {
            expect(result).toBeUndefined();
            done();
        });

        expect(gameSocketSpy.onOrganizerLeft).toHaveBeenCalled();
    });

    it('should return an observable from onPlayerListUpdate', (done) => {
        const mockPlayerListUpdate = { players: [] };
        playerSocketSpy.onPlayerListUpdate.and.returnValue(of(mockPlayerListUpdate));

        service.onPlayerListUpdate().subscribe((result) => {
            expect(result).toEqual(mockPlayerListUpdate);
            done();
        });

        expect(playerSocketSpy.onPlayerListUpdate).toHaveBeenCalled();
    });

    it('should return the socket ID from getSocketId', () => {
        const socketId = 'socket123';
        socketServiceSpy.getSocketId.and.returnValue(socketId);

        const result = service.getSocketId();

        expect(result).toBe(socketId);
        expect(socketServiceSpy.getSocketId).toHaveBeenCalled();
    });
});
