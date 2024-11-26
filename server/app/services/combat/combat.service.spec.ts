/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { CombatService } from './combat.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { FightService } from '@app/services/fight/fight.service';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { TurnService } from '@app/services/turn/turn.service';
import { Player } from '@app/interfaces/player/player.interface';
import { Server } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import { Grid } from '@app/interfaces/session/grid.interface';
import { Position } from '@app/interfaces/player/position.interface';
import { COMBAT_WIN_THRESHOLD, DELAY_BEFORE_NEXT_TURN } from '@app/constants/session-gateway-constants';

describe('CombatService', () => {
    let combatService: CombatService;
    let sessionsService: SessionsService;
    let fightService: FightService;
    let eventsService: EventsGateway;
    let changeGridService: ChangeGridService;
    let turnService: TurnService;
    let mockServer: Partial<Server>;

    let mockSession: Session;
    let player1: Player;
    let player2: Player;

    beforeEach(async () => {
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };

        player1 = {
            socketId: 'player1',
            name: 'Player 1',
            attributes: {
                combatWon: { name: 'combatWon', description: '', currentValue: 0, baseValue: 0 },
                nbEvasion: { name: 'nbEvasion', description: '', currentValue: 3, baseValue: 3 },
                life: { name: 'life', description: '', currentValue: 10, baseValue: 10 },
            },
            statistics: {
                combats: 0,
                victories: 0,
                defeats: 0,
                evasions: 0,
                totalLifeLost: 0,
                totalLifeRemoved: 0,
                uniqueItems: new Set<string>(),
                tilesVisited: new Set<string>(),
                uniqueItemsArray: [],
                tilesVisitedArray: [],
            },
            initialPosition: { row: 0, col: 0 },
            position: { row: 1, col: 1 },
            isVirtual: false,
            isOrganizer: false,
            avatar: 'avatar1.png',
            accessibleTiles: [],
            inventory: [],
        } as Player;

        player2 = {
            socketId: 'player2',
            name: 'Player 2',
            attributes: {
                combatWon: { name: 'combatWon', description: '', currentValue: 0, baseValue: 0 },
                nbEvasion: { name: 'nbEvasion', description: '', currentValue: 3, baseValue: 3 },
                life: { name: 'life', description: '', currentValue: 10, baseValue: 10 },
            },
            statistics: {
                combats: 0,
                victories: 0,
                defeats: 0,
                evasions: 0,
                totalLifeLost: 0,
                totalLifeRemoved: 0,
                uniqueItems: new Set<string>(),
                tilesVisited: new Set<string>(),
                uniqueItemsArray: [],
                tilesVisitedArray: [],
            },
            initialPosition: { row: 0, col: 0 },
            position: { row: 1, col: 1 },
            isVirtual: true,
            isOrganizer: false,
            avatar: 'avatar1.png',
            accessibleTiles: [],
            inventory: [],
        } as Player;

        mockSession = {
            sessionCode: 'session1',
            players: [player1, player2],
            combatData: {
                combatants: [],
                turnIndex: 0,
                timeLeft: 60,
                turnTimer: null,
                lastAttackResult: null,
            },
            turnData: {
                currentPlayerSocketId: player1.socketId,
                timeLeft: 60,
                turnTimer: null,
                paused: false,
            },
            grid: [
                [{ images: [], isOccuped: false }, { images: [], isOccuped: false }],
                [{ images: [], isOccuped: false }, { images: [], isOccuped: false }],
            ],
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
                visitedTerrains: new Set<string>(),
                visitedTerrainsArray: [],
                uniqueFlagHolders: new Set<string>(),
                uniqueFlagHoldersArray: [],
                manipulatedDoors: new Set<string>(),
                manipulatedDoorsArray: [],
            },
            ctf: false,
        } as unknown as Session;

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
                        getAdjacentPositions: jest.fn(),
                    },
                },
                {
                    provide: TurnService,
                    useValue: {
                        pauseVirtualPlayerTimer: jest.fn(),
                        pauseTurnTimer: jest.fn(),
                        resumeVirtualPlayerTimer: jest.fn(),
                        resumeTurnTimer: jest.fn(),
                        endTurn: jest.fn(),
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
    });

    describe('initiateCombat', () => {
        it('should initiate combat successfully', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);

            combatService.initiateCombat('session1', player1, player2, mockServer as Server);

            expect(player1.statistics.combats).toBe(1);
            expect(player2.statistics.combats).toBe(1);
            expect(fightService.notifyCombatStart).toHaveBeenCalledWith(mockServer, player1, player2);
            expect(fightService.startCombat).toHaveBeenCalledWith('session1', mockServer, mockSession);
            expect(eventsService.addEventToSession).toHaveBeenCalledWith('session1', expect.any(String), ['everyone']);

            expect(turnService.pauseTurnTimer).toHaveBeenCalledWith(mockSession);
        });

        it('should return if session not found', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            combatService.initiateCombat('session1', player1, player2, mockServer as Server);

            expect(fightService.notifyCombatStart).not.toHaveBeenCalled();
        });
    });

    describe('executeAttack', () => {
        it('should execute attack and process attack result', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
            (fightService.calculateAttack as jest.Mock).mockReturnValue({ success: true });

            const processAttackResultSpy = jest.spyOn<any, any>(combatService, 'processAttackResult');

            combatService.executeAttack('session1', player1, player2, mockServer as Server);

            expect(fightService.calculateAttack).toHaveBeenCalledWith(player1, player2, mockSession);
            expect(processAttackResultSpy).toHaveBeenCalledWith({ success: true }, player1, player2, mockServer, 'session1');
        });

        it('should return if session not found', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            combatService.executeAttack('session1', player1, player2, mockServer as Server);

            expect(fightService.calculateAttack).not.toHaveBeenCalled();
        });
    });

    describe('attemptEvasion', () => {
        it('should attempt evasion and process evasion result', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
            (fightService.calculateEvasion as jest.Mock).mockReturnValue(true);

            const processEvasionResultSpy = jest.spyOn<any, any>(combatService, 'processEvasionResult');

            combatService.attemptEvasion('session1', player1, mockServer as Server);

            expect(fightService.calculateEvasion).toHaveBeenCalledWith(player1);
            expect(processEvasionResultSpy).toHaveBeenCalledWith(true, 'session1', player1, mockServer, mockSession);
        });

        it('should return if session not found', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            combatService.attemptEvasion('session1', player1, mockServer as Server);

            expect(fightService.calculateEvasion).not.toHaveBeenCalled();
        });
    });

    describe('finalizeCombat', () => {
        beforeEach(() => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);
        });

        it('should process win condition when reason is win', () => {
            const processWinConditionSpy = jest.spyOn<any, any>(combatService, 'processWinCondition');
            const resetCombatDataSpy = jest.spyOn<any, any>(combatService, 'resetCombatData');

            combatService.finalizeCombat('session1', player1, player2, 'win', mockServer as Server);

            expect(processWinConditionSpy).toHaveBeenCalledWith(player1, player2, mockSession, mockServer, 'session1');
            expect(eventsService.addEventToSession).toHaveBeenCalledWith(
                'session1',
                expect.stringContaining(`${player1.name} a gagné.`),
                ['everyone'],
            );
            expect(resetCombatDataSpy).toHaveBeenCalledWith(mockSession, 'session1', mockServer, player1, player2);
        });

        it('should process evasion condition when reason is evasion', () => {
            const processEvasionConditionSpy = jest.spyOn<any, any>(combatService, 'processEvasionCondition');
            const resetCombatDataSpy = jest.spyOn<any, any>(combatService, 'resetCombatData');

            combatService.finalizeCombat('session1', null, player1, 'evasion', mockServer as Server);

            expect(processEvasionConditionSpy).toHaveBeenCalledWith(player1, mockSession, mockServer, 'session1');
            expect(eventsService.addEventToSession).toHaveBeenCalledWith(
                'session1',
                expect.stringContaining(`${player1.name} a réussi à s'échapper.`),
                ['everyone'],
            );
            expect(resetCombatDataSpy).toHaveBeenCalledWith(mockSession, 'session1', mockServer, null, player1);
        });

        it('should return if session not found', () => {
            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            combatService.finalizeCombat('session1', player1, player2, 'win', mockServer as Server);

            expect(eventsService.addEventToSession).not.toHaveBeenCalled();
        });
    });

    describe('Private Methods', () => {
        describe('processAttackResult', () => {
            it('should process a successful attack and defeat the opponent', () => {
                const finalizeCombatSpy = jest.spyOn<any, any>(combatService, 'finalizeCombat').mockImplementation();

                (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);

                combatService['processAttackResult']({ success: true }, player1, player2, mockServer as Server, 'session1');

                expect(player2.attributes['life'].currentValue).toBeLessThan(player2.attributes['life'].baseValue);
                expect(player2.statistics.totalLifeLost).toBe(1);
                expect(player1.statistics.totalLifeRemoved).toBe(1);

                expect(finalizeCombatSpy).not.toHaveBeenCalled();

                // Reduce opponent life to 0 to trigger finalizeCombat
                player2.attributes['life'].currentValue = 0;
                combatService['processAttackResult']({ success: true }, player1, player2, mockServer as Server, 'session1');

                expect(finalizeCombatSpy).toHaveBeenCalledWith('session1', player1, player2, 'win', mockServer);
            });

            it('should process an unsuccessful attack', () => {
                (sessionsService.getSession as jest.Mock).mockReturnValue(mockSession);

                combatService['processAttackResult']({ success: false }, player1, player2, mockServer as Server, 'session1');

                // Life points should remain the same
                expect(player2.attributes['life'].currentValue).toBe(player2.attributes['life'].baseValue);

                expect(mockServer.to).toHaveBeenCalledTimes(5); // Two for updateLifePoints, two for attackResult
                expect(fightService.endCombatTurn).toHaveBeenCalledWith('session1', mockServer, mockSession);
            });
        });

        describe('processEvasionResult', () => {
            it('should finalize combat on successful evasion', () => {
                const finalizeCombatSpy = jest.spyOn<any, any>(combatService, 'finalizeCombat').mockImplementation();

                combatService['processEvasionResult'](true, 'session1', player1, mockServer as Server, mockSession);

                expect(finalizeCombatSpy).toHaveBeenCalledWith('session1', null, player1, 'evasion', mockServer);
            });

            it('should end combat turn on failed evasion', () => {
                combatService['processEvasionResult'](false, 'session1', player1, mockServer as Server, mockSession);

                expect(fightService.endCombatTurn).toHaveBeenCalledWith('session1', mockServer, mockSession);
            });
        });

        describe('processWinCondition', () => {
            beforeEach(() => {
                player1.initialPosition = { row: 0, col: 0 };
                player2.position = { row: 1, col: 1 };

                mockSession.grid = [
                    [{ images: [], isOccuped: false }, { images: [], isOccuped: false }],
                    [{ images: [], isOccuped: false }, { images: [], isOccuped: false }],
                ];
            });

            it('should process win condition and move loser to initial position', () => {
                (changeGridService.moveImage as jest.Mock).mockReturnValue(true);
                (combatService as any)['isPositionOccupiedByAvatar'] = jest.fn().mockReturnValue(false);

                combatService['processWinCondition'](player1, player2, mockSession, mockServer as Server, 'session1');

                expect(player1.attributes['combatWon'].currentValue).toBe(1);
                expect(player1.statistics.victories).toBe(1);
                expect(player2.statistics.defeats).toBe(1);
                expect(player2.position).toEqual(player2.initialPosition);

                expect(player1.attributes['life'].currentValue).toBe(player1.attributes['life'].baseValue);
                expect(player2.attributes['life'].currentValue).toBe(player2.attributes['life'].baseValue);

                expect(changeGridService.moveImage).toHaveBeenCalled();
                expect(eventsService.addEventToSession).toHaveBeenCalledWith('session1', expect.any(String), ['everyone']);
            });

            it('should find nearest available position if initial position is occupied', () => {
                (changeGridService.moveImage as jest.Mock).mockReturnValue(true);
                (combatService as any)['isPositionOccupiedByAvatar'] = jest.fn().mockReturnValue(true);
                (combatService as any)['findNearestAvailablePosition'] = jest.fn().mockReturnValue({ row: 0, col: 1 });

                combatService['processWinCondition'](player1, player2, mockSession, mockServer as Server, 'session1');

                expect(changeGridService.moveImage).toHaveBeenCalledWith(
                    mockSession.grid,
                    { row: 1, col: 1 },
                    { row: 0, col: 1 },
                    player2.avatar,
                );
            });

            it('should throw error if no available position found', () => {
                (combatService as any)['isPositionOccupiedByAvatar'] = jest.fn().mockReturnValue(true);
                (combatService as any)['findNearestAvailablePosition'] = jest.fn().mockReturnValue(null);

                expect(() => {
                    combatService['processWinCondition'](player1, player2, mockSession, mockServer as Server, 'session1');
                }).toThrow('No available position found for the loser.');
            });
        });

        describe('resetCombatData', () => {
            it('should reset combat data and check for game end', () => {
                player1.attributes['combatWon'].currentValue = COMBAT_WIN_THRESHOLD;
                mockSession.ctf = false;

                combatService['resetCombatData'](mockSession, 'session1', mockServer as Server, player1, player2);

                expect(mockSession.combatData.combatants).toEqual([]);
                expect(player1.attributes['nbEvasion'].currentValue).toBe(player1.attributes['nbEvasion'].baseValue);
                expect(player2.attributes['nbEvasion'].currentValue).toBe(player2.attributes['nbEvasion'].baseValue);

                expect(eventsService.addEventToSession).toHaveBeenCalledWith(
                    'session1',
                    `${player1.name} wins with 3 victories!`,
                    ['everyone'],
                );
                expect(mockServer.to).toHaveBeenCalledWith('session1');

                // Wait for setTimeout to allow coverage
                jest.runAllTimers();
            });

            it('should call endCombat if no player reached win threshold', () => {
                player1.attributes['combatWon'].currentValue = COMBAT_WIN_THRESHOLD - 1;

                combatService['resetCombatData'](mockSession, 'session1', mockServer as Server, player1, player2);

                expect(fightService.endCombat).toHaveBeenCalledWith('session1', mockServer, mockSession);
            });
        });

        describe('isPositionOccupiedByAvatar', () => {
            it('should return true if position is occupied by avatar', () => {
                const grid: Grid = [
                    [{ images: ['assets/avatars/avatar1.png'], isOccuped: true }],
                    [{ images: [], isOccuped: false }],
                ];
                const position: Position = { row: 0, col: 0 };

                const result = combatService['isPositionOccupiedByAvatar'](position, grid);

                expect(result).toBe(true);
            });

            it('should return false if position is not occupied by avatar', () => {
                const grid: Grid = [
                    [{ images: [], isOccuped: false }],
                    [{ images: [], isOccuped: false }],
                ];
                const position: Position = { row: 0, col: 0 };

                const result = combatService['isPositionOccupiedByAvatar'](position, grid);

                expect(result).toBe(false);
            });
        });

        describe('findNearestAvailablePosition', () => {
            it('should find nearest available position', () => {
                const grid: Grid = [
                    [{ images: ['assets/avatars/avatar1.png'], isOccuped: true }, { images: [], isOccuped: false }],
                    [{ images: [], isOccuped: false }, { images: [], isOccuped: false }],
                ];
                const startPosition: Position = { row: 0, col: 0 };

                (changeGridService.getAdjacentPositions as jest.Mock).mockImplementation((position: Position) => {
                    if (position.row === 0 && position.col === 0) {
                        return [{ row: 0, col: 1 }, { row: 1, col: 0 }];
                    }
                    return [];
                });

                const result = combatService['findNearestAvailablePosition'](startPosition, grid);

                expect(result).toEqual({ row: 0, col: 1 });
            });

            it('should return null if no available position found', () => {
                const grid: Grid = [
                    [{ images: ['assets/avatars/avatar1.png'], isOccuped: true }, { images: ['assets/avatars/avatar2.png'], isOccuped: true }],
                    [{ images: ['assets/avatars/avatar3.png'], isOccuped: true }, { images: ['assets/avatars/avatar4.png'], isOccuped: true }],
                ];
                const startPosition: Position = { row: 0, col: 0 };

                (changeGridService.getAdjacentPositions as jest.Mock).mockImplementation(() => []);

                const result = combatService['findNearestAvailablePosition'](startPosition, grid);

                expect(result).toBeNull();
            });
        });
    });
});