/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable import/no-deprecated */
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/game-model.interface';
import { Player } from '@app/interfaces/player.interface';
import { WaitingFacadeService } from '@app/services/facade/waitingFacade.service';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { SessionService } from '@app/services/session/session.service';
import { GameValidateService } from '@app/services/validate-game/gameValidate.service';
import { of } from 'rxjs';
import { WaitingViewComponent } from './waiting-page.component';

describe('WaitingViewComponent', () => {
    let component: WaitingViewComponent;
    let fixture: ComponentFixture<WaitingViewComponent>;
    let waitingFacadeSpy: jasmine.SpyObj<WaitingFacadeService>;
    let sessionServiceSpy: jasmine.SpyObj<SessionService>;
    let gameFacadeSpy: jasmine.SpyObj<GameFacadeService>;
    let gameValidateSpy: jasmine.SpyObj<GameValidateService>;
    const mockGame: Game = {
        _id: 'game123',
        name: 'Test Game',
        description: 'This is a test game description',
        size: 'medium',
        mode: 'standard',
        image: 'test-image.png',
        date: new Date(),
        visibility: true,
        grid: [[{ images: ['grass.png'], isOccuped: false }]],
    };

    beforeEach(() => {
        waitingFacadeSpy = jasmine.createSpyObj('WaitingFacadeService', [
            'getSocketId',
            'message',
            'emitStartGame',
            'toggleRoomLock',
            'excludePlayer',
            'onPlayerListUpdate',
            'onRoomLocked',
            'onSessionDeleted',
            'onExcluded',
            'onGameStarted',
        ]);

        sessionServiceSpy = jasmine.createSpyObj(
            'SessionService',
            ['leaveSession', 'confirmLeaveSession', 'cancelLeaveSession', 'updatePlayersList', 'updateCurrentPlayerDetails'],
            {
                playerName: 'Test Player',
                sessionCode: '1234',
                leaveSessionMessage: 'Session ended',
                leaveSessionPopupVisible: false,
                route: {
                    snapshot: {
                        queryParamMap: {
                            get: (key: string) => {
                                if (key === 'sessionCode') return '1234';
                                if (key === 'gameId') return 'game123';
                                return null;
                            },
                        },
                    },
                },
                router: {
                    navigate: jasmine.createSpy('navigate'),
                },
            },
        );

        gameFacadeSpy = jasmine.createSpyObj('GameFacadeService', ['fetchGame']);
        gameValidateSpy = jasmine.createSpyObj('GameValidateService', ['gridMaxPlayers', 'isNumberPlayerValid']);
        gameFacadeSpy.fetchGame.and.returnValue(of(mockGame));
        waitingFacadeSpy.onPlayerListUpdate.and.returnValue(of({ players: [] }));
        waitingFacadeSpy.onRoomLocked.and.returnValue(of({ locked: false }));
        waitingFacadeSpy.onSessionDeleted.and.returnValue(of({ message: 'Session deleted' }));
        waitingFacadeSpy.onExcluded.and.returnValue(of({ message: 'You have been excluded' }));
        waitingFacadeSpy.onGameStarted.and.returnValue(of({ sessionCode: '1234' }));

        TestBed.configureTestingModule({
            declarations: [WaitingViewComponent],
            imports: [HttpClientModule],
            providers: [
                { provide: WaitingFacadeService, useValue: waitingFacadeSpy },
                { provide: SessionService, useValue: sessionServiceSpy },
                { provide: GameFacadeService, useValue: gameFacadeSpy },
                { provide: GameValidateService, useValue: gameValidateSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingViewComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should call leaveSession on sessionService', () => {
        component.leaveSession();
        expect(sessionServiceSpy.leaveSession).toHaveBeenCalled();
    });

    it('should call confirmLeaveSession on sessionService', () => {
        component.confirmLeaveSession();
        expect(sessionServiceSpy.confirmLeaveSession).toHaveBeenCalled();
    });

    it('should call cancelLeaveSession on sessionService', () => {
        component.cancelLeaveSession();
        expect(sessionServiceSpy.cancelLeaveSession).toHaveBeenCalled();
    });

    it('should emit start game when startGame is called and room is locked', () => {
        component.roomLocked = true;
        spyOn<any>(component, 'isNumberPlayerValid').and.returnValue(true);
        component.startGame();
        expect(waitingFacadeSpy.emitStartGame).toHaveBeenCalledWith('1234');
    });

    it('should show error message if number of players is invalid', () => {
        spyOn<any>(component, 'isNumberPlayerValid').and.returnValue(false);
        component.startGame();
        expect(waitingFacadeSpy.message).toHaveBeenCalledWith('Le nombre de joueurs ne respecte pas les limites de la carte de jeu.');
    });

    it('should show message if room is not locked when startGame is called', () => {
        component.roomLocked = false;
        spyOn<any>(component, 'isNumberPlayerValid').and.returnValue(true);
        component.startGame();
        expect(waitingFacadeSpy.message).toHaveBeenCalledWith('La salle doit être verrouillée pour démarrer la partie.');
    });

    it('should toggle room lock and call toggleRoomLock', () => {
        component.roomLocked = false;
        component.toggleLock();
        expect(component.roomLocked).toBeTrue();
        expect(waitingFacadeSpy.toggleRoomLock).toHaveBeenCalledWith('1234', true);
    });

    it('should not unlock the room if the number of players is at max and user is organizer', () => {
        component.roomLocked = true;
        component.players = Array(5);
        component.maxPlayers = 5;
        component.isOrganizer = true;
        component.toggleLock();
        expect(waitingFacadeSpy.message).toHaveBeenCalledWith(
            'Vous ne pouvez pas déverrouiller la salle car le nombre maximum de joueurs est atteint.',
        );
        expect(component.roomLocked).toBeTrue();
    });

    it('should call reload on ngOnInit', () => {
        spyOn<any>(component, 'reload');
        component.ngOnInit();
        expect(component['reload']).toHaveBeenCalled();
    });

    it('should call initializeSessionCode on ngOnInit', () => {
        spyOn<any>(component, 'initializeSessionCode');
        component.ngOnInit();
        expect(component['initializeSessionCode']).toHaveBeenCalled();
    });

    it('should call loadGameData on ngOnInit', () => {
        spyOn<any>(component, 'loadGameData');
        component.ngOnInit();
        expect(component['loadGameData']).toHaveBeenCalled();
    });

    it('should call loadGameData and navigate if gameId is missing', () => {
        spyOn<any>(component, 'loadGameData');
        component.gameId = null;
        component.ngOnInit();
        expect(component['loadGameData']).toHaveBeenCalled();
        expect(sessionServiceSpy.router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should call fetchGame when loadGame is called', () => {
        spyOn<any>(component, 'loadGame').and.callThrough();
        component['loadGame']('game123');
        expect(gameFacadeSpy.fetchGame).toHaveBeenCalledWith('game123');
    });

    it('should remove waitingPageReloaded from sessionStorage on ngOnDestroy', () => {
        spyOn(sessionStorage, 'removeItem');
        component.ngOnDestroy();
        expect(sessionStorage.removeItem).toHaveBeenCalledWith('waitingPageReloaded');
    });
    it('should update players list correctly on onPlayerListUpdate', () => {
        const players = [
            {
                socketId: 'testSocketId',
                name: 'Test Player',
                avatar: 'test-avatar.png',
                isOrganizer: true,
                inventory: [],
                statistics: {
                    combats: 0,
                    evasions: 0,
                    victories: 0,
                    defeats: 0,
                    totalLifeLost: 0,
                    totalLifeRemoved: 0,
                    uniqueItems: new Set<string>(),
                    tilesVisited: new Set<string>(),
                    uniqueItemsArray: [],
                    tilesVisitedArray: [],
                },
            },
        ];

        waitingFacadeSpy.onPlayerListUpdate.and.returnValue(of({ players }));
        component['subscribeToPlayerListUpdate']();
        expect(component.players).toEqual(players);
    });
    it('should call excludePlayer and hide confirmation popup', () => {
        const selectedPlayer = { socketId: 'player1' } as Player;
        component.selectedPlayer = selectedPlayer;
        sessionServiceSpy.sessionCode = '1234';

        component.confirmExclusion();

        expect(waitingFacadeSpy.excludePlayer).toHaveBeenCalledWith('1234', 'player1');
        expect(component.popupVisible).toBeFalse();
        expect(component.selectedPlayer).toBeNull();
    });
    it('should show message if room is locked and max players reached when toggleLock is called', () => {
        component.roomLocked = true;
        component.players = Array(5);
        component.maxPlayers = 5;
        component.isOrganizer = true;

        component.toggleLock();

        expect(waitingFacadeSpy.message).toHaveBeenCalledWith(
            'Vous ne pouvez pas déverrouiller la salle car le nombre maximum de joueurs est atteint.',
        );
        expect(component.roomLocked).toBeTrue();
    });
    describe('WaitingViewComponent additional tests', () => {
        it('should return the correct player name', () => {
            expect(component.playerName).toBe('Test Player');
        });

        it('should return the correct leave session message', () => {
            expect(component.leaveSessionMessage).toBe('Session ended');
        });

        it('should return the correct value for leaveSessionPopupVisible', () => {
            expect(component.leaveSessionPopupVisible).toBeFalse();
        });

        it('should call excludePlayer with correct parameters', () => {
            const player = { socketId: 'player1' } as Player;
            sessionServiceSpy.sessionCode = '1234';

            component.excludePlayer(player);

            expect(waitingFacadeSpy.excludePlayer).toHaveBeenCalledWith('1234', 'player1');
        });

        it('should open confirmation popup with selected player', () => {
            const player = { socketId: 'player1' } as Player;

            component.openConfirmationPopup(player);

            expect(component.selectedPlayer).toEqual(player);
            expect(component.popupVisible).toBeTrue();
        });

        it('should not open confirmation popup if player is null', () => {
            component.openConfirmationPopup(null as any);

            expect(component.selectedPlayer).toBeNull();
            expect(component.popupVisible).toBeFalse();
        });
    });
    it('should reset popupVisible and selectedPlayer on cancelExclusion', () => {
        component.popupVisible = true;
        component.selectedPlayer = { socketId: 'testSocketId', name: 'Test Player', avatar: 'test-avatar.png', isOrganizer: false } as Player;
        component.cancelExclusion();
        expect(component.popupVisible).toBeFalse();
        expect(component.selectedPlayer).toBeNull();
    });
    it('should return true if the number of players is valid', () => {
        component.players = Array(3);
        component.maxPlayers = 5;
        expect(component['isNumberPlayerValid']()).toBeTrue();
    });

    it('should return false if the number of players is less than minimum', () => {
        component.players = Array(1);
        component.maxPlayers = 5;
        expect(component['isNumberPlayerValid']()).toBeFalse();
    });

    it('should return false if the number of players exceeds maximum', () => {
        component.players = Array(6);
        component.maxPlayers = 5;
        expect(component['isNumberPlayerValid']()).toBeFalse();
    });
    describe('lockRoomIfMaxPlayersReached', () => {
        it('should lock the room if the number of players reaches the maximum', () => {
            component.players = Array(5);
            component.maxPlayers = 5;
            component.roomLocked = false;

            component['lockRoomIfMaxPlayersReached']();

            expect(component.roomLocked).toBeTrue();
        });

        it('should call toggleRoomLock with correct parameters when room is locked', () => {
            component.players = Array(5);
            component.maxPlayers = 5;
            component.roomLocked = false;
            sessionServiceSpy.sessionCode = '1234';

            component['lockRoomIfMaxPlayersReached']();

            expect(waitingFacadeSpy.toggleRoomLock).toHaveBeenCalledWith('1234', true);
        });

        it('should send a message if the user is the organizer and room is locked', () => {
            component.players = Array(5);
            component.maxPlayers = 5;
            component.roomLocked = false;
            component.isOrganizer = true;

            component['lockRoomIfMaxPlayersReached']();

            expect(waitingFacadeSpy.message).toHaveBeenCalledWith(
                'La salle est automatiquement verrouillée car le nombre maximum de joueurs est atteint.',
            );
        });

        it('should not send a message if the user is not the organizer', () => {
            component.players = Array(5);
            component.maxPlayers = 5;
            component.roomLocked = false;
            component.isOrganizer = false;

            component['lockRoomIfMaxPlayersReached']();

            expect(waitingFacadeSpy.message).not.toHaveBeenCalled();
        });

        it('should not lock the room if the number of players is below the maximum', () => {
            component.players = Array(4);
            component.maxPlayers = 5;
            component.roomLocked = false;

            component['lockRoomIfMaxPlayersReached']();

            expect(component.roomLocked).toBeFalse();
            expect(waitingFacadeSpy.toggleRoomLock).not.toHaveBeenCalled();
        });
    });
    it('should navigate to the root path if sessionCodeFromRoute is missing', () => {
        spyOn(sessionServiceSpy.route.snapshot.queryParamMap, 'get').and.callFake((key: string) => {
            if (key === 'sessionCode') return null;
            if (key === 'gameId') return 'game123';
            return null;
        });
        component['initializeSessionCode']();
        expect(sessionServiceSpy.router.navigate).toHaveBeenCalledWith(['/']);
    });
});
