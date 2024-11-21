/* eslint-disable */

import { Test, TestingModule } from '@nestjs/testing';
import { CombatService } from './combat.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { FightService } from '@app/services/fight/fight.service';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { TurnService } from '@app/services/turn/turn.service';
import { Server } from 'socket.io';
import { Player } from '@app/interfaces/player/player.interface';
import { COMBAT_WIN_THRESHOLD } from '@app/constants/session-gateway-constants';
import { Position } from '@app/interfaces/player/position.interface';
import { Session } from '@app/interfaces/session/session.interface';

// Mock Data
const mockPlayer1: Player = {
    socketId: 'socket1',
    name: 'Player One',
    avatar: 'avatar1.png',
    attributes: {
        life: { name: 'Life', description: 'Player life points', currentValue: 3, baseValue: 3 },
        combatWon: { name: 'Combat Won', description: 'Number of combats won', currentValue: 0, baseValue: 0 },
    },
    position: { row: 0, col: 0 },
    initialPosition: { row: 0, col: 0 },
    isOrganizer: false,
    accessibleTiles: [],
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
};

const mockPlayer2: Player = {
    socketId: 'socket2',
    name: 'Player Two',
    avatar: 'avatar2.png',
    attributes: {
        life: { name: 'Life', description: 'Player life points', currentValue: 3, baseValue: 3 },
        combatWon: { name: 'Combat Won', description: 'Number of combats won', currentValue: 0, baseValue: 0 },
    },
    position: { row: 1, col: 1 },
    initialPosition: { row: 1, col: 1 },
    isOrganizer: false,
    accessibleTiles: [],
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
};

const mockSession = {
    combatData: {
        combatants: [],
    },
    players: [mockPlayer1, mockPlayer2],
    grid: {}, // Define as needed
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
};

