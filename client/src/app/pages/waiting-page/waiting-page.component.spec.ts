// // eslint-disable-next-line import/no-deprecated
// import { HttpClientTestingModule } from '@angular/common/http/testing';
// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { NoopAnimationsModule } from '@angular/platform-browser/animations';
// import { ActivatedRoute } from '@angular/router';
// import { Game } from '@app/interfaces/game-model.interface';
// import { Player } from '@app/interfaces/player.interface';
// import { of } from 'rxjs';
// import { MIN_PLAYERS } from 'src/constants/players-constants';
// import { WaitingViewComponent } from './waiting-page.component';
// describe('WaitingViewComponent - leaveSession method', () => {
//     let component: WaitingViewComponent;
//     let fixture: ComponentFixture<WaitingViewComponent>;
//     const MAX_PLAYERS_ALLOWED = 4;
//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             declarations: [WaitingViewComponent],
//             // eslint-disable-next-line import/no-deprecated
//             imports: [HttpClientTestingModule, NoopAnimationsModule],
//             providers: [
//                 {
//                     provide: ActivatedRoute,
//                     useValue: {
//                         snapshot: {
//                             queryParamMap: {
//                                 get: () => 'testSessionCode',
//                             },
//                         },
//                     },
//                 },
//             ],
//         }).compileComponents();
//     });
//     beforeEach(() => {
//         fixture = TestBed.createComponent(WaitingViewComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });
//     it('should show a notification if organizer tries to unlock the room when max players are reached', () => {
//         component.isOrganizer = true;
//         component.roomLocked = true;
//         component.maxPlayers = MAX_PLAYERS_ALLOWED;
//         component.players = Array.from({ length: MAX_PLAYERS_ALLOWED }, () => ({}) as Player);
//         const notificationSpy = spyOn(component['notificationService'], 'showMessage');

//         component.toggleLock();

//         expect(notificationSpy).toHaveBeenCalledWith('Vous ne pouvez pas déverrouiller la salle car le nombre maximum de joueurs est atteint.');
//     });
//     it('should show a notification to organizer if room is automatically locked when max players are reached', () => {
//         component.isOrganizer = true;
//         component.sessionCode = 'testSessionCode';
//         component.maxPlayers = MAX_PLAYERS_ALLOWED;
//         component.players = Array.from({ length: MAX_PLAYERS_ALLOWED }, () => ({}) as Player);
//         const notificationSpy = spyOn(component['notificationService'], 'showMessage');
//         const toggleRoomLockSpy = spyOn(component['socketService'], 'toggleRoomLock');

//         component['lockRoomIfMaxPlayersReached']();

//         expect(component.roomLocked).toBeTrue();
//         expect(toggleRoomLockSpy).toHaveBeenCalledWith('testSessionCode', true);
//         expect(notificationSpy).toHaveBeenCalledWith('La salle est automatiquement verrouillée car le nombre maximum de joueurs est atteint.');
//     });
//     it('should navigate to home if we reload', () => {
//         sessionStorage.setItem('waitingPageReloaded', 'true');
//         const navigateSpy = spyOn(component['router'], 'navigate');

//         component['reload']();

//         expect(navigateSpy).toHaveBeenCalledWith(['/']);
//         sessionStorage.removeItem('waitingPageReloaded');
//     });
//     it('should set selectedPlayer and show the popup when openConfirmationPopup is called with a player', () => {
//         const testPlayer: Player = {
//             socketId: 'playerSocketId',
//             name: 'TestPlayer',
//             isOrganizer: false,
//             avatar: 'avatar.png',
//             attributes: {},
//         };

//         component.openConfirmationPopup(testPlayer);

//         expect(component.selectedPlayer).toBe(testPlayer);
//         expect(component.popupVisible).toBeTrue();
//     });
//     it('should call socketService.excludePlayer', () => {
//         const testPlayer: Player = {
//             socketId: 'playerSocketId',
//             name: 'TestPlayer',
//             isOrganizer: false,
//             avatar: 'avatar.png',
//             attributes: {},
//         };
//         component.sessionCode = 'testSessionCode';
//         component.selectedPlayer = testPlayer;
//         component.popupVisible = true;
//         const excludePlayerSpy = spyOn(component['socketService'], 'excludePlayer');
//         component.confirmExclusion();
//         expect(excludePlayerSpy).toHaveBeenCalledWith('testSessionCode', 'playerSocketId');
//         expect(component.popupVisible).toBeFalse();
//         expect(component.selectedPlayer).toBeNull();
//     });
//     it('should not show the popup if openConfirmationPopup is called with no player', () => {
//         component.openConfirmationPopup(null as unknown as Player);

