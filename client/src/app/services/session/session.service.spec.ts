// import { TestBed } from '@angular/core/testing';
// import { Router, ActivatedRoute } from '@angular/router';
// import { of, Subject, BehaviorSubject } from 'rxjs';
// import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
// import { SocketService } from '@app/services/socket/socket.service';
// import { GameValidateService } from '@app/services/validate-game/gameValidate.service';
// import { SessionService } from '@app/services/session/session.service';
// import { Game } from '@app/interfaces/game-model.interface';
// import { Player } from '@app/interfaces/player.interface';
// import { Attribute } from '@app/interfaces/attributes.interface';

// describe('SessionService', () => {
//     let service: SessionService;
//     let mockRouter: jasmine.SpyObj<Router>;
//     let mockActivatedRoute: ActivatedRoute;
//     let mockGameFacadeService: jasmine.SpyObj<GameFacadeService>;
//     let mockSocketService: jasmine.SpyObj<SocketService>;
//     let mockGameValidateService: jasmine.SpyObj<GameValidateService>;

//     beforeEach(() => {
//         mockRouter = jasmine.createSpyObj('Router', ['navigate']);
//         mockActivatedRoute = {
//             queryParamMap: of({
//                 get: (key: string) => {
//                     switch (key) {
//                         case 'sessionCode': return 'testSessionCode';
//                         case 'gameId': return 'testGameId';
//                         case 'playerName': return 'testPlayer';
//                         case 'isOrganizer': return 'true';
//                         case 'playerAttributes':
//                             return JSON.stringify({
//                                 life: { name: 'Vie', description: 'Points de vie', currentValue: 4, baseValue: 4 },
//                                 speed: { name: 'Speed', description: 'Vitesse', currentValue: 6, baseValue: 6 },
//                             } as { [key: string]: Attribute });
//                         default: return null;
//                     }
//                 },
//             }),
//         } as unknown as ActivatedRoute;

//         mockGameFacadeService = jasmine.createSpyObj('GameFacadeService', ['fetchGame']);
//         mockGameFacadeService.fetchGame.and.returnValue(of({
//             name: 'Test Game',
//             description: 'Test Description',
//             size: '10x10',
//         } as Game));

//         mockSocketService = jasmine.createSpyObj('SocketService', ['leaveSession', 'deleteSession', 'onOrganizerLeft', 'onPlayerListUpdate', 'getSocketId']);
//         mockSocketService.onOrganizerLeft.and.returnValue(new Subject());
//         mockSocketService.onPlayerListUpdate.and.returnValue(new Subject());
//         mockSocketService.getSocketId.and.returnValue('123');

//         mockGameValidateService = jasmine.createSpyObj('GameValidateService', ['gridMaxPlayers']);
//         mockGameValidateService.gridMaxPlayers.and.returnValue(2);

//         TestBed.configureTestingModule({
//             providers: [
//                 SessionService,
//                 { provide: Router, useValue: mockRouter },
//                 { provide: ActivatedRoute, useValue: mockActivatedRoute },
//                 { provide: GameFacadeService, useValue: mockGameFacadeService },
//                 { provide: SocketService, useValue: mockSocketService },
//                 { provide: GameValidateService, useValue: mockGameValidateService },
//             ],
//         });

//         service = TestBed.inject(SessionService);
//     });

//     it('should be created', () => {
//         expect(service).toBeTruthy();
//     });

//     it('should initialize game on initializeGame call', () => {
//         service.initializeGame();
//         expect(service.sessionCode).toBe('testSessionCode');
//         expect(service.gameId).toBe('testGameId');
//         expect(mockGameFacadeService.fetchGame).toHaveBeenCalledWith('testGameId');
//     });

//     it('should initialize player on initializePlayer call', () => {
//         service.initializePlayer();
//         expect(service.playerName).toBe('testPlayer');
//         expect(service.isOrganizer).toBeTrue();
//         expect(service.playerAttributes).toEqual({
//             life: { name: 'Vie', description: 'Points de vie', currentValue: 4, baseValue: 4 },
//             speed: { name: 'Speed', description: 'Vitesse', currentValue: 6, baseValue: 6 },
//         });
//     });

//     it('should set and get current player socket ID', () => {
//         const testSocketId = 'socket-123';
//         service.setCurrentPlayerSocketId(testSocketId);
//         service.currentPlayerSocketId$.subscribe((socketId) => {
//             expect(socketId).toBe(testSocketId);
//         });
//     });

