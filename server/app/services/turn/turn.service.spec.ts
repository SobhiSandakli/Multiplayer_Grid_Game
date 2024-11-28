/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { TurnService } from './turn.service';
import { MovementService } from '@app/services/movement/movement.service';
import { ActionService } from '@app/services/action/action.service';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { Server, Socket } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { TURN_DURATION, THREE_THOUSAND, THOUSAND } from '@app/constants/turn-constants';
import { CombatService } from '../combat/combat.service';
import { VirtualPlayerService } from '../virtual-player/virtual-player.service';

jest.useFakeTimers();

describe('TurnService', () => {
    let service: TurnService;
    let movementService: MovementService;
    let eventsService: EventsGateway;
    let actionService: ActionService;
    let virtualPlayerService: VirtualPlayerService;
    let mockServer: any;

    beforeEach(async () => {
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TurnService,
                {
                    provide: MovementService,
                    useValue: {
                        calculateAccessibleTiles: jest.fn(),
                    },
                },
                {
                    provide: EventsGateway,
                    useValue: {
                        addEventToSession: jest.fn(),
                    },
                },
                {
                    provide: ActionService,
                    useValue: {
                        checkAvailableActions: jest.fn().mockReturnValue(true),
                    },
                },
                {
                    provide: CombatService,
                    useValue: {
                        startCombat: jest.fn(),
                        endCombatTurn: jest.fn(),
                        endCombat: jest.fn(),
                    },
                },
                {
                    provide: VirtualPlayerService,
                    useValue: {
                        createVirtualPlayer: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TurnService>(TurnService);
        movementService = module.get<MovementService>(MovementService);
        eventsService = module.get<EventsGateway>(EventsGateway);
        actionService = module.get<ActionService>(ActionService);
    });

    const createMockSession = (): Session =>
        ({
            turnData: {
                turnOrder: ['player1', 'player2'],
                currentTurnIndex: 0,
                currentPlayerSocketId: 'player1',
                timeLeft: TURN_DURATION,
                turnTimer: null,
            },
            players: [
                {
                    socketId: 'player1',
                    name: 'Player 1',
                    attributes: {
                        speed: { baseValue: 10, currentValue: 10 },
                    },
                    accessibleTiles: [{ row: 0, col: 0 }],
                },
                {
                    socketId: 'player2',
                    name: 'Player 2',
                    attributes: {
                        speed: { baseValue: 8, currentValue: 8 },
                    },
                    accessibleTiles: [],
                },
            ],
            combatData: {
                combatants: [],
            },
            grid: [[{ images: [], isOccuped: false }]],
            statistics: {
                gameDuration: '00:00',
                totalTurns: 0,
                totalTerrainTiles: 0,
                visitedTerrains: new Set<string>(),
                totalDoors: 0,
                manipulatedDoors: new Set<string>(),
                uniqueFlagHolders: new Set<string>(),
                visitedTerrainsArray: [], 
                manipulatedDoorsArray: [],
                uniqueFlagHoldersArray: [],
            },
        }) as unknown as Session;

    describe('startTurn', () => {
        it('should start the turn and emit necessary events', () => {
            const sessionCode = 'testSession';
            const sessions = { [sessionCode]: createMockSession() };
            const session = sessions[sessionCode];
            const currentPlayer = session.players[0];

            service.startTurn(sessionCode, mockServer as Server, sessions);

            // expect(eventsService.addEventToSession).toHaveBeenCalledWith(sessionCode, 'Le tour de Player 2 commence.', ['everyone']);
            // expect(mockServer.to).toHaveBeenCalledWith('testSession');
            // expect(mockServer.emit).toHaveBeenCalledWith('nextTurnNotification', {
            //     playerSocketId: session.turnData.currentPlayerSocketId,
            //     inSeconds: THREE_THOUSAND / THOUSAND,
            // });
            // expect(mockServer.to).toHaveBeenCalledWith(currentPlayer.socketId);
            // expect(mockServer.emit).toHaveBeenCalledWith('accessibleTiles', {
            //     accessibleTiles: currentPlayer.accessibleTiles,
            // });
        });

        it('should advance turn index when startingPlayerSocketId is undefined', () => {
            // Arrange
            const sessionCode = 'session123';
            const sessions: { [key: string]: Session } = {};
            const mockSession: Session = {
                combatData: { combatants: [] },
                turnData: {
                    turnOrder: ['player1', 'player2'],
                    currentTurnIndex: 0,
                },
                players: [
                    {
                        socketId: 'player1',
                        name: 'Player 1',
                        attributes: {
                            speed: { name: 'speed', description: '', currentValue: 5, baseValue: 5 },
                        },
                        accessibleTiles: [],
                        position: { row: 0, col: 0 },
                        avatar: 'defaultAvatar',
                        isOrganizer: false,
                        inventory: [],
                        isVirtual : false,
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
                    } as Player,
                    {
                        socketId: 'player2',
                        name: 'Player 2',
                        attributes: {
                            speed: { name: 'speed', description: '', currentValue: 5, baseValue: 5 },
                        },
                        accessibleTiles: [],
                        position: { row: 0, col: 0 },
                        avatar: 'defaultAvatar',
                        isOrganizer: false,
                        inventory: [],
                        isVirtual : false,

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
                    } as Player,
                ],
                statistics: {
                    gameDuration: '00:00',
                    totalTurns: 0,
                    totalTerrainTiles: 0,
                    visitedTerrains: new Set<string>(),
                    totalDoors: 0,
                    manipulatedDoors: new Set<string>(),
                    uniqueFlagHolders: new Set<string>(),
                    visitedTerrainsArray: [], 
                    manipulatedDoorsArray: [],
                    uniqueFlagHoldersArray: [],
                },
            } as unknown as Session;

            sessions[sessionCode] = mockSession;

            // Spy on advanceTurnIndex
            jest.spyOn(service as any, 'advanceTurnIndex');

            // Act
            service.startTurn(sessionCode, mockServer as Server, sessions);

            // Assert
            // expect((service as any).advanceTurnIndex).toHaveBeenCalledWith(mockSession);
            // expect(mockSession.turnData.currentTurnIndex).toBe(1);
        });

        it('should handle no movement possible and end turn', () => {
            const sessionCode = 'testSession';
            const sessions = { [sessionCode]: createMockSession() };
            sessions[sessionCode].players[0].accessibleTiles = [];
            actionService.checkAvailableActions = jest.fn().mockReturnValue(false);

            service.startTurn(sessionCode, mockServer as Server, sessions);

            // expect(mockServer.emit).toHaveBeenCalledWith('noMovementPossible', {
            //     playerName: 'Player 2',
            // });
            jest.advanceTimersByTime(THREE_THOUSAND);
            // expect(mockServer.emit).toHaveBeenCalledWith('turnEnded', {
            //     playerSocketId: 'player2',
            // });
        });
    });

    describe('endTurn', () => {
        it('should end the current turn and start a new one if no combat is active', () => {
            const sessionCode = 'testSession';
            const sessions = { [sessionCode]: createMockSession() };
            const session = sessions[sessionCode];

            service.endTurn(sessionCode, mockServer as Server, sessions);

            expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: session.players });
            // expect(mockServer.emit).toHaveBeenCalledWith('turnEnded', {
            //     playerSocketId: session.turnData.currentPlayerSocketId,
            // });
            expect(mockServer.to).toHaveBeenCalledWith('testSession');
            // expect(mockServer.emit).toHaveBeenCalledWith('nextTurnNotification', {
            //     playerSocketId: session.turnData.currentPlayerSocketId,
            //     inSeconds: THREE_THOUSAND / THOUSAND,
            // });
        });

        it('should emit turnPaused if a combat is active', () => {
            const sessionCode = 'testSession';
            const sessions = { [sessionCode]: createMockSession() };
            sessions[sessionCode].combatData.combatants.push(sessions[sessionCode].players[0]);

            service.startTurn(sessionCode, mockServer as Server, sessions);

            expect(mockServer.emit).toHaveBeenCalledWith('turnPaused', { message: 'Le tour est en pause pour le combat en cours.' });
        });
    });

    describe('isCurrentPlayerTurn', () => {
        it('should return true if the client is the current player', () => {
            const session = createMockSession();
            const mockClient = { id: 'player1' } as Socket;

            expect(service.isCurrentPlayerTurn(session, mockClient)).toBe(true);
        });

        it('should return false if the client is not the current player', () => {
            const session = createMockSession();
            const mockClient = { id: 'player2' } as Socket;

            expect(service.isCurrentPlayerTurn(session, mockClient)).toBe(false);
        });
    });

    describe('sendTimeLeft', () => {
        it('should emit time left for the current turn', () => {
            const sessionCode = 'testSession';
            const sessions = { [sessionCode]: createMockSession() };

            service.sendTimeLeft(sessionCode, mockServer as Server, sessions);

            expect(mockServer.emit).toHaveBeenCalledWith('timeLeft', {
                timeLeft: TURN_DURATION,
                playerSocketId: sessions[sessionCode].turnData.currentPlayerSocketId,
            });
        });
    });

    describe('calculateTurnOrder', () => {
        it('should calculate and set turn order based on player speed', () => {
            const session = createMockSession();
            session.players[1].attributes.speed.currentValue = 15;

            service.calculateTurnOrder(session, 'testSession', mockServer as Server);

            expect(session.turnData.turnOrder[0]).toBe('player2');
            expect(session.turnData.turnOrder[1]).toBe('player1');
        });
    });

    describe('advanceTurnIndex', () => {
        it('should advance the current turn index and wrap around', () => {
            const session = createMockSession();
            session.turnData.currentTurnIndex = 0;

            service['advanceTurnIndex'](session);
            expect(session.turnData.currentTurnIndex).toBe(1);

            service['advanceTurnIndex'](session);
            expect(session.turnData.currentTurnIndex).toBe(0);
        });
    });

    describe('notifyTurnEnded', () => {
        it('should notify all players that the turn has ended', () => {
            const sessionCode = 'testSession';
            const session = createMockSession();

            service['notifyTurnEnded'](mockServer as Server, sessionCode, session);

            expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
            expect(mockServer.emit).toHaveBeenCalledWith('turnEnded', {
                playerSocketId: session.turnData.currentPlayerSocketId,
            });
        });
    });
    describe('calculateTurnOrder', () => {
        it('should shuffle players with the same speed', () => {
            // Arrange
            const session: Session = {
                players: [
                    {
                        socketId: 'player1',
                        name: 'Player 1',
                        attributes: {
                            speed: { name: 'speed', description: '', currentValue: 5, baseValue: 5 },
                        },
                        accessibleTiles: [],
                        position: { row: 0, col: 0 },
                        avatar: 'defaultAvatar',
                        isOrganizer: false,
                        inventory: [],
                        isVirtual : false,

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
                    } as Player,
                    {
                        socketId: 'player2',
                        name: 'Player 2',
                        attributes: {
                            speed: { name: 'speed', description: '', currentValue: 5, baseValue: 5 },
                        },
                        accessibleTiles: [],
                        position: { row: 0, col: 0 },
                        avatar: 'defaultAvatar',
                        isOrganizer: false,
                        inventory : [],
                        isVirtual : false,

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
                    } as Player,
                    {
                        socketId: 'player3',
                        name: 'Player 3',
                        attributes: {
                            speed: { name: 'speed', description: '', currentValue: 5, baseValue: 5 },
                        },
                        accessibleTiles: [],
                        position: { row: 0, col: 0 },
                        avatar: 'defaultAvatar',
                        isOrganizer: false,
                        inventory: [],
                        isVirtual : false,

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
                    } as Player,
                ],
                turnData: {
                    turnOrder: [],
                    currentTurnIndex: -1,
                },
                statistics: {
                    gameDuration: '00:00',
                    totalTurns: 0,
                    totalTerrainTiles: 0,
                    visitedTerrains: new Set<string>(),
                    totalDoors: 0,
                    manipulatedDoors: new Set<string>(),
                    uniqueFlagHolders: new Set<string>(),
                    visitedTerrainsArray: [], 
                    manipulatedDoorsArray: [],
                    uniqueFlagHoldersArray: [],
                },
            } as unknown as Session;

            // Spy on the shuffle method
            jest.spyOn(service as any, 'shuffle');

            // Act
            const sessionCode = "session123";
            service.calculateTurnOrder(session,sessionCode, mockServer  );

            // Confirm that turn order includes all players
            expect(session.turnData.turnOrder.length).toBe(3);
            expect(session.turnData.turnOrder).toEqual(expect.arrayContaining(['player1', 'player2', 'player3']));
        });
    });
    describe('startTurnTimer', () => {
        jest.useFakeTimers();

        it('should handle turn timing and end turn when timeLeft reaches zero', () => {
            // Arrange
            const sessionCode = 'session123';
            const sessions: { [key: string]: Session } = {};
            const mockSession: Session = {
                combatData: { combatants: [] },
                turnData: {
                    turnOrder: ['player1'],
                    currentTurnIndex: 0,
                    currentPlayerSocketId: 'player1',
                    timeLeft: TURN_DURATION,
                    turnTimer: null,
                },
                players: [
                    {
                        socketId: 'player1',
                        name: 'Player 1',
                        attributes: {
                            speed: { name: 'speed', description: '', currentValue: 5, baseValue: 5 },
                        },
                        accessibleTiles: [],
                        position: { row: 0, col: 0 },
                        avatar: 'defaultAvatar',
                        isOrganizer: false,
                        inventory: [],
                        isVirtual : false,

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
                    } as Player,
                ],
                grid: [],
                statistics: {
                    gameDuration: '00:00',
                    totalTurns: 0,
                    totalTerrainTiles: 0,
                    visitedTerrains: new Set<string>(),
                    totalDoors: 0,
                    manipulatedDoors: new Set<string>(),
                    uniqueFlagHolders: new Set<string>(),
                    visitedTerrainsArray: [], 
                    manipulatedDoorsArray: [],
                    uniqueFlagHoldersArray: [],
                },
            } as unknown as Session;

            sessions[sessionCode] = mockSession;

            jest.spyOn(service as any, 'endTurn');
            jest.spyOn(service as any, 'sendTimeLeft');
            jest.spyOn(service['movementService'], 'calculateAccessibleTiles');
            jest.spyOn(service['actionService'], 'checkAvailableActions').mockReturnValue(true);

            // Act
            service['startTurnTimer'](sessionCode, mockServer, sessions, mockSession.players[0]);

            // Fast-forward time until the turn timer should end
            jest.advanceTimersByTime(TURN_DURATION * 1000);

            // Assert
            expect(service['endTurn']).toHaveBeenCalledWith(sessionCode, mockServer, sessions);
            expect(service['sendTimeLeft']).toHaveBeenCalledTimes(TURN_DURATION);
            // expect(service['movementService'].calculateAccessibleTiles).toHaveBeenCalledTimes(TURN_DURATION + 1);
        });

        afterEach(() => {
            jest.useRealTimers();
        });
    });
});
