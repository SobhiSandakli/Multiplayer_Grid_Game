// import { CharacterCreationData } from '@app/interfaces/character-creation-data/character-creation-data.interface';
// import { CombatTurnService } from '@app/services/combat-turn/combat-turn.service';
// import { EventsGateway } from '@app/services/events/events.service';
// import { FightService } from '@app/services/fight/fight.service';
// import { GameService } from '@app/services/game/game.service';
// import { ChangeGridService } from '@app/services/grid/changeGrid.service';
// import { MovementService } from '@app/services/movement/movement.service';
// import { SessionsService } from '@app/services/sessions/sessions.service';
// import { TurnService } from '@app/services/turn/turn.service';
// import { Test, TestingModule } from '@nestjs/testing';
// import { Server, Socket } from 'socket.io';
// import { SessionsGateway } from './sessions.gateway';

// describe('SessionsGateway', () => {
//     let gateway: SessionsGateway;
//     let server: Server;
//     let client: Socket;
//     let gameService: GameService;
//     let sessionsService: SessionsService;
//     let changeGridService: ChangeGridService;
//     let movementService: MovementService;
//     let fightService: FightService;
//     let combatTurnService: CombatTurnService;
//     let turnService: TurnService;
//     let eventsService: EventsGateway;

//     beforeEach(async () => {
//         const module: TestingModule = await Test.createTestingModule({
//             providers: [
//                 SessionsGateway,
//                 {
//                     provide: GameService,
//                     useValue: {
//                         getGameById: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: SessionsService,
//                     useValue: {
//                         getSession: jest.fn(),
//                         createNewSession: jest.fn(),
//                         validateCharacterCreation: jest.fn(),
//                         addPlayerToSession: jest.fn(),
//                         calculateTurnOrder: jest.fn(),
//                         startTurn: jest.fn(),
//                         removePlayerFromSession: jest.fn(),
//                         terminateSession: jest.fn(),
//                         isOrganizer: jest.fn(),
//                         isSessionFull: jest.fn(),
//                         toggleSessionLock: jest.fn(),
//                         getTakenAvatars: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: ChangeGridService,
//                     useValue: {
//                         changeGrid: jest.fn(),
//                         moveImage: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: MovementService,
//                     useValue: {
//                         calculateMovementCost: jest.fn(),
//                         getPathToDestination: jest.fn(),
//                         getTileType: jest.fn(),
//                         calculateAccessibleTiles: jest.fn(),
//                         getMovementCost: jest.fn(),
//                         getTileEffect: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: FightService,
//                     useValue: {
//                         determineFirstAttacker: jest.fn(),
//                         calculateAttack: jest.fn(),
//                         calculateEvasion: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: CombatTurnService,
//                     useValue: {
//                         startCombat: jest.fn(),
//                         endCombat: jest.fn(),
//                         endCombatTurn: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: TurnService,
//                     useValue: {
//                         clearTurnTimer: jest.fn(),
//                         startTurn: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: EventsGateway,
//                     useValue: {
//                         addEventToSession: jest.fn(),
//                     },
//                 },
//             ],
//         }).compile();

//         gateway = module.get<SessionsGateway>(SessionsGateway);
//         server = new Server();
//         client = new Socket({} as any, {} as any, {} as any);
//         gameService = module.get<GameService>(GameService);
//         sessionsService = module.get<SessionsService>(SessionsService);
//         changeGridService = module.get<ChangeGridService>(ChangeGridService);
//         movementService = module.get<MovementService>(MovementService);
//         fightService = module.get<FightService>(FightService);
//         combatTurnService = module.get<CombatTurnService>(CombatTurnService);
//         turnService = module.get<TurnService>(TurnService);
//         eventsService = module.get<EventsGateway>(EventsGateway);

//         gateway['server'] = server;
//     });

//     it('should be defined', () => {
//         expect(gateway).toBeDefined();
//     });