//     it('should display the correct leaveSessionMessage based on isOrganizer flag', () => {
//         service.isOrganizer = true;
//         service.leaveSession();
//         expect(service.leaveSessionPopupVisible).toBeTrue();
//         expect(service.leaveSessionMessage).toBe("En tant qu'organisateur, quitter la partie entraînera sa suppression. Voulez-vous vraiment continuer ?");

//         service.isOrganizer = false;
//         service.leaveSession();
//         expect(service.leaveSessionPopupVisible).toBeTrue();
//         expect(service.leaveSessionMessage).toBe('Voulez-vous vraiment quitter la partie ?');
//     });

//     it('should navigate to /home and delete session if confirmLeaveSession is called by an organizer', () => {
//         service.sessionCode = 'testSessionCode';
//         service.isOrganizer = true;
//         service.confirmLeaveSession();
//         expect(mockSocketService.leaveSession).toHaveBeenCalledWith('testSessionCode');
//         expect(mockSocketService.deleteSession).toHaveBeenCalledWith('testSessionCode');
//         expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
//         expect(service.leaveSessionPopupVisible).toBeFalse();
//     });

//     it('should navigate to /home without deleting session if confirmLeaveSession is called by non-organizer', () => {
//         service.sessionCode = 'testSessionCode';
//         service.isOrganizer = false;
//         service.confirmLeaveSession();
//         expect(mockSocketService.leaveSession).toHaveBeenCalledWith('testSessionCode');
//         expect(mockSocketService.deleteSession).not.toHaveBeenCalled();
//         expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
//     });

//     it('should set leaveSessionPopupVisible to false when cancelLeaveSession is called', () => {
//         service.leaveSessionPopupVisible = true;
//         service.cancelLeaveSession();
//         expect(service.leaveSessionPopupVisible).toBeFalse();
//     });

//     it('should navigate to /home when organizer leaves the game', () => {
//         const organizerLeftSubject = new Subject<void>();
//         mockSocketService.onOrganizerLeft.and.returnValue(organizerLeftSubject.asObservable());
//         service.subscribeToOrganizerLeft();
//         organizerLeftSubject.next();
//         expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
//     });

//     it('should update players and set organizer when player list updates', () => {
//         const mockPlayerList = [
//             { socketId: '123', name: 'Player1', avatar: 'avatar1', isOrganizer: true, attributes: {} },
//         ];
//         const updateSubject = new Subject<{ players: typeof mockPlayerList }>();
//         mockSocketService.onPlayerListUpdate.and.returnValue(updateSubject.asObservable());
//         service.subscribeToPlayerListUpdate();

//         updateSubject.next({ players: mockPlayerList });

//         expect(service.players).toEqual(mockPlayerList);
//         expect(service.isOrganizer).toBeTrue();
//         expect(service.playerNames).toEqual(['Player1']);
//     });

//     it('should correctly update player data', () => {
//         const player: Player = {
//             socketId: '123',
//             name: 'TestPlayer',
//             avatar: 'avatar.png',
//             isOrganizer: true,
//             attributes: { strength: { value: 10, max: 100 } }
//         };
//         service.updatePlayerData(player);

//         expect(service.playerName).toBe(player.name);
//         expect(service.playerAvatar).toBe(player.avatar);
//         expect(service.playerAttributes).toEqual(player.attributes);
//     });

//     it('should update players list', () => {
//         const players: Player[] = [
//             { socketId: '123', name: 'Player1', avatar: 'avatar1', isOrganizer: true, attributes: {} },
//             { socketId: '124', name: 'Player2', avatar: 'avatar2', isOrganizer: false, attributes: {} }
//         ];
//         service.updatePlayersList(players);
//         expect(service.players).toEqual(players);
//     });

//     it('should update current player details correctly', () => {
//         const players: Player[] = [
//             { socketId: '123', name: 'Player1', avatar: 'avatar1', isOrganizer: true, attributes: {} },
//             { socketId: '124', name: 'Player2', avatar: 'avatar2', isOrganizer: false, attributes: {} }
//         ];
//         mockSocketService.getSocketId.and.returnValue('123');
//         service.players = players;

//         service.updateCurrentPlayerDetails();

//         expect(service.isOrganizer).toBeTrue();
//         expect(service.playerName).toBe('Player1');
//     });
// });
