import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { SocketService } from '@app/services/socket/socket.service';
import { GameValidateService } from '@app/services/validate-game/gameValidate.service';
import { SessionService } from '@app/services/session/session.service';
import { Game } from '@app/interfaces/game-model.interface';
import { Attribute } from '@app/interfaces/attributes.interface';

describe('SessionService', () => {
    let service: SessionService;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockRouter: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockActivatedRoute: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockGameFacadeService: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockSocketService: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockGameValidateService: any;

    beforeEach(() => {
        mockRouter = {
            navigate: jasmine.createSpy('navigate'),
        };
        mockActivatedRoute = {
            queryParamMap: of({
                get: (key: string) => {
                    switch (key) {
                        case 'sessionCode':
                            return 'testSessionCode';
                        case 'gameId':
                            return 'testGameId';
                        case 'playerName':
                            return 'testPlayer';
                        case 'isOrganizer':
                            return 'true';
                        case 'playerAttributes':
                            return JSON.stringify({
                                life: { name: 'Vie', description: 'Points de vie', currentValue: 4, baseValue: 4 },
                                speed: { name: 'Speed', description: 'Vitesse', currentValue: 6, baseValue: 6 },
                            } as { [key: string]: Attribute });
                        default:
                            return null;
                    }
                },
            }),
        };
        mockGameFacadeService = {
            fetchGame: jasmine.createSpy('fetchGame').and.returnValue(
                of({
                    name: 'Test Game',
                    description: 'Test Description',
                    size: '10x10',
                } as Game),
            ),
        };
        mockSocketService = {
            leaveSession: jasmine.createSpy('leaveSession'),
            deleteSession: jasmine.createSpy('deleteSession'),
            onOrganizerLeft: jasmine.createSpy('onOrganizerLeft').and.returnValue(new Subject()),
        };
        mockGameValidateService = {
            gridMaxPlayers: jasmine.createSpy('gridMaxPlayers').and.returnValue(2),
        };

        TestBed.configureTestingModule({
            providers: [
                SessionService,
                { provide: Router, useValue: mockRouter },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: GameFacadeService, useValue: mockGameFacadeService },
                { provide: SocketService, useValue: mockSocketService },
                { provide: GameValidateService, useValue: mockGameValidateService },
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
        expect(service.gameId).toBe('testGameId');
        expect(mockGameFacadeService.fetchGame).toHaveBeenCalledWith('testGameId');
    });

    it('should initialize player on initializePlayer call', () => {
        service.initializePlayer();
        expect(service.playerName).toBe('testPlayer');
        expect(service.isOrganizer).toBe(true);
        expect(service.playerAttributes).toEqual({
            life: { name: 'Vie', description: 'Points de vie', currentValue: 4, baseValue: 4 },
            speed: { name: 'Speed', description: 'Vitesse', currentValue: 6, baseValue: 6 },
        });
    });

    it('should set the correct leaveSessionMessage based on isOrganizer flag', () => {
        // Test when the player is an organizer
        service.isOrganizer = true;
        service.leaveSession();
        expect(service.leaveSessionPopupVisible).toBe(true);
        expect(service.leaveSessionMessage).toBe(
            "En tant qu'organisateur, quitter la partie entraînera sa suppression. Voulez-vous vraiment continuer ?",
        );

        // Test when the player is not an organizer
        service.isOrganizer = false;
        service.leaveSession();
        expect(service.leaveSessionPopupVisible).toBe(true);
        expect(service.leaveSessionMessage).toBe('Voulez-vous vraiment quitter la partie ?');
    });

    it('should navigate to /home and delete session if confirmLeaveSession is called and organizer', () => {
        service.sessionCode = 'testSessionCode';
        service.isOrganizer = true;
        service.confirmLeaveSession();
        expect(mockSocketService.leaveSession).toHaveBeenCalledWith('testSessionCode');
        expect(mockSocketService.deleteSession).toHaveBeenCalledWith('testSessionCode');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should navigate to /home without deleting session if confirmLeaveSession is called and not organizer', () => {
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
        expect(service.leaveSessionPopupVisible).toBe(false);
    });

    it('should navigate to /home when organizer leaves the game', () => {
        const organizerLeftSubject = new Subject<void>();
        mockSocketService.onOrganizerLeft.and.returnValue(organizerLeftSubject.asObservable());
        service.subscribeToOrganizerLeft();
        organizerLeftSubject.next();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should unsubscribe from all subscriptions on ngOnDestroy', () => {
        const unsubscribeSpy = spyOn(service['subscriptions'], 'unsubscribe').and.callThrough();
        service.ngOnDestroy();
        expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should leave the session if organizer on ngOnDestroy', () => {
        service.isOrganizer = true;
        service.sessionCode = 'testSessionCode';
        service.ngOnDestroy();
        expect(mockSocketService.leaveSession).toHaveBeenCalledWith('testSessionCode');
    });

    it('should not leave the session if not an organizer on ngOnDestroy', () => {
        service.isOrganizer = false;
        service.sessionCode = 'testSessionCode';
        service.ngOnDestroy();
        expect(mockSocketService.leaveSession).not.toHaveBeenCalled();
    });
});
