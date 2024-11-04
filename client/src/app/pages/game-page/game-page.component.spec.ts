// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { MatSnackBar } from '@angular/material/snack-bar';
// import { GamePageComponent } from './game-page.component';
// import { SessionService } from '@app/services/session/session.service';
// import { SocketService } from '@app/services/socket/socket.service';
// import { Router } from '@angular/router';
// import { of } from 'rxjs';
// import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
// import { TURN_NOTIF_DURATION } from 'src/constants/game-constants';

// describe('GamePageComponent', () => {
//     let component: GamePageComponent;
//     let fixture: ComponentFixture<GamePageComponent>;
//     let mockSessionService: Partial<SessionService>;
//     let mockSocketService: Partial<SocketService>;
//     let mockSnackBar: Partial<MatSnackBar>;
//     const mockRouter = { navigate: jasmine.createSpy('navigate') };

//     beforeEach(async () => {
//         mockSessionService = {
//             sessionCode: 'testSessionCode',
//             selectedGame: { 
//                 name: 'Test Game', 
//                 size: '10x10', 
//                 description: 'A test game description', 
//                 _id: '', 
//                 mode: '', 
//                 image: '', 
//                 date: new Date(),
//                 visibility: false,
//                 grid: []
//             },
//             playerName: 'Test Player',
//             playerAvatar: 'testAvatar',
//             playerAttributes: { life: {
//                 currentValue: 10, baseValue: 10,
//                 name: '',
//                 description: ''
//             }, speed: {
//                 currentValue: 5, baseValue: 5,
//                 name: '',
//                 description: ''
//             } },
//             players: [{ socketId: '123', name: 'Test Player', avatar: 'testAvatar', isOrganizer: true }],
//             isOrganizer: true,
//             leaveSessionPopupVisible: false,
//             leaveSession: jasmine.createSpy('leaveSession'),
//             confirmLeaveSession: jasmine.createSpy('confirmLeaveSession'),
//             cancelLeaveSession: jasmine.createSpy('cancelLeaveSession'),
//             initializeGame: jasmine.createSpy('initializeGame'),
//             subscribeToOrganizerLeft: jasmine.createSpy('subscribeToOrganizerLeft'),
//             subscribeToPlayerListUpdate: jasmine.createSpy('subscribeToPlayerListUpdate'),
//             setCurrentPlayerSocketId: jasmine.createSpy('setCurrentPlayerSocketId')
//         };

//         mockSocketService = {
//             onTurnStarted: jasmine.createSpy('onTurnStarted').and.returnValue(of({ playerSocketId: '123' })),
//             onNextTurnNotification: jasmine.createSpy('onNextTurnNotification').and.returnValue(of({ playerSocketId: '123', inSeconds: 5 })),
//             onTimeLeft: jasmine.createSpy('onTimeLeft').and.returnValue(of({ playerSocketId: '123', timeLeft: 30 })),
//             onTurnEnded: jasmine.createSpy('onTurnEnded').and.returnValue(of({})),
//             onNoMovementPossible: jasmine.createSpy('onNoMovementPossible').and.returnValue(of({ playerName: 'Test Player' })),
//             onGameInfo: jasmine.createSpy('onGameInfo').and.returnValue(of({ name: 'Test Game', size: '10x10' })),
//             endTurn: jasmine.createSpy('endTurn'),
//             getSocketId: jasmine.createSpy('getSocketId').and.returnValue('123'),
//             emitStartCombat: jasmine.createSpy('emitStartCombat')
//         };

//         mockSnackBar = { open: jasmine.createSpy('open') };

//         await TestBed.configureTestingModule({
//             declarations: [GamePageComponent],
//             imports: [FontAwesomeModule],
//             providers: [
//                 { provide: SessionService, useValue: mockSessionService },
//                 { provide: SocketService, useValue: mockSocketService },
//                 { provide: MatSnackBar, useValue: mockSnackBar },
//                 { provide: Router, useValue: mockRouter }
//             ]
//         }).compileComponents();
//     });