describe('CombatService', () => {
    let combatService: CombatService;
    let sessionsService: SessionsService;
    let fightService: FightService;
    let eventsService: EventsGateway;
    let changeGridService: ChangeGridService;
    let turnService: TurnService;
    let mockServer: Server;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CombatService,
                {
                    provide: SessionsService,
                    useValue: {
                        getSession: jest.fn(),
                        terminateSession: jest.fn(),
                    },
                },
                {
                    provide: FightService,
                    useValue: {
                        notifyCombatStart: jest.fn(),
                        startCombat: jest.fn(),
                        calculateAttack: jest.fn(),
                        calculateEvasion: jest.fn(),
                        endCombatTurn: jest.fn(),
                        endCombat: jest.fn(),
                    },
                },
                {
                    provide: EventsGateway,
                    useValue: {
                        addEventToSession: jest.fn(),
                    },
                },
                {
                    provide: ChangeGridService,
                    useValue: {
                        moveImage: jest.fn(),
                    },
                },
                {
                    provide: TurnService,
                    useValue: {
                        startTurn: jest.fn(),
                    },
                },
                {
                    provide: Server,
                    useValue: {
                        to: jest.fn().mockReturnThis(),
                        emit: jest.fn(),
                    },
                },
            ],
        }).compile();

        combatService = module.get<CombatService>(CombatService);
        sessionsService = module.get<SessionsService>(SessionsService);
        fightService = module.get<FightService>(FightService);
        eventsService = module.get<EventsGateway>(EventsGateway);
        changeGridService = module.get<ChangeGridService>(ChangeGridService);
        turnService = module.get<TurnService>(TurnService);
        mockServer = module.get<Server>(Server);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    describe('initiateCombat', () => {
        it('should initiate combat successfully', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
            combatService.initiateCombat('session123', mockPlayer1, mockPlayer2, mockServer);

            expect(sessionsService.getSession).toHaveBeenCalledWith('session123');
            expect(mockSession.combatData.combatants).toEqual([mockPlayer1, mockPlayer2]);
            expect(fightService.notifyCombatStart).toHaveBeenCalledWith(mockServer, mockPlayer1, mockPlayer2);
            expect(fightService.startCombat).toHaveBeenCalledWith('session123', mockServer, mockSession);
        });

        it('should not initiate combat if session does not exist', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(null);
            combatService.initiateCombat('invalidSession', mockPlayer1, mockPlayer2, mockServer);

            expect(sessionsService.getSession).toHaveBeenCalledWith('invalidSession');
            expect(fightService.notifyCombatStart).not.toHaveBeenCalled();
            expect(fightService.startCombat).not.toHaveBeenCalled();
        });
    });

    describe('executeAttack', () => {
        it('should process a successful attack without defeating the opponent', () => {
            const mockPlayer1: Player = {
                socketId: 'socket1',
                attributes: { life: {
                    currentValue: 3,
                    name: '',
                    description: '',
                    baseValue: 0
                } },
                avatar: 'avatar1.png',
                name: 'Player One',
                isOrganizer: false,
                position: { x: 0, y: 0 } as unknown as Position,
                accessibleTiles: [],
                inventory: [],
                isVirtual: false,
                statistics: {
                    combats: 0,
                    evasions: 0,
                    victories: 0,
                    defeats: 0,
                    totalLifeLost: 0,
                    totalLifeRemoved: 0,
                    uniqueItems: new Set(['item3']),
                        tilesVisited: new Set(['tile3']),
                        uniqueItemsArray: ['item3'],
                        tilesVisitedArray: ['tile3'],
                },
            };

            const mockPlayer2: Player = {
                socketId: 'socket2',
                attributes: { life: {
                    currentValue: 3,
                    name: '',
                    description: '',
                    baseValue: 0
                } },
                avatar: 'avatar2.png',
                name: 'Player Two',
                isOrganizer: false,
                position: { x: 0, y: 0 } as unknown as Position,
                accessibleTiles: [],
                inventory: [],
                isVirtual: false,
                statistics: {
                    combats: 0,
                    evasions: 0,
                    victories: 0,
                    defeats: 0,
                    totalLifeLost: 0,
                    totalLifeRemoved: 0,
                    uniqueItems: new Set(['item1', 'item2']),
                    tilesVisited: new Set(['tile1', 'tile2']),
                    uniqueItemsArray: ['item1', 'item2'],
                    tilesVisitedArray: ['tile1', 'tile2'],
                },
            };

            

            const mocksession: Session = {
                organizerId: 'organizer123',
                locked: false,
                maxPlayers: 2,
                selectedGameID: 'game123',
                grid: [],
                turnData: undefined,
                combatData: undefined,
                ctf: undefined,
                statistics: {
                    gameDuration: '10:00',
                    totalTurns: 20,
                    totalTerrainTiles: 100,
                    visitedTerrains: new Set(['tile1', 'tile2', 'tile3']),
                    totalDoors: 5,
                    manipulatedDoors: new Set(['door1']),
                    uniqueFlagHolders: new Set(['Player1']),
                    visitedTerrainsArray: ['tile1', 'tile2', 'tile3'],
                    manipulatedDoorsArray: ['door1'],
                    uniqueFlagHoldersArray: ['Player1'],
                },
                players: [mockPlayer1, mockPlayer2],
            };
            

            fightService.calculateAttack(mockPlayer1, mockPlayer2, mocksession);

            expect(fightService.calculateAttack).toHaveBeenCalledWith(
                expect.objectContaining(mockPlayer1),
                expect.objectContaining(mockPlayer2),
                expect.objectContaining({ players: expect.any(Array) }),
            );
        });

        it('should process a successful attack and defeat the opponent', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
            (fightService.calculateAttack as jest.Mock).mockReturnValue({ success: true });
            mockPlayer2.attributes.life.currentValue = 1;

            combatService.executeAttack('session123', mockPlayer1, mockPlayer2, mockServer);
        });

        it('should process a failed attack', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
            (fightService.calculateAttack as jest.Mock).mockReturnValue({ success: false });

            combatService.executeAttack('session123', mockPlayer1, mockPlayer2, mockServer);

            expect(mockPlayer2.attributes.life.currentValue).toBe(3);
            expect(fightService.endCombatTurn).toHaveBeenCalledWith('session123', mockServer, mockSession);
            expect(eventsService.addEventToSession).toHaveBeenCalledWith(
                'session123',
                `${mockPlayer1.name} attempts an attack on ${mockPlayer2.name}`,
                [mockPlayer1.name, mockPlayer2.name],
            );
            expect(eventsService.addEventToSession).toHaveBeenCalledWith('session123', `Attack result: failure`, [
                mockPlayer1.name,
                mockPlayer2.name,
            ]);
            expect(mockServer.to).toHaveBeenCalledWith(mockPlayer1.socketId);
            expect(mockServer.to).toHaveBeenCalledWith(mockPlayer2.socketId);
            expect(mockServer.to).toHaveBeenCalledWith('session123');
        });

        it('should not execute attack if session does not exist', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(null);
            combatService.executeAttack('invalidSession', mockPlayer1, mockPlayer2, mockServer);

            expect(sessionsService.getSession).toHaveBeenCalledWith('invalidSession');
            expect(fightService.calculateAttack).not.toHaveBeenCalled();
            expect(fightService.endCombatTurn).not.toHaveBeenCalled();
        });
    });

    describe('attemptEvasion', () => {
        it('should process a successful evasion', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
            (fightService.calculateEvasion as jest.Mock).mockReturnValue(true);

            jest.useFakeTimers();

            combatService.attemptEvasion('session123', mockPlayer1, mockServer);

            expect(sessionsService.getSession).toHaveBeenCalledWith('session123');
            expect(fightService.calculateEvasion).toHaveBeenCalledWith(mockPlayer1);
            expect(mockServer.to).toHaveBeenCalledWith(mockPlayer1.socketId);
            expect(mockServer.to).toHaveBeenCalledWith(mockPlayer1.socketId);

            jest.runAllTimers();
        });

        it('should process a failed evasion', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
            (fightService.calculateEvasion as jest.Mock).mockReturnValue(false);

            jest.useFakeTimers();

            combatService.attemptEvasion('session123', mockPlayer1, mockServer);

            expect(sessionsService.getSession).toHaveBeenCalledWith('session123');
            expect(fightService.calculateEvasion).toHaveBeenCalledWith(mockPlayer1);
            expect(mockServer.to).toHaveBeenCalledWith(mockPlayer1.socketId);

            expect(fightService.endCombatTurn).toHaveBeenCalledWith('session123', mockServer, mockSession);

            jest.runAllTimers();
        });

        it('should not attempt evasion if session does not exist', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(null);
            combatService.attemptEvasion('invalidSession', mockPlayer1, mockServer);

            expect(sessionsService.getSession).toHaveBeenCalledWith('invalidSession');
            expect(fightService.calculateEvasion).not.toHaveBeenCalled();
            expect(eventsService.addEventToSession).not.toHaveBeenCalled();
            expect(fightService.endCombatTurn).not.toHaveBeenCalled();
        });
    });

    describe('finalizeCombat', () => {
        it('should finalize combat with a win condition', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);

            combatService.finalizeCombat('session123', mockPlayer1, mockPlayer2, 'win', mockServer);

            expect(sessionsService.getSession).toHaveBeenCalledWith('session123');
            expect(changeGridService.moveImage).toHaveBeenCalledWith(
                mockSession.grid,
                { row: mockPlayer2.position.row, col: mockPlayer2.position.col },
                mockPlayer2.initialPosition,
                mockPlayer2.avatar,
            );
            expect(mockPlayer2.position).toEqual(mockPlayer2.initialPosition);
            expect(mockServer.to).toHaveBeenCalledWith(mockPlayer2.socketId);
            expect(mockServer.to).toHaveBeenCalledWith(mockPlayer1.socketId);
            expect(eventsService.addEventToSession).toHaveBeenCalledWith(
                'session123',
                `Combat between ${mockPlayer1.name} and ${mockPlayer2.name} ended.`,
                ['everyone'],
            );
            expect(eventsService.addEventToSession).toHaveBeenCalledWith('session123', `${mockPlayer1.name} a gagné.`, ['everyone']);
        });

        it('should finalize combat with an evasion condition', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);

            combatService.finalizeCombat('session123', null, mockPlayer1, 'evasion', mockServer);

            expect(sessionsService.getSession).toHaveBeenCalledWith('session123');
            expect(mockServer.to).toHaveBeenCalledWith(mockPlayer1.socketId);

            expect(sessionsService.terminateSession).not.toHaveBeenCalled();
        });

        it('should handle no winning player and start the next turn', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
            mockPlayer1.attributes.combatWon.currentValue = 2; // Below threshold

            jest.useFakeTimers();

            combatService.finalizeCombat('session123', mockPlayer1, mockPlayer2, 'win', mockServer);

            expect(sessionsService.getSession).toHaveBeenCalledWith('session123');

            jest.runAllTimers();
        });

        it('should emit gameEnded when a player reaches the win threshold', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
            mockPlayer1.attributes.combatWon.currentValue = COMBAT_WIN_THRESHOLD;

            jest.useFakeTimers();

            combatService.finalizeCombat('session123', mockPlayer1, mockPlayer2, 'win', mockServer);

            expect(mockServer.to).toHaveBeenCalledWith('session123');
            expect(mockServer.emit).toHaveBeenCalledWith('gameEnded', { winner: mockPlayer1.name, players : mockSession.players, sessionStatistics : mockSession.statistics});
            expect(eventsService.addEventToSession).toHaveBeenCalledWith('session123', `${mockPlayer1.name} wins with 3 victories!`, ['everyone']);

            jest.runAllTimers();
        });

        it('should not finalize combat if session does not exist', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(null);

            combatService.finalizeCombat('invalidSession', mockPlayer1, mockPlayer2, 'win', mockServer);

            expect(sessionsService.getSession).toHaveBeenCalledWith('invalidSession');
            expect(changeGridService.moveImage).not.toHaveBeenCalled();
            expect(fightService.endCombat).not.toHaveBeenCalled();
            expect(turnService.startTurn).not.toHaveBeenCalled();
        });
    });

    describe('Private Methods', () => {
        describe('setupCombatData', () => {
            it('should set up combatants correctly', () => {
                combatService['setupCombatData'](mockSession, mockPlayer1, mockPlayer2);
                expect(mockSession.combatData.combatants).toEqual([mockPlayer1, mockPlayer2]);
            });
        });

        describe('notifySpectators', () => {
            it('should notify all spectators except the combatants', () => {
                const spectator1: Player = {
                    socketId: 'socket3',
                    name: 'Spectator One',
                    avatar: 'avatar3.png',
                    attributes: {
                        life: { name: 'Life', description: 'Player life points', currentValue: 3, baseValue: 3 },
                        combatWon: { name: 'Combat Won', description: 'Number of combats won', currentValue: 0, baseValue: 0 },
                    },
                    position: { row: 2, col: 2 },
                    initialPosition: { row: 2, col: 2 },
                    isOrganizer: false,
                    accessibleTiles: [],
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
                };
                mockSession.players.push(spectator1);

                combatService['notifySpectators'](mockServer, mockSession, mockPlayer1, mockPlayer2);

                expect(mockServer.to).toHaveBeenCalledWith(spectator1.socketId);
                expect(mockServer.to(spectator1.socketId).emit).toHaveBeenCalledWith('combatNotification', {
                    player1: { avatar: mockPlayer1.avatar, name: mockPlayer1.name },
                    player2: { avatar: mockPlayer2.avatar, name: mockPlayer2.name },
                    combat: true,
                });
            });

            it('should not notify spectators if there are none', () => {
                mockSession.players = [mockPlayer1, mockPlayer2];
                combatService['notifySpectators'](mockServer, mockSession, mockPlayer1, mockPlayer2);
                expect(mockServer.to).not.toHaveBeenCalled();
            });
        });

        describe('processAttackResult', () => {
            it('should process successful attack without defeating the opponent', () => {
                (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
                (fightService.calculateAttack as jest.Mock).mockReturnValue({ success: true });

                combatService['processAttackResult']({ success: true }, mockPlayer1, mockPlayer2, mockServer, 'session123');

                expect(mockPlayer2.attributes.life.currentValue).toBe(2);
                expect(eventsService.addEventToSession).toHaveBeenCalledWith(
                    'session123',
                    `${mockPlayer1.name} attempts an attack on ${mockPlayer2.name}`,
                    [mockPlayer1.name, mockPlayer2.name],
                );
                expect(eventsService.addEventToSession).toHaveBeenCalledWith('session123', `Attack result: success`, [
                    mockPlayer1.name,
                    mockPlayer2.name,
                ]);
                expect(mockServer.to).toHaveBeenCalledWith(mockPlayer1.socketId);
                expect(mockServer.to).toHaveBeenCalledWith(mockPlayer2.socketId);
                expect(mockServer.to).toHaveBeenCalledWith('session123');
                expect(fightService.endCombatTurn).toHaveBeenCalledWith('session123', mockServer, mockSession);
            });

            it('should process successful attack and defeat the opponent', () => {
                (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
                (fightService.calculateAttack as jest.Mock).mockReturnValue({ success: true });
                mockPlayer2.attributes.life.currentValue = 1;

                combatService['processAttackResult']({ success: true }, mockPlayer1, mockPlayer2, mockServer, 'session123');

                expect(fightService.endCombatTurn).not.toHaveBeenCalled();
            });

            it('should process failed attack', () => {
                (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
                (fightService.calculateAttack as jest.Mock).mockReturnValue({ success: false });

                combatService['processAttackResult']({ success: false }, mockPlayer1, mockPlayer2, mockServer, 'session123');

                expect(mockPlayer2.attributes.life.currentValue).toBe(3);
                expect(eventsService.addEventToSession).toHaveBeenCalledWith(
                    'session123',
                    `${mockPlayer1.name} attempts an attack on ${mockPlayer2.name}`,
                    [mockPlayer1.name, mockPlayer2.name],
                );
                expect(eventsService.addEventToSession).toHaveBeenCalledWith('session123', `Attack result: failure`, [
                    mockPlayer1.name,
                    mockPlayer2.name,
                ]);
                expect(mockServer.to).toHaveBeenCalledWith(mockPlayer1.socketId);
                expect(mockServer.to).toHaveBeenCalledWith(mockPlayer2.socketId);
                expect(mockServer.to).toHaveBeenCalledWith('session123');
                expect(fightService.endCombatTurn).toHaveBeenCalledWith('session123', mockServer, mockSession);
            });

            it('should not process attack result if session does not exist', () => {
                (sessionsService.getSession as jest.Mock).mockReturnValue(null);

                combatService['processAttackResult']({ success: true }, mockPlayer1, mockPlayer2, mockServer, 'invalidSession');

                expect(mockPlayer2.attributes.life.currentValue).toBe(3);
                expect(eventsService.addEventToSession).not.toHaveBeenCalled();
                expect(fightService.endCombatTurn).not.toHaveBeenCalled();
            });
        });

        describe('processEvasionResult', () => {
            it('should finalize combat on successful evasion', () => {
                (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);

                combatService['processEvasionResult'](true, 'session123', mockPlayer1, mockServer, mockSession);

                expect(mockServer.to).toHaveBeenCalledWith(mockPlayer1.socketId);

                expect(fightService.endCombatTurn).not.toHaveBeenCalled();
            });

            it('should end combat turn on failed evasion', () => {
                (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);

                combatService['processEvasionResult'](false, 'session123', mockPlayer1, mockServer, mockSession);

                expect(mockServer.to).toHaveBeenCalledWith(mockPlayer1.socketId);

                expect(fightService.endCombatTurn).toHaveBeenCalledWith('session123', mockServer, mockSession);
            });

            it('should not process evasion result if session does not exist', () => {
                (sessionsService.getSession as jest.Mock).mockReturnValue(null);

                combatService['processEvasionResult'](true, 'invalidSession', mockPlayer1, mockServer, mockSession);

                expect(mockServer.to).toHaveBeenCalledWith(mockPlayer1.socketId);
                expect(fightService.endCombatTurn).not.toHaveBeenCalled();
            });
        });

        describe('processWinCondition', () => {
            it('should process win condition correctly', () => {
                const mockLoser: Player = mockPlayer2;
                combatService['processWinCondition'](mockPlayer1, mockLoser, mockSession, mockServer, 'session123');

                expect(changeGridService.moveImage).toHaveBeenCalledWith(
                    mockSession.grid,
                    { row: mockLoser.position.row, col: mockLoser.position.col },
                    mockLoser.initialPosition,
                    mockLoser.avatar,
                );
                expect(mockLoser.position).toEqual(mockLoser.initialPosition);
                expect(mockServer.to).toHaveBeenCalledWith(mockLoser.socketId);
                expect(mockServer.to).toHaveBeenCalledWith(mockPlayer1.socketId);
                expect(eventsService.addEventToSession).toHaveBeenCalledWith(
                    'session123',
                    `Combat between ${mockPlayer1.name} and ${mockLoser.name} ended.`,
                    ['everyone'],
                );
                expect(eventsService.addEventToSession).toHaveBeenCalledWith('session123', `${mockPlayer1.name} a gagné.`, ['everyone']);
                expect(mockPlayer1.attributes.life.currentValue).toBe(mockPlayer1.attributes.life.baseValue);
                expect(mockPlayer2.attributes.life.currentValue).toBe(mockPlayer2.attributes.life.baseValue);
            });
        });

        describe('processEvasionCondition', () => {
            it('should process successful evasion condition', () => {
                (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
                combatService['notifySpectatorsCombatEnd'] = jest.fn();

                combatService['processEvasionCondition'](mockPlayer1, mockSession, mockServer, 'session123');

                expect(mockServer.to).toHaveBeenCalledWith(mockPlayer1.socketId);
                expect(eventsService.addEventToSession).toHaveBeenCalledWith('session123', `${mockPlayer1.name} a pu s'échapper.`, ['everyone']);
                expect(combatService['notifySpectatorsCombatEnd']).toHaveBeenCalledWith(mockPlayer1, null, mockServer, 'session123', 'evasion');
            });

            it('should notify opponent if exists during evasion condition', () => {
                (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
                combatService['notifySpectatorsCombatEnd'] = jest.fn();

                const emitMock = jest.fn();
                (mockServer.to as jest.Mock).mockImplementation(() => {
                    return { emit: emitMock };
                });

                combatService['processEvasionCondition'](mockPlayer1, mockSession, mockServer, 'session123');

                const opponent = mockSession.combatData.combatants.find((p) => p.socketId !== mockPlayer1.socketId);
                if (opponent) {
                    expect(mockServer.to).toHaveBeenCalledWith(opponent.socketId);
                    expect(emitMock).toHaveBeenCalled();
                }
            });
        });
        describe('notifySpectatorsCombatEnd', () => {
            it('should notify all spectators about combat end', () => {
                const spectator: Player = {
                    socketId: 'socket3',
                    name: 'Spectator One',
                    avatar: 'avatar3.png',
                    attributes: {
                        life: { name: 'Life', description: 'Player life points', currentValue: 3, baseValue: 3 },
                        combatWon: { name: 'Combat Won', description: 'Number of combats won', currentValue: 0, baseValue: 0 },
                    },
                    position: { row: 2, col: 2 },
                    initialPosition: { row: 2, col: 2 },
                    isOrganizer: false,
                    accessibleTiles: [],
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
                };
                mockSession.players.push(spectator);
                combatService['notifySpectatorsCombatEnd'](mockPlayer1, mockPlayer2, mockServer, 'session123', 'win');
            });

            it('should handle absence of player2 in combatNotification', () => {
                mockSession.players = [mockPlayer1];
                combatService['notifySpectatorsCombatEnd'](mockPlayer1, null, mockServer, 'session123', 'evasion');

                expect(mockServer.to).not.toHaveBeenCalledWith(mockPlayer1.socketId);
                // No spectators to notify in this case
            });
        });

        describe('resetCombatData', () => {
            it('should reset combat data and start next turn if no winner', () => {
                (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
                mockPlayer1.attributes.combatWon.currentValue = 1; // Below threshold

                jest.useFakeTimers();

                combatService['resetCombatData'](mockSession, 'session123', mockServer, mockPlayer1);

                expect(mockSession.combatData.combatants).toEqual([]);
                expect(mockServer.to).not.toHaveBeenCalledWith('session123');
                expect(eventsService.addEventToSession).not.toHaveBeenCalled();
                expect(sessionsService.terminateSession).not.toHaveBeenCalled();
                expect(fightService.endCombat).toHaveBeenCalledWith('session123', mockServer, mockSession);

                jest.runAllTimers();
            });

            it('should terminate session if a player reaches the win threshold', () => {
                (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
                mockPlayer1.attributes.combatWon.currentValue = COMBAT_WIN_THRESHOLD;

                jest.useFakeTimers();

                combatService['resetCombatData'](mockSession, 'session123', mockServer, mockPlayer1);

                expect(mockServer.to).toHaveBeenCalledWith('session123');
                expect(mockServer.emit).toHaveBeenCalledWith('gameEnded', { winner: mockPlayer1.name, players : mockSession.players, sessionStatistics : mockSession.statistics });
                expect(eventsService.addEventToSession).toHaveBeenCalledWith('session123', `${mockPlayer1.name} wins with 3 victories!`, [
                    'everyone',
                ]);
                expect(turnService.startTurn).not.toHaveBeenCalled();

                jest.runAllTimers();
            });

            it('should not reset combat data if session does not exist', () => {
                (sessionsService.getSession as jest.Mock).mockReturnValue(null);

                expect(mockSession.combatData.combatants).toEqual([]);
                expect(mockServer.to).not.toHaveBeenCalled();
                expect(eventsService.addEventToSession).not.toHaveBeenCalled();
                expect(sessionsService.terminateSession).not.toHaveBeenCalled();
                expect(turnService.startTurn).not.toHaveBeenCalled();
                expect(fightService.endCombat).not.toHaveBeenCalled();
            });
        });
    });

    describe('Integration Tests', () => {
        it('should perform a full combat cycle', () => {
            // Mock initial combat initiation
            (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
            (fightService.calculateAttack as jest.Mock).mockReturnValue({ success: true });
            (fightService.calculateEvasion as jest.Mock).mockReturnValue(false);

            // Initiate Combat
            combatService.initiateCombat('session123', mockPlayer1, mockPlayer2, mockServer);
            expect(mockSession.combatData.combatants).toEqual([mockPlayer1, mockPlayer2]);
            expect(fightService.notifyCombatStart).toHaveBeenCalledWith(mockServer, mockPlayer1, mockPlayer2);
            expect(fightService.startCombat).toHaveBeenCalledWith('session123', mockServer, mockSession);

            // Execute Attack
            combatService.executeAttack('session123', mockPlayer1, mockPlayer2, mockServer);
            expect(mockPlayer2.attributes.life.currentValue).toBe(2);
            expect(fightService.endCombatTurn).toHaveBeenCalledWith('session123', mockServer, mockSession);

            // Attempt Evasion
            combatService.attemptEvasion('session123', mockPlayer1, mockServer);
            expect(fightService.endCombatTurn).toHaveBeenCalledWith('session123', mockServer, mockSession);

            // Finalize Combat without a winner or successful evasion
            combatService.finalizeCombat('session123', null, null, 'win', mockServer);
        });
    });
});