//         expect(component.selectedPlayer).toBeNull();
//         expect(component.popupVisible).toBeFalse();
//     });
//     it('should not toggle roomLocked if room is locked and max players are reached', () => {
//         const toggleRoomLockSpy = spyOn(component['socketService'], 'toggleRoomLock');
//         component.sessionCode = 'testSessionCode';
//         component.roomLocked = true;
//         component.maxPlayers = MAX_PLAYERS_ALLOWED;
//         component.players = Array.from({ length: MAX_PLAYERS_ALLOWED }, () => ({}) as Player);
//         component.toggleLock();
//         expect(component.roomLocked).toBeTrue();
//         expect(toggleRoomLockSpy).not.toHaveBeenCalled();
//     });
//     it('should toggle roomLocked and call socketService.toggleRoomLock when conditions are met', () => {
//         const toggleRoomLockSpy = spyOn(component['socketService'], 'toggleRoomLock');
//         component.sessionCode = 'testSessionCode';
//         component.roomLocked = false;
//         component.maxPlayers = MAX_PLAYERS_ALLOWED;
//         component.players = Array.from({ length: 3 }, () => ({}) as Player);
//         component.toggleLock();

//         expect(component.roomLocked).toBeTrue();
//         expect(toggleRoomLockSpy).toHaveBeenCalledWith('testSessionCode', true);
//         component.toggleLock();

//         expect(component.roomLocked).toBeFalse();
//         expect(toggleRoomLockSpy).toHaveBeenCalledWith('testSessionCode', false);
//     });
//     it('should call socketService.excludePlayer with correct parameters in excludePlayer', () => {
//         const excludePlayerSpy = spyOn(component['socketService'], 'excludePlayer');
//         const testPlayer: Player = { socketId: 'playerSocketId', name: 'TestPlayer', isOrganizer: false, avatar: 'avatar.png', attributes: {} };
//         component.sessionCode = 'testSessionCode';

//         component.excludePlayer(testPlayer);

//         expect(excludePlayerSpy).toHaveBeenCalledWith('testSessionCode', 'playerSocketId');
//     });
//     it('should call socketService.leaveSession and navigate to home on confirmLeaveSession', () => {
//         const leaveSessionSpy = spyOn(component['socketService'], 'leaveSession');
//         const navigateSpy = spyOn(component['router'], 'navigate');
//         component.sessionCode = 'testSessionCode';

//         component.confirmLeaveSession();

//         expect(leaveSessionSpy).toHaveBeenCalledWith('testSessionCode');
//         expect(component.leaveSessionPopupVisible).toBeFalse();
//         expect(navigateSpy).toHaveBeenCalledWith(['/']);
//     });
//     it('should hide the leave session popup on cancelLeaveSession', () => {
//         component.leaveSessionPopupVisible = true;

//         component.cancelLeaveSession();

//         expect(component.leaveSessionPopupVisible).toBeFalse();
//     });
//     it('should show a message if the room is not locked in startGame', () => {
//         component.players = Array.from({ length: MIN_PLAYERS }, () => ({}) as Player);
//         component.maxPlayers = MIN_PLAYERS;
//         component.roomLocked = false;
//         const notificationSpy = spyOn(component['notificationService'], 'showMessage');
//         component.startGame();
//         expect(notificationSpy).toHaveBeenCalledWith('La salle doit être verrouillée pour démarrer la partie.');
//     });
//     it('should show a message if the number of players is invalid in startGame', () => {
//         component.players = Array.from({ length: MIN_PLAYERS - 1 }, () => ({}) as Player);
//         const notificationSpy = spyOn(component['notificationService'], 'showMessage');
//         component.startGame();
//         expect(notificationSpy).toHaveBeenCalledWith('Le nombre de joueurs ne respecte pas les limites de la carte de jeu.');
//     });
//     it('should emit startGame event if conditions are met in startGame', () => {
//         component.players = Array.from({ length: MIN_PLAYERS }, () => ({}) as Player);
//         component.maxPlayers = MIN_PLAYERS;
//         component.roomLocked = true;
//         component.sessionCode = 'testSessionCode';
//         const emitStartGameSpy = spyOn(component['socketService'], 'emitStartGame');
//         component.startGame();
//         expect(emitStartGameSpy).toHaveBeenCalledWith('testSessionCode');
//     });
//     it('should set the correct message and show the popup when the user is the organizer', () => {
//         component.isOrganizer = true;