//     it('should handle toggleDoorState', () => {
//         const session = {
//             grid: [[{ images: ['assets/tiles/Door.png'] }], [{ images: ['assets/tiles/Door-Open.png'] }]],
//         };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);

//         const data = { sessionCode: 'test', row: 0, col: 0, newState: 'assets/tiles/Door-Open.png' };
//         gateway.handleToggleDoorState(client, data);

//         expect(session.grid[0][0].images[0]).toBe('assets/tiles/Door-Open.png');
//     });

//     it('should handle startGame', async () => {
//         const session = {
//             selectedGameID: 'gameId',
//             players: [],
//         };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);
//         jest.spyOn(gameService, 'getGameById').mockResolvedValue({ grid: [] } as any);
//         jest.spyOn(changeGridService, 'changeGrid').mockReturnValue([]);

//         const data = { sessionCode: 'test' };
//         await gateway.handleStartGame(client, data);

//         expect(sessionsService.calculateTurnOrder).toHaveBeenCalledWith(session);
//         expect(sessionsService.startTurn).toHaveBeenCalledWith(data.sessionCode, server);
//     });

//     it('should handle movePlayer', () => {
//         const session = {
//             players: [
//                 {
//                     socketId: 'client-id',
//                     position: { row: 0, col: 0 },
//                     accessibleTiles: [{ position: { row: 1, col: 1 } }],
//                     attributes: { speed: { currentValue: 10 } },
//                 },
//             ],
//             currentPlayerSocketId: 'client-id',
//             grid: [],
//         };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);
//         jest.spyOn(movementService, 'calculateMovementCost').mockReturnValue(5);
//         jest.spyOn(movementService, 'getPathToDestination').mockReturnValue([{ row: 1, col: 1 }]);
//         jest.spyOn(changeGridService, 'moveImage').mockReturnValue(true);

//         const data = {
//             sessionCode: 'test',
//             source: { row: 0, col: 0 },
//             destination: { row: 1, col: 1 },
//             movingImage: 'player.png',
//         };
//         gateway.handleMovePlayer(client, data);

//         expect(session.players[0].position).toEqual({ row: 1, col: 1 });
//         expect(session.players[0].attributes['speed'].currentValue).toBe(5);
//     });

//     it('should handle createNewSession', () => {
//         jest.spyOn(sessionsService, 'createNewSession').mockReturnValue('sessionCode');

//         const data = { maxPlayers: 4, selectedGameID: 'gameId' };
//         gateway.handleCreateNewSession(client, data);

//         expect(client.join).toHaveBeenCalledWith('sessionCode');
//         expect(client.emit).toHaveBeenCalledWith('sessionCreated', { sessionCode: 'sessionCode' });
//     });

//     it('should handle createCharacter', () => {
//         const session = { players: [] };
//         const validationResult = { session, finalName: 'characterName', gameId: 'gameId' };
//         jest.spyOn(sessionsService, 'validateCharacterCreation').mockReturnValue(validationResult as any);

//         const data: CharacterCreationData = {
//             sessionCode: 'test',
//             characterData: { name: 'characterName', avatar: 'characterAvatar', attributes: {} },
//         };
//         gateway.handleCreateCharacter(client, data);

//         expect(sessionsService.addPlayerToSession).toHaveBeenCalledWith(session, client, 'characterName', data.characterData);
//         expect(client.join).toHaveBeenCalledWith('test');
//         expect(client.emit).toHaveBeenCalledWith('characterCreated', {
//             name: 'characterName',
//             sessionCode: 'test',
//             gameId: 'gameId',
//             attributes: data.characterData.attributes,
//         });
//     });

//     it('should handle joinGame', () => {
//         const session = { players: [], locked: false };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);
//         jest.spyOn(sessionsService, 'isSessionFull').mockReturnValue(false);

//         const data = { secretCode: 'test', game: { name: 'game' } as any };
//         gateway.handleJoinGame(client, data);

