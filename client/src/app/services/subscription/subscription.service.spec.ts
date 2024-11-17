/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable max-lines */
import { TestBed } from '@angular/core/testing';
import { GameInfo } from '@app/interfaces/socket.interface';
import { SubscriptionFacadeService } from '@app/services/facade/subscriptionFacade.service';
import { SessionService } from '@app/services/session/session.service';
import { PlayerSocket } from '@app/services/socket/playerSocket.service';
import { SocketService } from '@app/services/socket/socket.service';
import { Subject } from 'rxjs';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
    let service: SubscriptionService;
    let mockSessionService: any;
    let mockSocketService: any;
    let mockSubscriptionFacadeService: any;
    let mockPlayerSocket: any;

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

        mockSocketService = {
            getSocketId: jasmine.createSpy('getSocketId').and.returnValue('socket1'),
        };

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

        mockSubscriptionFacadeService = {
            onGameInfo: jasmine.createSpy('onGameInfo').and.callFake(() => {
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
    it('should return the current value of currentPlayerSocketIdSubject', () => {
        service['currentPlayerSocketIdSubject'].next('testSocketId');

        const result = service.displayedCurrentPlayerSocketId;

        expect(result).toBe('testSocketId');
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

    it('should update isPlayerInCombat, escapeAttempt, and combatOpponentInfo when onCombatStarted emits', () => {
        service.initSubscriptions();

        const data = { opponentPlayer: { name: 'Opponent', avatar: 'avatar.png' } };
        onCombatStartedSubject.next(data);

        expect(service.isPlayerInCombat).toBe(true);
        expect(service.escapeAttempt).toBe(2);
        expect(service.combatOpponentInfo).toEqual({ name: 'Opponent', avatar: 'avatar.png' });
    });

    it('should update isCombatInProgress when onCombatNotification emits', () => {
        service.initSubscriptions();

        const data = { combat: true };
        onCombatNotificationSubject.next(data);

        expect(service.isCombatInProgress).toBe(true);
    });

    it('should update isCombatTurn, isAttackOptionDisabled, isEvasionOptionDisabled, combatTimeLeft, and timeLeft when onCombatTurnStarted emits', () => {
        service.initSubscriptions();

        const data = { playerSocketId: 'socket1', timeLeft: 60 };
        onCombatTurnStartedSubject.next(data);

        expect(service.isCombatTurn).toBe(true);
        expect(service.isAttackOptionDisabled).toBe(false);
        expect(service.isEvasionOptionDisabled).toBe(false);
        expect(service.combatTimeLeft).toBe(60);
        expect(service.timeLeft).toBe(0);
    });

    it('should update escapeAttempt when onPlayerListUpdate emits', () => {
        service.initSubscriptions();

        const data = { players: [{ name: 'testPlayer', attributes: { nbEvasion: { currentValue: 1 } } }] };
        onPlayerListUpdateSubject.next(data);

        expect(service.escapeAttempt).toBe(1);
    });

    it('should update combatTimeLeft and timeLeft when onCombatTimeLeft emits', () => {
        service.initSubscriptions();

        const data = { timeLeft: 45 };
        onCombatTimeLeftSubject.next(data);

        expect(service.combatTimeLeft).toBe(45);
        expect(service.timeLeft).toBe(45);
    });

    it('should reset timeLeft when onCombatTurnEnded emits', () => {
        service.isPlayerInCombat = false;
        service.timeLeft = 30;

        service.initSubscriptions();

        onCombatTurnEndedSubject.next();

        expect(service.timeLeft).toBe(0);
    });

    it('should update isCombatInProgress, isFight, action, and isPlayerInCombat when onOpponentDefeated emits', () => {
        service.initSubscriptions();

        const data = { message: 'Opponent defeated' };
        onOpponentDefeatedSubject.next(data);

        expect(service.isCombatInProgress).toBe(false);
        expect(service.isFight).toBe(false);
        expect(service.action).toBe(1);
        expect(service.isPlayerInCombat).toBe(false);
        expect(mockSessionService.snackBar.open).toHaveBeenCalledWith('Opponent defeated', 'OK', { duration: 3000 });
    });

    it('should update isCombatInProgress, isPlayerInCombat, isCombatTurn, isFight, and action when onDefeated emits', () => {
        service.initSubscriptions();

        const data = { message: 'You are defeated' };
        onDefeatedSubject.next(data);

        expect(service.isCombatInProgress).toBe(false);
        expect(service.isPlayerInCombat).toBe(false);
        expect(service.isCombatTurn).toBe(false);
        expect(service.isFight).toBe(false);
        expect(service.action).toBe(1);
        expect(mockSessionService.snackBar.open).toHaveBeenCalledWith('You are defeated', 'OK', { duration: 3000 });
    });

    it('should update isCombatInProgress, isPlayerInCombat, isFight, and action when onEvasionSuccess emits', () => {
        service.initSubscriptions();

        const data = { message: 'Evasion successful' };
        onEvasionSuccessSubject.next(data);

        expect(service.isCombatInProgress).toBe(false);
        expect(service.isPlayerInCombat).toBe(false);
        expect(service.isFight).toBe(false);
        expect(service.action).toBe(1);
        expect(mockSessionService.snackBar.open).toHaveBeenCalledWith('Evasion successful', 'OK', { duration: 3000 });
    });

    it('should update isPlayerInCombat, isCombatInProgress, and isFight when onOpponentEvaded emits', () => {
        service.initSubscriptions();

        onOpponentEvadedSubject.next();

        expect(service.isPlayerInCombat).toBe(false);
        expect(service.isCombatInProgress).toBe(false);
        expect(service.isFight).toBe(false);
        expect(mockSessionService.snackBar.open).toHaveBeenCalledWith("Votre adversaire a réussi à s'échapper du combat.", 'OK', { duration: 3000 });
    });

    it('should unsubscribe all subscriptions when unsubscribeAll is called', () => {
        spyOn(service['subscriptions'], 'unsubscribe');

        service.unsubscribeAll();

        expect(service['subscriptions'].unsubscribe).toHaveBeenCalled();
    });

    it('should set endGameMessage and winnerName when openEndGameModal is called', () => {
        (service as any).openEndGameModal('DONEE', 'Player1');
        expect(service.endGameMessage).toBe('DONEE');
        expect(service.winnerName).toBe('Player1');
    });

    it('should call endTurn when isPlayerTurnSubject.value is true', () => {
        (service as any).isPlayerTurnSubject.next(true);
        service.endTurn();
        expect(mockSubscriptionFacadeService.endTurn).toHaveBeenCalledWith('testSessionCode');
    });

    it('should not call endTurn when isPlayerTurnSubject.value is false', () => {
        (service as any).isPlayerTurnSubject.next(false);
        service.endTurn();
        expect(mockSubscriptionFacadeService.endTurn).not.toHaveBeenCalled();
    });
});
