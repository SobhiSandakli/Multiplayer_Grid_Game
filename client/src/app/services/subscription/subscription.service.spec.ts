import { TestBed } from '@angular/core/testing';
import { SubscriptionService } from './subscription.service';
import { Subject } from 'rxjs';
import { SessionService } from '@app/services/session/session.service';
import { SocketService } from '@app/services/socket/socket.service';
import { SubscriptionFacadeService } from '@app/services/facade/subscriptionFacade.service';
import { PlayerSocket } from '@app/services/socket/playerSocket.service';
import { GameInfo } from '@app/interfaces/socket.interface';

describe('SubscriptionService', () => {
    let service: SubscriptionService;
    let mockSessionService: any;
    let mockSocketService: any;
    let mockSubscriptionFacadeService: any;
    let mockPlayerSocket: any;

    // Declare Subjects
    let onGameInfoSubject: Subject<GameInfo>;
    let onNextTurnNotificationSubject: Subject<{ playerSocketId: string; inSeconds: number }>;
    let onTimeLeftSubject: Subject<{ timeLeft: number; playerSocketId: string }>;
    let onTurnStartedSubject: Subject<{ playerSocketId: string }>;
    let onTurnEndedSubject: Subject<void>;
    let onNoMovementPossibleSubject: Subject<{ playerName: string }>;
    let onCombatStartedSubject: Subject<any>;
    let onCombatNotificationSubject: Subject<{ combat: boolean }>;
    let onCombatTurnStartedSubject: Subject<{ playerSocketId: string; timeLeft: number }>;
    let onCombatTimeLeftSubject: Subject<{ timeLeft: number }>;
    let onCombatTurnEndedSubject: Subject<void>;
    let onOpponentDefeatedSubject: Subject<{ message: string }>;
    let onDefeatedSubject: Subject<{ message: string }>;
    let onEvasionSuccessSubject: Subject<{ message: string }>;
    let onOpponentEvadedSubject: Subject<void>;
    let onGameEndedSubject: Subject<{ winner: string }>;
    let onPlayerListUpdateSubject: Subject<any>;

    beforeEach(() => {
        // Create mockSessionService as an object
        mockSessionService = {
            getSocketId: jasmine.createSpy('getSocketId').and.returnValue('socket1'),
            openSnackBar: jasmine.createSpy('openSnackBar'),
            setCurrentPlayerSocketId: jasmine.createSpy('setCurrentPlayerSocketId'),
            sessionCode: 'testSessionCode',
            playerName: 'testPlayer',
            players: [
                { socketId: 'socket1', name: 'Player1' },
                { socketId: 'socket2', name: 'Player2' },
            ],
            snackBar: { open: jasmine.createSpy('open') },
            router: { navigate: jasmine.createSpy('navigate') },
        };

        // mockSocketService
        mockSocketService = {
            getSocketId: jasmine.createSpy('getSocketId').and.returnValue('socket1'),
        };

        // Initialize Subjects
        onGameInfoSubject = new Subject<GameInfo>();
        onNextTurnNotificationSubject = new Subject<{ playerSocketId: string; inSeconds: number }>();
        onTimeLeftSubject = new Subject<{ timeLeft: number; playerSocketId: string }>();
        onTurnStartedSubject = new Subject<{ playerSocketId: string }>();
        onTurnEndedSubject = new Subject<void>();
        onNoMovementPossibleSubject = new Subject<{ playerName: string }>();
        onCombatStartedSubject = new Subject<any>();
        onCombatNotificationSubject = new Subject<{ combat: boolean }>();
        onCombatTurnStartedSubject = new Subject<{ playerSocketId: string; timeLeft: number }>();
        onCombatTimeLeftSubject = new Subject<{ timeLeft: number }>();
        onCombatTurnEndedSubject = new Subject<void>();
        onOpponentDefeatedSubject = new Subject<{ message: string }>();
        onDefeatedSubject = new Subject<{ message: string }>();
        onEvasionSuccessSubject = new Subject<{ message: string }>();
        onOpponentEvadedSubject = new Subject<void>();
        onGameEndedSubject = new Subject<{ winner: string }>();
        onPlayerListUpdateSubject = new Subject<any>();

        // Manually create the mockSubscriptionFacadeService
        mockSubscriptionFacadeService = {
            onGameInfo: jasmine.createSpy('onGameInfo').and.callFake((sessionCode: string) => {
                return onGameInfoSubject.asObservable();
            }),
            onNextTurnNotification: jasmine.createSpy('onNextTurnNotification').and.returnValue(onNextTurnNotificationSubject.asObservable()),
            onTimeLeft: jasmine.createSpy('onTimeLeft').and.returnValue(onTimeLeftSubject.asObservable()),
            onTurnStarted: jasmine.createSpy('onTurnStarted').and.returnValue(onTurnStartedSubject.asObservable()),
            onTurnEnded: jasmine.createSpy('onTurnEnded').and.returnValue(onTurnEndedSubject.asObservable()),
            onNoMovementPossible: jasmine.createSpy('onNoMovementPossible').and.returnValue(onNoMovementPossibleSubject.asObservable()),
            onCombatStarted: jasmine.createSpy('onCombatStarted').and.returnValue(onCombatStartedSubject.asObservable()),
            onCombatNotification: jasmine.createSpy('onCombatNotification').and.returnValue(onCombatNotificationSubject.asObservable()),
            onCombatTurnStarted: jasmine.createSpy('onCombatTurnStarted').and.returnValue(onCombatTurnStartedSubject.asObservable()),
            onCombatTimeLeft: jasmine.createSpy('onCombatTimeLeft').and.returnValue(onCombatTimeLeftSubject.asObservable()),
            onCombatTurnEnded: jasmine.createSpy('onCombatTurnEnded').and.returnValue(onCombatTurnEndedSubject.asObservable()),
            onOpponentDefeated: jasmine.createSpy('onOpponentDefeated').and.returnValue(onOpponentDefeatedSubject.asObservable()),
            onDefeated: jasmine.createSpy('onDefeated').and.returnValue(onDefeatedSubject.asObservable()),
            onEvasionSuccess: jasmine.createSpy('onEvasionSuccess').and.returnValue(onEvasionSuccessSubject.asObservable()),
            onOpponentEvaded: jasmine.createSpy('onOpponentEvaded').and.returnValue(onOpponentEvadedSubject.asObservable()),
            onGameEnded: jasmine.createSpy('onGameEnded').and.returnValue(onGameEndedSubject.asObservable()),
            endTurn: jasmine.createSpy('endTurn'),
        };

        mockPlayerSocket = {
            onPlayerListUpdate: jasmine.createSpy('onPlayerListUpdate').and.returnValue(onPlayerListUpdateSubject.asObservable()),
        };

        TestBed.configureTestingModule({
            providers: [
                SubscriptionService,
                { provide: SessionService, useValue: mockSessionService },
                { provide: SocketService, useValue: mockSocketService },
                { provide: SubscriptionFacadeService, useValue: mockSubscriptionFacadeService },
                { provide: PlayerSocket, useValue: mockPlayerSocket },
            ],
        });

        service = TestBed.inject(SubscriptionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should handle evasion success when onEvasionSuccess emits', () => {
        spyOn<any>(service, 'closeCombatDialog').and.stub();

        service.initSubscriptions();

        const message = 'You successfully evaded!';
        onEvasionSuccessSubject.next({ message });

        expect(service.isCombatInProgress).toBe(false);
        expect(service.isPlayerInCombat).toBe(false);
        expect((service as any).closeCombatDialog).toHaveBeenCalled();
        expect(mockSessionService.openSnackBar).toHaveBeenCalledWith(message);
    });

    it('should subscribe to game info and update gameInfoSubject', () => {
        spyOn(service['gameInfoSubject'], 'next');

        service.initSubscriptions();

        const gameInfo: GameInfo = { name: 'Test Game', size: 'Large' };
        onGameInfoSubject.next(gameInfo);

        expect(service['gameInfoSubject'].next).toHaveBeenCalledWith(gameInfo);
    });

    it('should update currentPlayerSocketId and isPlayerTurn when onTurnStarted emits', () => {
        spyOn(service['currentPlayerSocketIdSubject'], 'next');
        spyOn(service['isPlayerTurnSubject'], 'next');
        spyOn(service['putTimerSubject'], 'next');

        mockSocketService.getSocketId.and.returnValue('socket1');
        service.initSubscriptions();

        const data = { playerSocketId: 'socket1' };
        onTurnStartedSubject.next(data);

        expect(service['currentPlayerSocketIdSubject'].next).toHaveBeenCalledWith('socket1');
        expect(service['isPlayerTurnSubject'].next).toHaveBeenCalledWith(false);
        expect(mockSessionService.setCurrentPlayerSocketId).toHaveBeenCalledWith('socket1');
        expect(service['putTimerSubject'].next).toHaveBeenCalledWith(false);
    });
    it('should update isCombatInProgress and isPlayerInCombat when onCombatNotification emits', () => {
        service.initSubscriptions();

        // Initially, both should be false
        expect(service.isCombatInProgress).toBe(false);
        expect(service.isPlayerInCombat).toBe(false);

        const combatData = { combat: false };
        onCombatNotificationSubject.next(combatData);

        expect(service.isCombatInProgress).toBe(false);
        expect(service.isPlayerInCombat).toBe(false);
    });

    it('should reset isPlayerTurnSubject and timeLeft when onTurnEnded emits', () => {
        spyOn(service['isPlayerTurnSubject'], 'next');
        spyOn(service['putTimerSubject'], 'next');

        service.timeLeft = 30;

        service.initSubscriptions();

        onTurnEndedSubject.next();

        expect(service['isPlayerTurnSubject'].next).toHaveBeenCalledWith(false);
        expect(service.timeLeft).toBe(0);
        expect(service['putTimerSubject'].next).toHaveBeenCalledWith(false);
    });
    it('should set combat flags and open combat dialog when onCombatStarted emits', () => {
        spyOn<any>(service, 'openCombatDialog').and.stub();

        service.initSubscriptions();

        onCombatStartedSubject.next({});

        expect(service.isCombatInProgress).toBe(true);
        expect(service.isPlayerInCombat).toBe(true);
        expect((service as any).openCombatDialog).toHaveBeenCalled();
    });

    it('should update timeLeft when onTimeLeft emits and conditions are met', () => {
        service.isPlayerInCombat = false;
        service.isCombatInProgress = false;
        service['currentPlayerSocketIdSubject'].next('socket1');

        service.initSubscriptions();

        const data = { timeLeft: 30, playerSocketId: 'socket1' };
        onTimeLeftSubject.next(data);

        expect(service.timeLeft).toBe(30);
    });
    it('should update isCombatTurn and timeLeft when onCombatTurnStarted emits', () => {
        service.initSubscriptions();

        const data = { playerSocketId: 'socket1', timeLeft: 60 };
        onCombatTurnStartedSubject.next(data);

        expect(service.isCombatTurn).toBe(true);
        expect(service.timeLeft).toBe(0);
    });

    it('should not update timeLeft when onTimeLeft emits and conditions are not met', () => {
        service.isPlayerInCombat = true;
        service.isCombatInProgress = false;
        service['currentPlayerSocketIdSubject'].next('socket1');

        service.initSubscriptions();

        const data = { timeLeft: 30, playerSocketId: 'socket1' };
        onTimeLeftSubject.next(data);

        expect(service.timeLeft).toBe(0);
    });
    it('should update timeLeft when onCombatTimeLeft emits', () => {
        service.initSubscriptions();

        onCombatTimeLeftSubject.next({ timeLeft: 45 });

        expect(service.timeLeft).toBe(45);
    });

    it('should return the player name for a given socketId', () => {
        const playerName = service.getPlayerNameBySocketId('socket1');
        expect(playerName).toBe('Player1');

        const unknownPlayerName = service.getPlayerNameBySocketId('unknownSocketId');
        expect(unknownPlayerName).toBe('Joueur inconnu');
    });
    it('should handle opponent evasion when onOpponentEvaded emits', () => {
        spyOn<any>(service, 'closeCombatDialog').and.stub();

        service.initSubscriptions();

        onOpponentEvadedSubject.next();

        expect(service.isCombatInProgress).toBe(false);
        expect(service.isPlayerInCombat).toBe(false);
        expect((service as any).closeCombatDialog).toHaveBeenCalled();
        expect(mockSessionService.openSnackBar).toHaveBeenCalledWith('Opponent has evaded the combat');
    });

    it('should open snackBar when onNoMovementPossible emits', () => {
        service.initSubscriptions();

        const data = { playerName: 'Player1' };
        onNoMovementPossibleSubject.next(data);

        expect(mockSessionService.openSnackBar).toHaveBeenCalledWith(
            'Aucun mouvement possible pour Player1 - Le tour de se termine dans 3 secondes.',
        );
    });
    it('should reset isCombatTurn and timeLeft when onCombatTurnEnded emits', () => {
        service.isCombatTurn = true;
        service.timeLeft = 30;

        service.initSubscriptions();

        onCombatTurnEndedSubject.next();

        expect(service.isCombatTurn).toBe(true);
        expect(service.timeLeft).toBe(0);
    });
    it('should handle game end when onGameEnded emits', () => {
        service.initSubscriptions();

        const data = { winner: 'Player1' };
        onGameEndedSubject.next(data);

        expect(mockSessionService.openSnackBar).toHaveBeenCalledWith(`Game Over! Winner: Player1`);
        expect(mockSessionService.router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should return playerName from sessionService', () => {
        expect(service.playerName).toBe('testPlayer');

        mockSessionService.playerName = '';
        expect(service.playerName).toBe('');
    });

    it('should return correct value for displayedIsPlayerTurn when isPlayerInCombat is true', () => {
        service.isPlayerInCombat = true;
        service.isCombatTurn = true;

        expect(service.displayedIsPlayerTurn).toBe(true);

        service.isCombatTurn = false;

        expect(service.displayedIsPlayerTurn).toBe(false);
    });

    it('should return false for displayedIsPlayerTurn when isCombatInProgress is true and isPlayerInCombat is false', () => {
        service.isPlayerInCombat = false;
        service.isCombatInProgress = true;

        expect(service.displayedIsPlayerTurn).toBe(false);
    });

    it('should return isPlayerTurnSubject.value when not in combat', () => {
        service.isPlayerInCombat = false;
        service.isCombatInProgress = false;

        service['isPlayerTurnSubject'].next(true);
        expect(service.displayedIsPlayerTurn).toBe(true);

        service['isPlayerTurnSubject'].next(false);
        expect(service.displayedIsPlayerTurn).toBe(false);
    });
    it('should handle opponent defeat when onOpponentDefeated emits', () => {
        spyOn<any>(service, 'closeCombatDialog').and.stub();

        service.initSubscriptions();

        const message = 'Opponent defeated!';
        onOpponentDefeatedSubject.next({ message });

        expect(service.isCombatInProgress).toBe(false);
        expect(service.isPlayerInCombat).toBe(false);
        expect((service as any).closeCombatDialog).toHaveBeenCalled();
        expect(mockSessionService.openSnackBar).toHaveBeenCalledWith(message);
    });

    it('should return correct value for showEndTurnButton', () => {
        service.isPlayerInCombat = false;
        service.isCombatInProgress = false;
        service['isPlayerTurnSubject'].next(true);

        expect(service.showEndTurnButton).toBe(true);

        service['isPlayerTurnSubject'].next(false);
        expect(service.showEndTurnButton).toBe(false);

        service.isPlayerInCombat = true;
        expect(service.showEndTurnButton).toBe(false);

        service.isPlayerInCombat = false;
        service.isCombatInProgress = true;
        expect(service.showEndTurnButton).toBe(false);
    });
    it('should handle player defeat when onDefeated emits', () => {
        spyOn<any>(service, 'closeCombatDialog').and.stub();

        service.initSubscriptions();

        const message = 'You have been defeated!';
        onDefeatedSubject.next({ message });

        expect(service.isCombatInProgress).toBe(false);
        expect(service.isPlayerInCombat).toBe(false);
        expect((service as any).closeCombatDialog).toHaveBeenCalled();
        expect(mockSessionService.openSnackBar).toHaveBeenCalledWith(message);
        expect(mockSessionService.router.navigate).toHaveBeenCalledWith(['/']);
    });
});