//         expect(client.join).toHaveBeenCalledWith('test');
//         expect(client.join).toHaveBeenCalledWith(JSON.stringify(data.game));
//         expect(client.emit).toHaveBeenCalledWith('joinGameResponse', { success: true });
//         expect(client.emit).toHaveBeenCalledWith('getGameInfo', { sessionCode: 'test' });
//     });

//     it('should handle getGridArray', () => {
//         const session = { grid: [] };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);

//         const data = { sessionCode: 'test' };
//         gateway.handleGetGridArray(client, data);

//         expect(client.emit).toHaveBeenCalledWith('gridArray', { sessionCode: 'test', grid: session.grid });
//     });

//     it('should handle getTakenAvatars', () => {
//         const session = { players: [] };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);
//         jest.spyOn(sessionsService, 'getTakenAvatars').mockReturnValue([]);

//         const data = { sessionCode: 'test' };
//         gateway.handleGetTakenAvatars(client, data);

//         expect(client.emit).toHaveBeenCalledWith('takenAvatars', { takenAvatars: [], players: session.players });
//     });

//     it('should handle deleteSession', () => {
//         const session = { organizerId: 'client-id' };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);

//         const data = { sessionCode: 'test' };
//         gateway.handleDeleteSession(client, data);

//         expect(sessionsService.terminateSession).toHaveBeenCalledWith(data.sessionCode);
//         expect(server.to(data.sessionCode).emit).toHaveBeenCalledWith('sessionDeleted', {
//             message: "La session a été supprimée par l'organisateur.",
//         });
//     });

//     it('should handle leaveSession', () => {
//         const session = { players: [], organizerId: 'client-id', grid: [] };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);
//         jest.spyOn(sessionsService, 'removePlayerFromSession').mockReturnValue(true);
//         jest.spyOn(sessionsService, 'isOrganizer').mockReturnValue(true);

//         const data = { sessionCode: 'test' };
//         gateway.handleLeaveSession(client, data);

//         expect(sessionsService.terminateSession).toHaveBeenCalledWith(data.sessionCode);
//         expect(server.to(data.sessionCode).emit).toHaveBeenCalledWith('sessionDeleted', {
//             message: "L'organisateur a quitté la session, elle est terminée.",
//         });
//     });

//     it('should handle excludePlayer', () => {
//         const session = { players: [] };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);

//         const data = { sessionCode: 'test', playerSocketId: 'player-id' };
//         gateway.handleExcludePlayer(client, data);

//         expect(sessionsService.removePlayerFromSession).toHaveBeenCalledWith(session, data.playerSocketId);
//         expect(server.to(data.sessionCode).emit).toHaveBeenCalledWith('playerListUpdate', { players: session.players });
//     });

//     it('should handle toggleLock', () => {
//         const session = { locked: false };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);

//         const data = { sessionCode: 'test', lock: true };
//         gateway.handleToggleLock(client, data);

//         expect(sessionsService.toggleSessionLock).toHaveBeenCalledWith(session, data.lock);
//         expect(server.to(data.sessionCode).emit).toHaveBeenCalledWith('roomLocked', { locked: session.locked });
//     });

//     it('should handle endTurn', () => {
//         const session = { currentPlayerSocketId: 'client-id' };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);

//         const data = { sessionCode: 'test' };
//         gateway.handleEndTurn(client, data);

//         expect(sessionsService.endTurn).toHaveBeenCalledWith(data.sessionCode, server);
//     });

//     it('should handle tileInfoRequest', async () => {
//         const session = { grid: [[{ images: [] }]] };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);
//         jest.spyOn(movementService, 'getMovementCost').mockReturnValue(1);
//         jest.spyOn(movementService, 'getTileEffect').mockReturnValue('effect');

//         const data = { sessionCode: 'test', row: 0, col: 0 };
//         await gateway.handleTileInfoRequest(client, data);

