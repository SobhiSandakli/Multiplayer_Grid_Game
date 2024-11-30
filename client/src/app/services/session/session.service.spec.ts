/* eslint-disable */
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '@app/interfaces/game-model.interface';
import { Player } from '@app/interfaces/player.interface';
import { SessionFacadeService } from '@app/services/session-facade/sessionFacade.service';
import { SessionService } from '@app/services/session/session.service';
import { BehaviorSubject, of, Subject } from 'rxjs';

describe('SessionService', () => {
    let service: SessionService;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockActivatedRoute: ActivatedRoute;
    let mockSocketService: jasmine.SpyObj<SessionFacadeService>;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

    beforeEach(() => {
        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
            queryParamMap: of({
                get: (key: string) => (key === 'sessionCode' ? 'testSessionCode' : null),
            }),
        });

        mockSocketService = jasmine.createSpyObj('SocketService', [
            'leaveSession',
            'deleteSession',
            'onOrganizerLeft',
            'onPlayerListUpdate',
            'getSocketId',
        ]);
        mockSocketService.onOrganizerLeft.and.returnValue(new Subject<void>().asObservable());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockSocketService.onPlayerListUpdate.and.returnValue(new Subject<any>().asObservable());
        mockSocketService.getSocketId.and.returnValue('123');

        TestBed.configureTestingModule({
            providers: [
                SessionService,
                { provide: Router, useValue: mockRouter },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: SessionFacadeService, useValue: mockSocketService },
                { provide: MatSnackBar, useValue: snackBarSpy },
            ],
        });

        service = TestBed.inject(SessionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize game on initializeGame call', () => {
        service.initializeGame();
        expect(service.sessionCode).toBe('testSessionCode');
    });

    it('should set and get current player socket ID', () => {
        const testSocketId = 'socket-123';
        service.setCurrentPlayerSocketId(testSocketId);
        service.currentPlayerSocketId$.subscribe((socketId) => {
            expect(socketId).toBe(testSocketId);
        });
    });

    it('should display the correct leaveSessionMessage based on isOrganizer flag', () => {
        service.isOrganizer = true;
        service.leaveSession();
        expect(service.leaveSessionPopupVisible).toBeTrue();
        expect(service.leaveSessionMessage).toBe(
            "En tant qu'organisateur, quitter la partie entraînera sa suppression. Voulez-vous vraiment continuer ?",
        );

        service.isOrganizer = false;
        service.leaveSession();
        expect(service.leaveSessionPopupVisible).toBeTrue();
        expect(service.leaveSessionMessage).toBe('Voulez-vous vraiment quitter la partie ?');
    });

    it('should navigate to /home and delete session if confirmLeaveSession is called by an organizer', () => {
        service.sessionCode = 'testSessionCode';
        service.isOrganizer = true;
        service.confirmLeaveSession();
        expect(mockSocketService.leaveSession).toHaveBeenCalledWith('testSessionCode');
        expect(mockSocketService.deleteSession).toHaveBeenCalledWith('testSessionCode');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
        expect(service.leaveSessionPopupVisible).toBeFalse();
    });

    it('should navigate to /home without deleting session if confirmLeaveSession is called by non-organizer', () => {
        service.sessionCode = 'testSessionCode';
        service.isOrganizer = false;
        service.confirmLeaveSession();
        expect(mockSocketService.leaveSession).toHaveBeenCalledWith('testSessionCode');
        expect(mockSocketService.deleteSession).not.toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should set leaveSessionPopupVisible to false when cancelLeaveSession is called', () => {
        service.leaveSessionPopupVisible = true;
        service.cancelLeaveSession();
        expect(service.leaveSessionPopupVisible).toBeFalse();
    });

    it('should navigate to /home when organizer leaves the game', () => {
        const organizerLeftSubject = new Subject<void>();
        mockSocketService.onOrganizerLeft.and.returnValue(organizerLeftSubject.asObservable());
        service.subscribeToOrganizerLeft();
        organizerLeftSubject.next();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should update players and set organizer when player list updates', () => {
        const mockPlayerList: Player[] = [
            {
                socketId: '123',
                name: 'Player1',
                avatar: 'avatar1',
                isOrganizer: true,
                attributes: {},
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
        const updateSubject = new Subject<{ players: Player[] }>();
        mockSocketService.onPlayerListUpdate.and.returnValue(updateSubject.asObservable());
        service.subscribeToPlayerListUpdate();

        updateSubject.next({ players: mockPlayerList });

        expect(service.players).toEqual(mockPlayerList);
        expect(service.isOrganizer).toBeTrue();
        expect(service.playerNames).toEqual(['Player1']);
    });

    it('should correctly update player data', () => {
        const player: Player = {
            socketId: '123',
            name: 'TestPlayer',
            avatar: 'avatar.png',
            isOrganizer: true,
            attributes: { strength: { name: 'Strength', description: 'Physical power', baseValue: 10, currentValue: 10 } },
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
        };
        service.updatePlayerData(player);

        expect(service.playerName).toBe(player.name);
        expect(service.playerAvatar).toBe(player.avatar);
        expect(service.playerAttributes).toEqual(player.attributes);
    });

    it('should update players list', () => {
        const players: Player[] = [
            {
                socketId: '123',
                name: 'Player1',
                avatar: 'avatar1',
                isOrganizer: true,
                attributes: {},
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
            {
                socketId: '124',
                name: 'Player2',
                avatar: 'avatar2',
                isOrganizer: false,
                attributes: {},
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
        service.updatePlayersList(players);
        expect(service.players).toEqual(players);
    });

    it('should update current player details correctly', () => {
        const players: Player[] = [
            {
                socketId: '123',
                name: 'Player1',
                avatar: 'avatar1',
                isOrganizer: true,
                attributes: {},
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
            {
                socketId: '124',
                name: 'Player2',
                avatar: 'avatar2',
                isOrganizer: false,
                attributes: {},
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
        mockSocketService.getSocketId.and.returnValue('123');
        service.players = players;

        service.updateCurrentPlayerDetails();

        expect(service.isOrganizer).toBeTrue();
        expect(service.playerName).toBe('Player1');
    });

    it('should current details player details correctly and set isOrganizer to false', () => {
        const players: Player[] = [
            {
                socketId: '123',
                name: 'Player1',
                avatar: 'avatar1',
                isOrganizer: false,
                attributes: {},
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
        mockSocketService.getSocketId.and.returnValue('124');
        service.players = players;
        service.updateCurrentPlayerDetails();
        expect(service.isOrganizer).toBeFalse();
    });

    it('should call snackBar.open with the correct parameters', () => {
        const message = 'Test Message';
        const action = 'Close';
        const duration = 3000;
        const panelClass = ['custom-snackbar'];

        service.openSnackBar(message, action);

        expect(snackBarSpy.open).toHaveBeenCalledWith(message, action, {
            duration,
            panelClass,
        });
    });

    it('should use default action "OK" if none is provided', () => {
        const message = 'Test Default Action';
        const duration = 3000;
        const panelClass = ['custom-snackbar'];

        service.openSnackBar(message);

        expect(snackBarSpy.open).toHaveBeenCalledWith(message, 'OK', {
            duration,
            panelClass,
        });
    });
    it('should return the current player socket ID', () => {
        // Arrange
        const testSocketId = 'socket-123';
        service.setCurrentPlayerSocketId(testSocketId);

        // Act
        const result = service.currentPlayerSocketId;

        // Assert
        expect(result).toBe(testSocketId);
    });

    it('should return undefined if no player matches the current socket ID', () => {
        // Arrange
        const testPlayers: Player[] = [
            {
                socketId: '123',
                name: 'Player1',
                avatar: 'avatar1',
                isOrganizer: true,
                attributes: {},
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
            {
                socketId: '124',
                name: 'Player2',
                avatar: 'avatar2',
                isOrganizer: false,
                attributes: {},
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
        service.players = testPlayers;
        mockSocketService.getSocketId.and.returnValue('125'); // No match

        // Act
        const currentPlayer = service.getCurrentPlayer();

        // Assert
        expect(currentPlayer).toBeUndefined();
    });

    it('should reset all properties to their initial state', () => {
        // Set initial values to ensure reset works as expected
        service.playerAvatar = 'TestAvatar';
        service.selectedGame = {
            _id: '12345',
            name: 'Test Game',
            description: 'Test Description',
            size: '4',
            mode: 'Test Mode',
            image: 'Test Image',
            date: new Date(),
            visibility: true,
            grid: [[{ images: ['Test Image'], isOccuped: false }]],
        } as Game;
        service.playerAttributes = {
            health: {
                name: 'Health',
                description: 'Player health',
                baseValue: 100,
                currentValue: 100,
            },
        };
        service.isOrganizer = true;
        service.leaveSessionPopupVisible = true;
        service.leaveSessionMessage = 'Test Message';
        service.gameId = '12345';
        service.playerNames = ['Player1', 'Player2'];
        (service as any).playerInventorySubject = new BehaviorSubject(['Item1', 'Item2']);
        (service as any).currentPlayerSocketIdSubject = new BehaviorSubject('TestSocketId');

        // Call the reset method
        service.reset();

        // Verify each property is reset to its default value
        expect(service.playerAvatar).toBe('');
        expect(service.selectedGame).toEqual({
            _id: '',
            name: '',
            description: '',
            size: '',
            mode: '',
            image: '',
            date: new Date(),
            visibility: false,
            grid: [],
        });
        expect(service.playerAttributes).toEqual({});
        expect(service.isOrganizer).toBeFalse();
        expect(service.leaveSessionPopupVisible).toBeFalse();
        expect(service.leaveSessionMessage).toBe('');
        expect(service.gameId).toBeNull();
        expect(service.playerNames).toEqual([]);
        expect((service as any).playerInventorySubject.value).toEqual([]);
        expect((service as any).currentPlayerSocketIdSubject.value).toBeNull();
    });
});
