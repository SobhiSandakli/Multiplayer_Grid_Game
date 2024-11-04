import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamePageComponent } from './game-page.component';
import { SessionService } from '@app/services/session/session.service';
import { SocketService } from '@app/services/socket/socket.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subject } from 'rxjs';
import { Player } from '@app/interfaces/player.interface';
import { GameInfo } from '@app/interfaces/socket.interface';
import { TURN_NOTIF_DURATION } from 'src/constants/game-constants';

class MockSessionService {
    sessionCode = 'testSessionCode';
    selectedGame = {
        name: 'Test Game',
        size: '10x10',
        description: 'A test game description',
        _id: 'gameId',
        mode: 'testMode',
        image: 'testImage',
        date: new Date(),
        visibility: true,
        grid: [],
    };
    playerName = 'Test Player';
    playerAvatar = 'testAvatar';
    playerAttributes = {
        life: { currentValue: 10, baseValue: 10, name: 'Life', description: 'Player life' },
        speed: { currentValue: 5, baseValue: 5, name: 'Speed', description: 'Player speed' },
    };
    players: Player[] = [{ socketId: '123', name: 'Test Player', avatar: 'testAvatar', isOrganizer: true, attributes: {} }];
    isOrganizer = true;
    leaveSessionPopupVisible = false;
    leaveSession = jasmine.createSpy('leaveSession');
    confirmLeaveSession = jasmine.createSpy('confirmLeaveSession');
    cancelLeaveSession = jasmine.createSpy('cancelLeaveSession');
    initializeGame = jasmine.createSpy('initializeGame');
    subscribeToOrganizerLeft = jasmine.createSpy('subscribeToOrganizerLeft');
    subscribeToPlayerListUpdate = jasmine.createSpy('subscribeToPlayerListUpdate');
    setCurrentPlayerSocketId = jasmine.createSpy('setCurrentPlayerSocketId');
    leaveSessionMessage = '';
}

class MockSocketService {
    private turnStartedSubject = new Subject<{ playerSocketId: string }>();
    private nextTurnNotificationSubject = new Subject<{ playerSocketId: string; inSeconds: number }>();
    private timeLeftSubject = new Subject<{ playerSocketId: string; timeLeft: number }>();
    private turnEndedSubject = new Subject<void>();
    private noMovementPossibleSubject = new Subject<{ playerName: string }>();
    private gameInfoSubject = new Subject<GameInfo>();

    onTurnStarted() {
        return this.turnStartedSubject.asObservable();
    }

    onNextTurnNotification() {
        return this.nextTurnNotificationSubject.asObservable();
    }

    onTimeLeft() {
        return this.timeLeftSubject.asObservable();
    }

    onTurnEnded() {
        return this.turnEndedSubject.asObservable();
    }

    onNoMovementPossible() {
        return this.noMovementPossibleSubject.asObservable();
    }

    onGameInfo(sessionCode: string) {
        return this.gameInfoSubject.asObservable();
    }

    endTurn = jasmine.createSpy('endTurn');
    getSocketId = jasmine.createSpy('getSocketId').and.returnValue('123');
    emitStartCombat = jasmine.createSpy('emitStartCombat');
    leaveSession = jasmine.createSpy('leaveSession');
    triggerTurnStarted(data: { playerSocketId: string }) {
        this.turnStartedSubject.next(data);
    }
    triggerNextTurnNotification(data: { playerSocketId: string; inSeconds: number }) {
        this.nextTurnNotificationSubject.next(data);
    }
    triggerTimeLeft(data: { playerSocketId: string; timeLeft: number }) {
        this.timeLeftSubject.next(data);
    }
    triggerTurnEnded() {
        this.turnEndedSubject.next();
    }
    triggerNoMovementPossible(data: { playerName: string }) {
        this.noMovementPossibleSubject.next(data);
    }
    triggerGameInfo(data: GameInfo) {
        this.gameInfoSubject.next(data);
    }
}

