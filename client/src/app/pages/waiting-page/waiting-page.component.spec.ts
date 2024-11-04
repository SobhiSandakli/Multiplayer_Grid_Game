import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaitingViewComponent } from './waiting-page.component';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { GameValidateService } from '@app/services/validate-game/gameValidate.service';
import { SocketService } from '@app/services/socket/socket.service';
import { SessionService } from '@app/services/session/session.service';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { Player } from '@app/interfaces/player.interface';
import { Game } from '@app/interfaces/game-model.interface';
import { RoomLockedResponse } from '@app/interfaces/socket.interface';
import { MIN_PLAYERS } from 'src/constants/players-constants';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

class MockNotificationService {
    showMessage(message: string) {
    }
}

class MockGameFacadeService {
    fetchGame(gameId: string) {
        return of({
            _id: gameId,
            name: 'Test Game',
            size: 'medium',
            description: 'A test game description',
            mode: 'solo',
            image: 'test-image-url',
            date: new Date(),
            visibility: true,
            grid: [[{ images: [], isOccuped: false }]],
        } as Game);
    }
}

class MockGameValidateService {
    gridMaxPlayers(game: Game) {
        return 4;
    }
}

class MockSocketService {
    private roomLockedSubject = new Subject<RoomLockedResponse>();
    private sessionDeletedSubject = new Subject<{ message: string }>();
    private gameStartedSubject = new Subject<{ sessionCode: string }>();
    private playerListUpdateSubject = new Subject<{ players: Player[] }>();
    private excludedSubject = new Subject<{ message: string }>();

    onRoomLocked() {
        return this.roomLockedSubject.asObservable();
    }

    onSessionDeleted() {
        return this.sessionDeletedSubject.asObservable();
    }

    onGameStarted() {
        return this.gameStartedSubject.asObservable();
    }

    onPlayerListUpdate() {
        return this.playerListUpdateSubject.asObservable();
    }

    onExcluded() {
        return this.excludedSubject.asObservable();
    }

    getSocketId() {
        return 'test-socket-id';
    }

    emitStartGame(sessionCode: string) {}
    excludePlayer(sessionCode: string, playerSocketId: string) {}
    toggleRoomLock(sessionCode: string, lock: boolean) {}
    leaveSession(sessionCode: string) {}
    triggerRoomLocked(locked: boolean) {
        this.roomLockedSubject.next({ locked });
    }
    triggerSessionDeleted(message: string) {
        this.sessionDeletedSubject.next({ message });
    }
    triggerGameStarted(sessionCode: string) {
        this.gameStartedSubject.next({ sessionCode });
    }
    triggerPlayerListUpdate(players: Player[]) {
        this.playerListUpdateSubject.next({ players });
    }
    triggerExcluded(message: string) {
        this.excludedSubject.next({ message });
    }
}
class MockSessionService {
    playerName = 'Test Player';
    leaveSessionMessage = '';
    sessionCode = 'testSessionCode';
    leaveSessionPopupVisible = false;
    router = jasmine.createSpyObj('Router', ['navigate']);
    route = {
        snapshot: {
            queryParamMap: {
                get: (param: string) => {
                    if (param === 'sessionCode') return 'testSessionCode';
                    if (param === 'gameId') return 'testGameId';
                    return null;
                },
            },
        },
    } as unknown as ActivatedRoute;

    leaveSession() {
        this.leaveSessionPopupVisible = true;
    }

    confirmLeaveSession() {
        this.leaveSessionPopupVisible = false;
        this.router.navigate(['/']);
    }

    cancelLeaveSession() {
        this.leaveSessionPopupVisible = false;
    }

    updatePlayerData(player: Player) {
        this.playerName = player.name;
    }

    updatePlayersList(players: Player[]) {}

    updateCurrentPlayerDetails() {}
}