//     beforeEach(() => {
//         fixture = TestBed.createComponent(GamePageComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should initialize game and subscriptions on ngOnInit', () => {
//         component.ngOnInit();
//         expect(mockSessionService.initializeGame).toHaveBeenCalled();
//         expect(mockSessionService.subscribeToPlayerListUpdate).toHaveBeenCalled();
//         expect(mockSessionService.subscribeToOrganizerLeft).toHaveBeenCalled();
//     });

//     it('should update isPlayerTurn and set timer on turn start', () => {
//         component.ngOnInit();
//         expect(component.isPlayerTurn).toBe(true);
//         expect(component.putTimer).toBe(true);
//     });

//     it('should display next turn notification', () => {
//         component.ngOnInit();
//         expect(mockSnackBar.open).toHaveBeenCalledWith(
//             'Le tour de Test Player commence dans 5 secondes.',
//             'OK',
//             { duration: TURN_NOTIF_DURATION, panelClass: ['custom-snackbar'] }
//         );
//     });

//     it('should update timeLeft on time left event', () => {
//         component.ngOnInit();
//         expect(component.timeLeft).toBe(30);
//     });

//     it('should reset turn variables on turn ended', () => {
//         component.isPlayerTurn = true;
//         component.putTimer = true;
//         component.timeLeft = 20;

//         (mockSocketService.onTurnEnded as jasmine.Spy).and.returnValue(of({}));
//         component.ngOnInit();

//         expect(component.isPlayerTurn).toBe(false);
//         expect(component.putTimer).toBe(false);
//         expect(component.timeLeft).toBe(0);
//     });

//     it('should display movement not possible message', () => {
//         component.ngOnInit();
//         expect(mockSnackBar.open).toHaveBeenCalledWith(
//             'Aucun mouvement possible pour Test Player - Le tour de se termine dans 3 secondes.',
//             'OK',
//             { duration: TURN_NOTIF_DURATION, panelClass: ['custom-snackbar'] }
//         );
//     });

//     it('should toggle isExpanded when toggleExpand is called', () => {
//         const initialExpandedState = component.isExpanded;
//         component.toggleExpand();
//         expect(component.isExpanded).toBe(!initialExpandedState);
//     });

//     it('should return game details from sessionService', () => {
//         expect(component.gameName).toBe('Test Game');
//         expect(component.gameDescription).toBe('A test game description');
//         expect(component.gameSize).toBe('10x10');
//     });

//     it('should return player details from sessionService', () => {
//         expect(component.playerName).toBe('Test Player');
//         expect(component.playerAvatar).toBe('testAvatar');
//     });

//     it('should call leaveSession from sessionService', () => {
//         component.leaveSession();
//         expect(mockSessionService.leaveSession).toHaveBeenCalled();
//     });

//     it('should call confirmLeaveSession from sessionService', () => {
//         component.confirmLeaveSession();
//         expect(mockSessionService.confirmLeaveSession).toHaveBeenCalled();
//     });

//     it('should call cancelLeaveSession from sessionService', () => {
//         component.cancelLeaveSession();
//         expect(mockSessionService.cancelLeaveSession).toHaveBeenCalled();
//     });

//     it('should set putTimer to false when endTurn is called', () => {
//         component.putTimer = true;
//         component.endTurn();
//         expect(mockSocketService.endTurn).toHaveBeenCalledWith(component.sessionCode);
//         expect(component.putTimer).toBe(false);
//     });

//     it('should clean up subscriptions and leave session on ngOnDestroy if organizer', () => {
//         component.ngOnDestroy();
//         expect(mockSessionService.leaveSession).toHaveBeenCalled();
//     });

//     it('should start combat and call emitStartCombat on socket service', () => {
//         component.opposentPlayer = 'opponentAvatar';
//         component.startCombat();
//         expect(mockSocketService.emitStartCombat).toHaveBeenCalledWith(
//             component.sessionCode,
//             component.playerAvatar,
//             component.opposentPlayer
//         );
//     });
// });
