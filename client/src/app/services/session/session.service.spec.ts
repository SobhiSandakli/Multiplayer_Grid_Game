import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Player } from '@app/interfaces/player.interface';
import { SessionService } from '@app/services/session/session.service';
import { of, Subject } from 'rxjs';
import { SessionFacadeService } from '../facade/sessionFacade.service';

describe('SessionService', () => {
    let service: SessionService;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockActivatedRoute: ActivatedRoute;
    let mockSocketService: jasmine.SpyObj<SessionFacadeService>;

    beforeEach(() => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockActivatedRoute = {
            queryParamMap: of({
                get: (key: string) => {
                    switch (key) {
                        case 'sessionCode':
                            return 'testSessionCode';
                        default:
                            return null;
                    }
                },
            }),
        } as unknown as ActivatedRoute;

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
        const mockPlayerList: Player[] = [{ socketId: '123', name: 'Player1', avatar: 'avatar1', isOrganizer: true, attributes: {} }];
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
        };
        service.updatePlayerData(player);

        expect(service.playerName).toBe(player.name);
        expect(service.playerAvatar).toBe(player.avatar);
        expect(service.playerAttributes).toEqual(player.attributes);
    });

    it('should update players list', () => {
        const players: Player[] = [
            { socketId: '123', name: 'Player1', avatar: 'avatar1', isOrganizer: true, attributes: {} },
            { socketId: '124', name: 'Player2', avatar: 'avatar2', isOrganizer: false, attributes: {} },
        ];
        service.updatePlayersList(players);
        expect(service.players).toEqual(players);
    });

    it('should update current player details correctly', () => {
        const players: Player[] = [
            { socketId: '123', name: 'Player1', avatar: 'avatar1', isOrganizer: true, attributes: {} },
            { socketId: '124', name: 'Player2', avatar: 'avatar2', isOrganizer: false, attributes: {} },
        ];
        mockSocketService.getSocketId.and.returnValue('123');
        service.players = players;

        service.updateCurrentPlayerDetails();

        expect(service.isOrganizer).toBeTrue();
        expect(service.playerName).toBe('Player1');
    });
});