describe('WaitingViewComponent', () => {
    let component: WaitingViewComponent;
    let fixture: ComponentFixture<WaitingViewComponent>;
    let mockNotificationService: MockNotificationService;
    let mockGameFacadeService: MockGameFacadeService;
    let mockGameValidateService: MockGameValidateService;
    let mockSocketService: MockSocketService;
    let mockSessionService: MockSessionService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WaitingViewComponent],
            imports: [FontAwesomeModule],
            providers: [
                { provide: NotificationService, useClass: MockNotificationService },
                { provide: GameFacadeService, useClass: MockGameFacadeService },
                { provide: GameValidateService, useClass: MockGameValidateService },
                { provide: SocketService, useClass: MockSocketService },
                { provide: SessionService, useClass: MockSessionService },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitingViewComponent);
        component = fixture.componentInstance;

        mockNotificationService = TestBed.inject(NotificationService) as any;
        mockGameFacadeService = TestBed.inject(GameFacadeService) as any;
        mockGameValidateService = TestBed.inject(GameValidateService) as any;
        mockSocketService = TestBed.inject(SocketService) as any;
        mockSessionService = TestBed.inject(SessionService) as any;

        fixture.detectChanges();
    });

    it('should call necessary methods on ngOnInit', () => {
        spyOn(component as any, 'reload');
        spyOn(component as any, 'initializeSessionCode');
        spyOn(component as any, 'loadGameData');
        spyOn(component as any, 'subscribeToPlayerListUpdate');
        spyOn(component as any, 'subscribeToExclusion');
        spyOn(component as any, 'subscribeToRoomLock');
        spyOn(component as any, 'subscribeToSessionDeletion');
        spyOn(component as any, 'subscribeToGameStarted');

        component.ngOnInit();

        expect((component as any).reload).toHaveBeenCalled();
        expect((component as any).initializeSessionCode).toHaveBeenCalled();
        expect((component as any).loadGameData).toHaveBeenCalled();
        expect((component as any).subscribeToPlayerListUpdate).toHaveBeenCalled();
        expect((component as any).subscribeToExclusion).toHaveBeenCalled();
        expect((component as any).subscribeToRoomLock).toHaveBeenCalled();
        expect((component as any).subscribeToSessionDeletion).toHaveBeenCalled();
        expect((component as any).subscribeToGameStarted).toHaveBeenCalled();
    });
    it('should remove item from sessionStorage and unsubscribe on ngOnDestroy', () => {
        spyOn(sessionStorage, 'removeItem');
        spyOn(component['subscriptions'], 'unsubscribe');

        component.ngOnDestroy();

        expect(sessionStorage.removeItem).toHaveBeenCalledWith('waitingPageReloaded');
        expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
    });
    it('should call sessionService.leaveSession when leaveSession is called', () => {
        spyOn(mockSessionService, 'leaveSession');

        component.leaveSession();

        expect(mockSessionService.leaveSession).toHaveBeenCalled();
    });
    it('should call sessionService.confirmLeaveSession when confirmLeaveSession is called', () => {
        spyOn(mockSessionService, 'confirmLeaveSession');

        component.confirmLeaveSession();

        expect(mockSessionService.confirmLeaveSession).toHaveBeenCalled();
    });
    it('should call sessionService.cancelLeaveSession when cancelLeaveSession is called', () => {
        spyOn(mockSessionService, 'cancelLeaveSession');

        component.cancelLeaveSession();

        expect(mockSessionService.cancelLeaveSession).toHaveBeenCalled();
    });
    it('should show a message if the number of players is invalid in startGame', () => {
        component.players = Array.from({ length: MIN_PLAYERS - 1 }, () => ({}) as Player);
        component['maxPlayers'] = MIN_PLAYERS;
        component['roomLocked'] = true;
        spyOn(mockNotificationService, 'showMessage');

        component.startGame();

        expect(mockNotificationService.showMessage).toHaveBeenCalledWith('Le nombre de joueurs ne respecte pas les limites de la carte de jeu.');
    });

    it('should show a message if the room is not locked in startGame', () => {
        component.players = Array.from({ length: MIN_PLAYERS }, () => ({}) as Player);
        component['maxPlayers'] = MIN_PLAYERS;
        component['roomLocked'] = false;
        spyOn(mockNotificationService, 'showMessage');

        component.startGame();

        expect(mockNotificationService.showMessage).toHaveBeenCalledWith('La salle doit être verrouillée pour démarrer la partie.');
    });

    it('should emit startGame event if conditions are met in startGame', () => {
        component.players = Array.from({ length: MIN_PLAYERS }, () => ({}) as Player);
        component['maxPlayers'] = MIN_PLAYERS;
        component['roomLocked'] = true;
        spyOn(mockSocketService, 'emitStartGame');

        component.startGame();

        expect(mockSocketService.emitStartGame).toHaveBeenCalledWith('testSessionCode');
    });
    it('should call socketService.excludePlayer with correct parameters in excludePlayer', () => {
        const testPlayer: Player = { socketId: 'playerSocketId', name: 'TestPlayer', isOrganizer: false, avatar: 'avatar.png', attributes: {} };
        spyOn(mockSocketService, 'excludePlayer');

        component.excludePlayer(testPlayer);

        expect(mockSocketService.excludePlayer).toHaveBeenCalledWith('testSessionCode', 'playerSocketId');
    });
    it('should set selectedPlayer and show the popup when openConfirmationPopup is called with a player', () => {
        const testPlayer: Player = {
            socketId: 'playerSocketId',
            name: 'TestPlayer',
            isOrganizer: false,
            avatar: 'avatar.png',
            attributes: {},
        };

        component.openConfirmationPopup(testPlayer);

        expect(component.selectedPlayer).toBe(testPlayer);
        expect(component.popupVisible).toBeTrue();
    });

    it('should not show the popup if openConfirmationPopup is called with no player', () => {
        component.openConfirmationPopup(null as unknown as Player);

        expect(component.selectedPlayer).toBeNull();
        expect(component.popupVisible).toBeFalse();
    });
    it('should call socketService.excludePlayer when confirmExclusion is called', () => {
        const testPlayer: Player = {
            socketId: 'playerSocketId',
            name: 'TestPlayer',
            isOrganizer: false,
            avatar: 'avatar.png',
            attributes: {},
        };
        component.selectedPlayer = testPlayer;
        component.popupVisible = true;
        spyOn(mockSocketService, 'excludePlayer');

        component.confirmExclusion();

        expect(mockSocketService.excludePlayer).toHaveBeenCalledWith('testSessionCode', 'playerSocketId');
        expect(component.popupVisible).toBeFalse();
        expect(component.selectedPlayer).toBeNull();
    });
    it('should not toggle roomLocked if room is locked and max players are reached', () => {
        component['isOrganizer'] = true;
        component['roomLocked'] = true;
        component['maxPlayers'] = 4;
        component.players = Array.from({ length: 4 }, () => ({}) as Player);
        spyOn(mockSocketService, 'toggleRoomLock');
        spyOn(mockNotificationService, 'showMessage');

        component.toggleLock();

        expect(component['roomLocked']).toBeTrue();
        expect(mockSocketService.toggleRoomLock).not.toHaveBeenCalled();
        expect(mockNotificationService.showMessage).toHaveBeenCalledWith(
            'Vous ne pouvez pas déverrouiller la salle car le nombre maximum de joueurs est atteint.',
        );
    });

    it('should toggle roomLocked and call socketService.toggleRoomLock when conditions are met', () => {
        component['roomLocked'] = false;
        component['maxPlayers'] = 4;
        component.players = Array.from({ length: 3 }, () => ({}) as Player);
        spyOn(mockSocketService, 'toggleRoomLock');

        component.toggleLock();

        expect(component['roomLocked']).toBeTrue();
        expect(mockSocketService.toggleRoomLock).toHaveBeenCalledWith('testSessionCode', true);
    });
    it('should hide the popup and reset selectedPlayer in cancelExclusion', () => {
        component.popupVisible = true;
        component.selectedPlayer = { socketId: 'testSocketId', name: 'Test Player', isOrganizer: false, avatar: 'avatar.png', attributes: {} };

        component.cancelExclusion();

        expect(component.popupVisible).toBeFalse();
        expect(component.selectedPlayer).toBeNull();
    });
    it('should navigate to home if reload is called and waitingPageReloaded is true', () => {
        sessionStorage.setItem('waitingPageReloaded', 'true');
        const navigateSpy = mockSessionService.router.navigate as jasmine.Spy;

        (component as any).reload();

        expect(navigateSpy).toHaveBeenCalledWith(['/']);
        sessionStorage.removeItem('waitingPageReloaded');
    });
    it('should initialize sessionCode and gameId', () => {
        spyOn(mockSessionService.route.snapshot.queryParamMap, 'get').and.callFake((param: string) => {
            return param === 'sessionCode' ? 'testSessionCode' : 'testGameId';
        });

        (component as any).initializeSessionCode();

        expect(component['sessionCode']).toBe('testSessionCode');
        expect(component['gameId']).toBe('testGameId');
        expect(component['accessCode']).toBe('testSessionCode');
    });

    it('should navigate to home if sessionCode is missing in initializeSessionCode', () => {
        spyOn(mockSessionService.route.snapshot.queryParamMap, 'get').and.returnValue(null);
        const navigateSpy = mockSessionService.router.navigate as jasmine.Spy;

        (component as any).initializeSessionCode();

        expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });
    it('should navigate to home if gameId is missing in loadGameData', () => {
        component['gameId'] = null;
        const navigateSpy = mockSessionService.router.navigate as jasmine.Spy;

        (component as any).loadGameData();

        expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });
    it('should load game and set selectedGame and maxPlayers in loadGame', () => {
        const testGame: Game = {
            _id: 'gameId',
            name: 'Test Game',
            size: 'medium',
            description: 'A test game description',
            mode: 'solo',
            image: 'test-image-url',
            date: new Date(),
            visibility: true,
            grid: [[{ images: [], isOccuped: false }]],
        };

        spyOn(mockGameFacadeService, 'fetchGame').and.returnValue(of(testGame));
        spyOn(mockGameValidateService, 'gridMaxPlayers').and.returnValue(4);

        (component as any).loadGame('gameId');

        expect(mockGameFacadeService.fetchGame).toHaveBeenCalledWith('gameId');
        expect(component['selectedGame']).toEqual(testGame);
        expect(component['maxPlayers']).toBe(4);
        expect(mockGameValidateService.gridMaxPlayers).toHaveBeenCalledWith(testGame);
    });
    it('should lock room and call toggleRoomLock if players reach maxPlayers', () => {
        component.players = Array.from({ length: 4 }, () => ({}) as Player);
        component['maxPlayers'] = 4;
        component['isOrganizer'] = true;
        spyOn(mockSocketService, 'toggleRoomLock');
        spyOn(mockNotificationService, 'showMessage');

        (component as any).lockRoomIfMaxPlayersReached();

        expect(component['roomLocked']).toBeTrue();
        expect(mockSocketService.toggleRoomLock).toHaveBeenCalledWith('testSessionCode', true);
        expect(mockNotificationService.showMessage).toHaveBeenCalledWith(
            'La salle est automatiquement verrouillée car le nombre maximum de joueurs est atteint.',
        );
    });
    it('should update players and set organizer when player list updates', () => {
        const testPlayers: Player[] = [
            { socketId: 'test-socket-id', name: 'Test Player', avatar: 'avatar.png', isOrganizer: true, attributes: {} },
            { socketId: 'other-socket-id', name: 'Other Player', avatar: 'avatar2.png', isOrganizer: false, attributes: {} },
        ];
        spyOn(mockSessionService, 'updatePlayerData');
        spyOn(component as any, 'updatePlayersList');
        spyOn(component as any, 'updateCurrentPlayerDetails');
        spyOn(component as any, 'lockRoomIfMaxPlayersReached');

        (component as any).subscribeToPlayerListUpdate();
        mockSocketService.triggerPlayerListUpdate(testPlayers);

        expect(component.players).toEqual(testPlayers);
        expect(component['isOrganizer']).toBeTrue();
        expect(mockSessionService.updatePlayerData).toHaveBeenCalledWith(testPlayers[0]);
        expect((component as any).updatePlayersList).toHaveBeenCalledWith(testPlayers);
        expect((component as any).updateCurrentPlayerDetails).toHaveBeenCalled();
        expect((component as any).lockRoomIfMaxPlayersReached).toHaveBeenCalled();
    });
    it('should show message and navigate to home on onExcluded event', () => {
        spyOn(mockNotificationService, 'showMessage');
        const navigateSpy = mockSessionService.router.navigate as jasmine.Spy;

        (component as any).subscribeToExclusion();
        mockSocketService.triggerExcluded('You have been excluded');

        expect(mockNotificationService.showMessage).toHaveBeenCalledWith('You have been excluded');
        expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });
    it('should update roomLocked when onRoomLocked event is received', () => {
        (component as any).subscribeToRoomLock();

        mockSocketService.triggerRoomLocked(true);

        expect(component['roomLocked']).toBeTrue();

        mockSocketService.triggerRoomLocked(false);

        expect(component['roomLocked']).toBeFalse();
    });
    it('should show message and navigate to home when onSessionDeleted event is received', () => {
        spyOn(mockNotificationService, 'showMessage');
        const navigateSpy = mockSessionService.router.navigate as jasmine.Spy;

        (component as any).subscribeToSessionDeletion();

        mockSocketService.triggerSessionDeleted('Session deleted');

        expect(mockNotificationService.showMessage).toHaveBeenCalledWith('Session deleted');
        expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });
    it('should navigate to /game with sessionCode when onGameStarted event is received', () => {
        const navigateSpy = mockSessionService.router.navigate as jasmine.Spy;

        (component as any).subscribeToGameStarted();

        mockSocketService.triggerGameStarted('testSessionCode');

        expect(navigateSpy).toHaveBeenCalledWith(['/game'], {
            queryParams: {
                sessionCode: 'testSessionCode',
            },
        });
    });
    it('should return the correct playerName', () => {
        expect(component.playerName).toBe('Test Player');
    });

    it('should return the correct leaveSessionMessage', () => {
        mockSessionService.leaveSessionMessage = 'Test Message';
        expect(component.leaveSessionMessage).toBe('Test Message');
    });

    it('should return the correct sessionCode', () => {
        expect(component.sessionCode).toBe('testSessionCode');
    });

    it('should return the correct leaveSessionPopupVisible', () => {
        mockSessionService.leaveSessionPopupVisible = true;
        expect(component.leaveSessionPopupVisible).toBeTrue();
    });
});