//         component.leaveSession();

//         expect(component.leaveSessionMessage).toBe(
//             "En tant qu'organisateur, quitter la partie entraînera sa suppression. Voulez-vous vraiment continuer ?",
//         );
//         expect(component.leaveSessionPopupVisible).toBeTrue();
//     });
//     it('should set the correct message and show the popup when the user is not the organizer', () => {
//         component.isOrganizer = false;

//         component.leaveSession();

//         expect(component.leaveSessionMessage).toBe('Voulez-vous vraiment quitter la partie ?');
//         expect(component.leaveSessionPopupVisible).toBeTrue();
//     });
//     it('should hide the popup and reset selectedPlayer in cancelExclusion', () => {
//         component.popupVisible = true;
//         component.selectedPlayer = { socketId: 'testSocketId', name: 'Test Player', isOrganizer: false, avatar: 'avatar.png', attributes: {} };

//         component.cancelExclusion();

//         expect(component.popupVisible).toBeFalse();
//         expect(component.selectedPlayer).toBeNull();
//     });
//     it('should load game and set selectedGame and maxPlayers in loadGame', () => {
//         const testGame: Game = {
//             _id: 'gameId',
//             name: 'Test Game',
//             size: 'medium',
//             description: 'A test game description',
//             mode: 'solo',
//             image: 'test-image-url',
//             date: new Date(),
//             visibility: true,
//             grid: [[{ images: [], isOccuped: false }]],
//         };

//         const gameFacadeSpy = spyOn(component['gameFacade'], 'fetchGame').and.returnValue(of(testGame));
//         const gameValidateSpy = spyOn(component['gameValidateService'], 'gridMaxPlayers').and.returnValue(MAX_PLAYERS_ALLOWED);

//         component['loadGame']('gameId');

//         expect(gameFacadeSpy).toHaveBeenCalledWith('gameId');
//         expect(component.selectedGame).toEqual(testGame);
//         expect(component.maxPlayers).toBe(MAX_PLAYERS_ALLOWED);
//         expect(gameValidateSpy).toHaveBeenCalledWith(testGame);
//     });
//     it('should update roomLocked when onRoomLocked event is received', () => {
//         const roomLockedSpy = spyOn(component['socketService'], 'onRoomLocked').and.returnValue(of({ locked: true }));

//         component['subscribeToRoomLock']();

//         expect(roomLockedSpy).toHaveBeenCalled();
//         expect(component.roomLocked).toBeTrue();
//     });
//     it('should show message and navigate to home when onSessionDeleted event is received', () => {
//         const notificationSpy = spyOn(component['notificationService'], 'showMessage');
//         const navigateSpy = spyOn(component['router'], 'navigate');
//         const sessionDeletedSpy = spyOn(component['socketService'], 'onSessionDeleted').and.returnValue(of({ message: 'Session deleted' }));

//         component['subscribeToSessionDeletion']();

//         expect(sessionDeletedSpy).toHaveBeenCalled();
//         expect(notificationSpy).toHaveBeenCalledWith('Session deleted');
//         expect(navigateSpy).toHaveBeenCalledWith(['/']);
//     });
//     it('should return false if number of players is below minimum in isNumberPlayerValid', () => {
//         component.players = Array.from({ length: MIN_PLAYERS - 1 }, () => ({}) as Player);
//         component.maxPlayers = MIN_PLAYERS;

//         const result = component['isNumberPlayerValid']();

//         expect(result).toBeFalse();
//     });
//     it('should return true if number of players is within the allowed range in isNumberPlayerValid', () => {
//         component.players = Array.from({ length: MIN_PLAYERS }, () => ({}) as Player);
//         component.maxPlayers = MIN_PLAYERS;

//         const result = component['isNumberPlayerValid']();

//         expect(result).toBeTrue();
//     });
//     it('should return false if number of players exceeds maximum in isNumberPlayerValid', () => {
//         component.players = Array.from({ length: component.maxPlayers + 1 }, () => ({}) as Player);
//         component.maxPlayers = MIN_PLAYERS;

//         const result = component['isNumberPlayerValid']();

//         expect(result).toBeFalse();
//     });
//     it('should initialize sessionCode and gameId', () => {
//         spyOn(component['route'].snapshot.queryParamMap, 'get').and.callFake((param: string) => {
//             return param === 'sessionCode' ? 'testSessionCode' : 'testGameId';
//         });