//eslint-disable-next-line @typescript-eslint/max-classes-per-file
class MockMatSnackBar {
    open = jasmine.createSpy('open');
}
describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let mockSessionService: MockSessionService;
    let mockSocketService: MockSocketService;
    let mockSnackBar: MockMatSnackBar;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GamePageComponent],
            imports: [FontAwesomeModule],
            providers: [
                { provide: SessionService, useClass: MockSessionService },
                { provide: SocketService, useClass: MockSocketService },
                { provide: MatSnackBar, useClass: MockMatSnackBar },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockSessionService = TestBed.inject(SessionService) as any;
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockSocketService = TestBed.inject(SocketService) as any;
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockSnackBar = TestBed.inject(MatSnackBar) as any;

        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize game and subscriptions on ngOnInit', () => {
        spyOn(component, 'ngOnInit').and.callThrough();
        component.ngOnInit();
        expect(mockSessionService.leaveSessionPopupVisible).toBeFalse();
        expect(mockSessionService.initializeGame).toHaveBeenCalled();
        expect(mockSessionService.subscribeToPlayerListUpdate).toHaveBeenCalled();
        expect(mockSessionService.subscribeToOrganizerLeft).toHaveBeenCalled();
        expect(component.speedPoints).toBe(5); // from mock data
        expect(component.remainingHealth).toBe(10); // from mock data
    });

    it('should update isPlayerTurn and set timer on turn start', () => {
        component.ngOnInit();
        mockSocketService.triggerTurnStarted({ playerSocketId: '123' }); // the player's own socketId
        expect(component.currentPlayerSocketId).toBe('123');
        expect(component.isPlayerTurn).toBeTrue();
        expect(mockSessionService.setCurrentPlayerSocketId).toHaveBeenCalledWith('123');
        expect(component.putTimer).toBeTrue();
    });

    it("should update isPlayerTurn to false when it is not the player's turn", () => {
        component.ngOnInit();
        mockSocketService.triggerTurnStarted({ playerSocketId: '456' }); // another player's socketId
        expect(component.currentPlayerSocketId).toBe('456');
        expect(component.isPlayerTurn).toBeFalse();
        expect(mockSessionService.setCurrentPlayerSocketId).toHaveBeenCalledWith('456');
        expect(component.putTimer).toBeFalse();
    });

    it('should display next turn notification with player name', () => {
        component.ngOnInit();
        mockSocketService.triggerNextTurnNotification({ playerSocketId: '123', inSeconds: 5 });
        expect(mockSnackBar.open).toHaveBeenCalledWith('Le tour de Test Player commence dans 5 secondes.', 'OK', {
            duration: TURN_NOTIF_DURATION,
            panelClass: ['custom-snackbar'],
        });
    });

    it('should display next turn notification with unknown player name', () => {
        component.ngOnInit();
        mockSocketService.triggerNextTurnNotification({ playerSocketId: '456', inSeconds: 5 });
        expect(mockSnackBar.open).toHaveBeenCalledWith('Le tour de Joueur inconnu commence dans 5 secondes.', 'OK', {
            duration: TURN_NOTIF_DURATION,
            panelClass: ['custom-snackbar'],
        });
    });

    it('should update timeLeft on time left event for current player', () => {
        component.ngOnInit();
        component.currentPlayerSocketId = '123'; // player's own socketId
        mockSocketService.triggerTimeLeft({ playerSocketId: '123', timeLeft: 30 });
        expect(component.timeLeft).toBe(30);
    });

    it('should not update timeLeft if event is for another player', () => {
        component.ngOnInit();
        component.currentPlayerSocketId = '123';
        mockSocketService.triggerTimeLeft({ playerSocketId: '456', timeLeft: 30 });
        expect(component.timeLeft).toBe(0); // remains unchanged
    });

    it('should reset turn variables on turn ended', () => {
        component.isPlayerTurn = true;
        component.putTimer = true;
        component.timeLeft = 20;

        mockSocketService.triggerTurnEnded();

        expect(component.isPlayerTurn).toBeFalse();
        expect(component.putTimer).toBeFalse();
        expect(component.timeLeft).toBe(0);
    });

    it('should display movement not possible message', () => {
        component.ngOnInit();
        mockSocketService.triggerNoMovementPossible({ playerName: 'Test Player' });
        expect(mockSnackBar.open).toHaveBeenCalledWith('Aucun mouvement possible pour Test Player - Le tour de se termine dans 3 secondes.', 'OK', {
            duration: TURN_NOTIF_DURATION,
            panelClass: ['custom-snackbar'],
        });
    });

    it('should return player name by socketId', () => {
        const name = component.getPlayerNameBySocketId('123');
        expect(name).toBe('Test Player');
    });

    it('should return "Joueur inconnu" if socketId not found', () => {
        const name = component.getPlayerNameBySocketId('456');
        expect(name).toBe('Joueur inconnu');
    });

    it('should call leaveSession from sessionService', () => {
        component.leaveSession();
        expect(mockSessionService.leaveSession).toHaveBeenCalled();
    });

    it('should call confirmLeaveSession from sessionService', () => {
        component.confirmLeaveSession();
        expect(mockSessionService.confirmLeaveSession).toHaveBeenCalled();
    });

    it('should call cancelLeaveSession from sessionService', () => {
        component.cancelLeaveSession();
        expect(mockSessionService.cancelLeaveSession).toHaveBeenCalled();
    });

    it('should toggle isExpanded when toggleExpand is called', () => {
        component.isExpanded = false;
        component.toggleExpand();
        expect(component.isExpanded).toBeTrue();
        component.toggleExpand();
        expect(component.isExpanded).toBeFalse();
    });

    it('should toggle isActive when toggleActive is called', () => {
        component.isActive = false;
        component.toggleActive();
        expect(component.isActive).toBeTrue();
        component.toggleActive();
        expect(component.isActive).toBeFalse();
    });

    it('should handle data from child and start combat', () => {
        spyOn(component, 'startCombat');
        component.isActive = true;
        component.handleDataFromChild('opponentAvatar');
        expect(component.opposentPlayer).toBe('opponentAvatar');
        expect(component.isActive).toBeFalse();
        expect(component.startCombat).toHaveBeenCalled();
    });

    it('should clean up subscriptions and leave session on ngOnDestroy if organizer', () => {
        spyOn(component['subscriptions'], 'unsubscribe');
        component.sessionService.isOrganizer = true;
        component.sessionService.sessionCode = 'testSessionCode';
        component.ngOnDestroy();
        expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
        expect(mockSocketService.leaveSession).toHaveBeenCalledWith('testSessionCode');
    });

    it('should clean up subscriptions but not leave session if not organizer', () => {
        spyOn(component['subscriptions'], 'unsubscribe');
        component.sessionService.isOrganizer = false;
        component.sessionService.sessionCode = 'testSessionCode';
        component.ngOnDestroy();
        expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
        expect(mockSocketService.leaveSession).not.toHaveBeenCalled();
    });

    it('should call endTurn on socket service if isPlayerTurn is true', () => {
        component.isPlayerTurn = true;
        component.sessionService.sessionCode = 'testSessionCode';
        component.endTurn();
        expect(mockSocketService.endTurn).toHaveBeenCalledWith('testSessionCode');
    });

    it('should not call endTurn on socket service if isPlayerTurn is false', () => {
        component.isPlayerTurn = false;
        component.endTurn();
        expect(mockSocketService.endTurn).not.toHaveBeenCalled();
    });

    it('should return correct sessionCode from sessionService', () => {
        expect(component.sessionCode).toBe('testSessionCode');
    });

    it('should return correct gameName from sessionService', () => {
        expect(component.gameName).toBe('Test Game');
    });

    it('should return correct gameDescription from sessionService', () => {
        expect(component.gameDescription).toBe('A test game description');
    });

    it('should return correct gameSize from sessionService', () => {
        expect(component.gameSize).toBe('10x10');
    });
    it('should return correct playerName from sessionService', () => {
        expect(component.playerName).toBe('Test Player');
    });

    it('should return correct playerAvatar from sessionService', () => {
        expect(component.playerAvatar).toBe('testAvatar');
    });

    it('should return correct playerAttributes from sessionService', () => {
        expect(component.playerAttributes).toEqual(mockSessionService.playerAttributes);
    });

    it('should return correct leaveSessionPopupVisible from sessionService', () => {
        expect(component.leaveSessionPopupVisible).toBeFalse();
    });

    it('should return correct leaveSessionMessage from sessionService', () => {
        mockSessionService.leaveSessionMessage = 'Test Message';
        expect(component.leaveSessionMessage).toBe('Test Message');
    });

    it('should return correct isOrganizer from sessionService', () => {
        expect(component.isOrganizer).toBeTrue();
    });

    it('should return correct players from sessionService', () => {
        expect(component.players).toEqual(mockSessionService.players);
    });
    it('should update gameInfo on onGameInfo event', () => {
        component.ngOnInit();
        const testGameInfo: GameInfo = { name: 'New Game', size: '20x20' };
        mockSocketService.triggerGameInfo(testGameInfo);
        expect(component.gameInfo).toEqual(testGameInfo);
    });
});
