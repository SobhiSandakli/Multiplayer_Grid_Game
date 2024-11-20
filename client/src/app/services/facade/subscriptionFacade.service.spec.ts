import { TestBed } from '@angular/core/testing';
import { Player } from '@app/interfaces/player.interface';
import { CombatSocket } from '@app/services/socket/combatSocket.service';
import { GameSocket } from '@app/services/socket/gameSocket.service';
import { MovementSocket } from '@app/services/socket/movementSocket.service';
import { SocketService } from '@app/services/socket/socket.service';
import { TurnSocket } from '@app/services/socket/turnSocket.service';
import { of } from 'rxjs';
import { SubscriptionFacadeService } from './subscriptionFacade.service';

describe('SubscriptionFacadeService', () => {
    let service: SubscriptionFacadeService;
    let turnSocketSpy: jasmine.SpyObj<TurnSocket>;
    let gameSocketSpy: jasmine.SpyObj<GameSocket>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let movementSocketSpy: jasmine.SpyObj<MovementSocket>;
    let combatSocketSpy: jasmine.SpyObj<CombatSocket>;

    beforeEach(() => {
        turnSocketSpy = jasmine.createSpyObj('TurnSocket', ['onTurnStarted', 'endTurn', 'onTurnEnded', 'onTimeLeft', 'onNextTurnNotification']);
        gameSocketSpy = jasmine.createSpyObj('GameSocket', ['onGameInfo']);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['getSocketId']);
        movementSocketSpy = jasmine.createSpyObj('MovementSocket', ['onNoMovementPossible']);
        combatSocketSpy = jasmine.createSpyObj('CombatSocket', [
            'onCombatStarted',
            'onCombatNotification',
            'onCombatTurnStarted',
            'onCombatTimeLeft',
            'onCombatTurnEnded',
            'onOpponentDefeated',
            'onDefeated',
            'onEvasionSuccess',
            'onOpponentEvaded',
            'onGameEnded',
        ]);

        TestBed.configureTestingModule({
            providers: [
                SubscriptionFacadeService,
                { provide: TurnSocket, useValue: turnSocketSpy },
                { provide: GameSocket, useValue: gameSocketSpy },
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: MovementSocket, useValue: movementSocketSpy },
                { provide: CombatSocket, useValue: combatSocketSpy },
            ],
        });

        service = TestBed.inject(SubscriptionFacadeService);
    });
    it('should return observable from onCombatTurnStarted', (done) => {
        const mockData = { playerSocketId: '123', timeLeft: 30 };
        combatSocketSpy.onCombatTurnStarted.and.returnValue(of(mockData));

        service.onCombatTurnStarted().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(combatSocketSpy.onCombatTurnStarted).toHaveBeenCalled();
    });
    it('should return observable from onCombatTimeLeft', (done) => {
        const mockData = { timeLeft: 20, playerSocketId: '123' };
        combatSocketSpy.onCombatTimeLeft.and.returnValue(of(mockData));

        service.onCombatTimeLeft().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(combatSocketSpy.onCombatTimeLeft).toHaveBeenCalled();
    });

    it('should return observable from onCombatTurnEnded', (done) => {
        const mockData = { playerSocketId: '123' };
        combatSocketSpy.onCombatTurnEnded.and.returnValue(of(mockData));

        service.onCombatTurnEnded().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(combatSocketSpy.onCombatTurnEnded).toHaveBeenCalled();
    });
    it('should return observable from onOpponentDefeated', (done) => {
        const mockData = { message: 'Opponent defeated', winner: 'Player1' };
        combatSocketSpy.onOpponentDefeated.and.returnValue(of(mockData));

        service.onOpponentDefeated().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(combatSocketSpy.onOpponentDefeated).toHaveBeenCalled();
    });

    it('should return observable from onDefeated', (done) => {
        const mockData = { message: 'You are defeated', winner: 'Player2' };
        combatSocketSpy.onDefeated.and.returnValue(of(mockData));

        service.onDefeated().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(combatSocketSpy.onDefeated).toHaveBeenCalled();
    });

    it('should return observable from onEvasionSuccess', (done) => {
        const mockData = { message: 'Evasion successful' };
        combatSocketSpy.onEvasionSuccess.and.returnValue(of(mockData));

        service.onEvasionSuccess().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(combatSocketSpy.onEvasionSuccess).toHaveBeenCalled();
    });
    it('should return observable from onOpponentEvaded', (done) => {
        const mockData = { playerName: 'Player1' };
        combatSocketSpy.onOpponentEvaded.and.returnValue(of(mockData));

        service.onOpponentEvaded().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(combatSocketSpy.onOpponentEvaded).toHaveBeenCalled();
    });
    it('should return observable from onNextTurnNotification', (done) => {
        const mockData = { playerSocketId: 'socket123', inSeconds: 10 };
        turnSocketSpy.onNextTurnNotification.and.returnValue(of(mockData));

        service.onNextTurnNotification().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(turnSocketSpy.onNextTurnNotification).toHaveBeenCalled();
    });

    it('should return observable from onTurnStarted', (done) => {
        const mockData = { playerSocketId: '123' };
        turnSocketSpy.onTurnStarted.and.returnValue(of(mockData));

        service.onTurnStarted().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(turnSocketSpy.onTurnStarted).toHaveBeenCalled();
    });

    it('should call endTurn with correct session code', () => {
        const sessionCode = 'test-session';
        service.endTurn(sessionCode);

        expect(turnSocketSpy.endTurn).toHaveBeenCalledWith(sessionCode);
    });

    it('should return observable from onTurnEnded', (done) => {
        const mockData = { playerSocketId: '123' };
        turnSocketSpy.onTurnEnded.and.returnValue(of(mockData));

        service.onTurnEnded().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(turnSocketSpy.onTurnEnded).toHaveBeenCalled();
    });

    it('should return observable from onTimeLeft', (done) => {
        const mockData = { timeLeft: 30, playerSocketId: '123' };
        turnSocketSpy.onTimeLeft.and.returnValue(of(mockData));

        service.onTimeLeft().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(turnSocketSpy.onTimeLeft).toHaveBeenCalled();
    });

    it('should return the socket ID from getSocketId', () => {
        const socketId = 'socket123';
        socketServiceSpy.getSocketId.and.returnValue(socketId);

        const result = service.getSocketId();

        expect(result).toBe(socketId);
        expect(socketServiceSpy.getSocketId).toHaveBeenCalled();
    });

    it('should return observable from onGameInfo', (done) => {
        const sessionCode = 'test-session';
        const mockGameInfo = { name: 'Test Game', size: 'medium' };
        gameSocketSpy.onGameInfo.and.returnValue(of(mockGameInfo));

        service.onGameInfo(sessionCode).subscribe((result) => {
            expect(result).toEqual(mockGameInfo);
            done();
        });

        expect(gameSocketSpy.onGameInfo).toHaveBeenCalledWith(sessionCode);
    });

    it('should return observable from onNoMovementPossible', (done) => {
        const mockData = { playerName: 'Test Player' };
        movementSocketSpy.onNoMovementPossible.and.returnValue(of(mockData));

        service.onNoMovementPossible().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(movementSocketSpy.onNoMovementPossible).toHaveBeenCalled();
    });

    it('should return observable from onCombatStarted', (done) => {
        const mockData = { startsFirst: true, opponentPlayer: {} as Player };
        combatSocketSpy.onCombatStarted.and.returnValue(of(mockData));

        service.onCombatStarted().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(combatSocketSpy.onCombatStarted).toHaveBeenCalled();
    });

    it('should return observable from onCombatNotification', (done) => {
        const mockData = {
            player1: { avatar: 'avatar1', name: 'Player1' },
            player2: { avatar: 'avatar2', name: 'Player2' },
            combat: true,
            result: 'ongoing',
        };
        combatSocketSpy.onCombatNotification.and.returnValue(of(mockData));

        service.onCombatNotification().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(combatSocketSpy.onCombatNotification).toHaveBeenCalled();
    });

    it('should return observable from onGameEnded', (done) => {
        const mockData = { winner: 'Player1', players: [] };
        combatSocketSpy.onGameEnded.and.returnValue(of(mockData));

        service.onGameEnded().subscribe((result) => {
            expect(result).toEqual(mockData);
            done();
        });

        expect(combatSocketSpy.onGameEnded).toHaveBeenCalled();
    });
});