//         component['initializeSessionCode']();

//         expect(component.sessionCode).toBe('testSessionCode');
//         expect(component.gameId).toBe('testGameId');
//         expect(component.accessCode).toBe('testSessionCode');
//     });
//     it('should navigate to home if sessionCode is missing in initializeSessionCode', () => {
//         spyOn(component['route'].snapshot.queryParamMap, 'get').and.returnValue(null);
//         const navigateSpy = spyOn(component['router'], 'navigate');

//         component['initializeSessionCode']();

//         expect(navigateSpy).toHaveBeenCalledWith(['/']);
//     });
//     it('should lock room and call toggleRoomLock if players reach maxPlayers', () => {
//         component.players = Array.from({ length: 4 }, () => ({}) as Player);
//         component.maxPlayers = 4;
//         component.sessionCode = 'testSessionCode';

//         const toggleRoomLockSpy = spyOn(component['socketService'], 'toggleRoomLock');

//         component['lockRoomIfMaxPlayersReached']();

//         expect(component.roomLocked).toBeTrue();
//         expect(toggleRoomLockSpy).toHaveBeenCalledWith('testSessionCode', true);
//     });
//     it('should navigate to home if gameId is missing in loadGameData', () => {
//         component.gameId = null;
//         const navigateSpy = spyOn(component['router'], 'navigate');

//         component['loadGameData']();

//         expect(navigateSpy).toHaveBeenCalledWith(['/']);
//     });
//     it('should show message and navigate to home on onExcluded event', () => {
//         const notificationSpy = spyOn(component['notificationService'], 'showMessage');
//         const navigateSpy = spyOn(component['router'], 'navigate');
//         spyOn(component['socketService'], 'onExcluded').and.returnValue(of({ message: 'You have been excluded' }));

//         component['subscribeToExclusion']();

//         expect(notificationSpy).toHaveBeenCalledWith('You have been excluded');
//         expect(navigateSpy).toHaveBeenCalledWith(['/']);
//     });
//     // it('should download the right game with correct queryParams when onGameStarted event is received', () => {
//     //     component.sessionCode = 'testSessionCode';
//     //     component.playerName = 'TestPlayer';
//     //     component.isOrganizer = true;
//     //     component.playerAttributes = {
//     //         agility: {
//     //             name: 'agility',
//     //             description: 'Player agility attribute',
//     //             baseValue: 10,
//     //             currentValue: 10,
//     //             speed: 5,
//     //             dice: '1d6',
//     //         },
//     //     };
//     //     component.gameId = 'testGameId';
//     //     const navigateSpy = spyOn(component['router'], 'navigate');
//     //     spyOn(component['socketService'], 'onGameStarted').and.returnValue(of({ sessionCode: 'testSessionCode', gameId: 'testGameId' }));
//     //     component['subscribeToGameStarted']();
//     //     expect(navigateSpy).toHaveBeenCalledWith(['/game'], {
//     //         queryParams: {
//     //             sessionCode: 'testSessionCode',
//     //             playerName: 'TestPlayer',
//     //             isOrganizer: true,
//     //             playerAttributes: JSON.stringify({
//     //                 agility: {
//     //                     name: 'agility',
//     //                     description: 'Player agility attribute',
//     //                     baseValue: 10,
//     //                     currentValue: 10,
//     //                     speed: 5,
//     //                     dice: '1d6',
//     //                 },
//     //             }),
//     //             gameId: 'testGameId',
//     //         },
//     //     });
//     // });
//     it('should update players list in updatePlayersList', () => {
//         const testPlayers: Player[] = [{ socketId: 'testSocketId', name: 'Player1', avatar: '', isOrganizer: false }];
//         component['updatePlayersList'](testPlayers);
//         expect(component.players).toEqual(testPlayers);
//     });
//     it('should set current player details in updateCurrentPlayerDetails', () => {
//         const testPlayers: Player[] = [{ socketId: 'testSocketId', name: 'Player1', avatar: '', isOrganizer: true, attributes: {} }];
//         component.players = testPlayers;
//         spyOn(component['socketService'], 'getSocketId').and.returnValue('testSocketId');

//         component['updateCurrentPlayerDetails']();

//         expect(component.isOrganizer).toBeTrue();
//         expect(component.playerName).toBe('Player1');
//         expect(component.playerAttributes).toEqual({});
//     });
// });