//         expect(client.emit).toHaveBeenCalledWith('tileInfo', { cost: 1, effect: 'effect' });
//     });

//     it('should handle avatarInfoRequest', async () => {
//         const session = { players: [{ avatar: 'avatar', name: 'name' }] };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);

//         const data = { sessionCode: 'test', avatar: 'avatar' };
//         await gateway.handleAvatarInfoRequest(client, data);

//         expect(client.emit).toHaveBeenCalledWith('avatarInfo', { name: 'name', avatar: 'avatar' });
//     });

//     // it('should handle startCombat', async () => {
//     //     const session = {
//     //         players: [
//     //             { socketId: 'client-id', avatar: 'avatar1', name: 'name1' },
//     //             { avatar: 'avatar2', name: 'name2' },
//     //         ],
//     //     };
//     //     jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);
//     //     jest.spyOn(fightService, 'determineFirstAttacker').mockReturnValue({
//     //         ...session.players[0],
//     //         attributes: { speed: { name: 'Speed', description: 'Character speed', baseValue: 10, currentValue: 10 } },
//     //         isOrganizer: false,
//     //         position: { row: 0, col: 0 },
//     //         accessibleTiles: []
//     //     });

//     //     const data = { sessionCode: 'test', avatar1: 'avatar1', avatar2: 'avatar2' };
//     //     await gateway.handleStartCombat(client, data);

//     //     expect(eventsService.addEventToSession).toHaveBeenCalledWith('test', 'Début de combat entre name1 et name2', ['everyone']);
//     //     expect(combatTurnService.startCombat).toHaveBeenCalledWith('test', server, session);
//     // });

//     it('should handle endCombat', () => {
//         const session = {};
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);

//         const data = { sessionCode: 'test' };
//         gateway.handleEndCombat(client, data);

//         expect(combatTurnService.endCombat).toHaveBeenCalledWith('test', server, session);
//     });

//     it('should handle attack', () => {
//         const session = {
//             players: [{ socketId: 'client-id', attributes: { life: { currentValue: 10 } } }],
//             combat: [{ socketId: 'client-id' }, { socketId: 'opponent-id' }],
//         };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);
//         jest.spyOn(fightService, 'calculateAttack').mockReturnValue({ attackBase: 1, attackRoll: 2, defenceBase: 3, defenceRoll: 4, success: true });

//         const data = { sessionCode: 'test' };
//         gateway.handleAttack(client, data);

//         expect(eventsService.addEventToSession).toHaveBeenCalledWith('test', "client-id essaie d'attaquer opponent-id", ['client-id', 'opponent-id']);
//         expect(eventsService.addEventToSession).toHaveBeenCalledWith('test', "Résultat de l'attaque est : succès", ['client-id', 'opponent-id']);
//         expect(server.to('client-id').emit).toHaveBeenCalledWith('attackResult', {
//             attackBase: 1,
//             attackRoll: 2,
//             defenceBase: 3,
//             defenceRoll: 4,
//             success: true,
//         });
//     });

//     it('should handle evasion', () => {
//         const session = {
//             players: [{ socketId: 'client-id', attributes: { life: { currentValue: 10, baseValue: 10 } } }],
//             combat: [{ socketId: 'client-id' }, { socketId: 'opponent-id' }],
//         };
//         jest.spyOn(sessionsService, 'getSession').mockReturnValue(session as any);
//         jest.spyOn(fightService, 'calculateEvasion').mockReturnValue(true);

//         const data = { sessionCode: 'test' };
//         gateway.handleEvasion(client, data);

//         expect(eventsService.addEventToSession).toHaveBeenCalledWith('test', 'client-id essaie de se fuire.', ['client-id', 'opponent-id']);
//         expect(eventsService.addEventToSession).toHaveBeenCalledWith('test', "Résultat de l'évasion est : succès", ['client-id', 'opponent-id']);
//         expect(client.emit).toHaveBeenCalledWith('evasionResult', { success: true });
//     });
// });
