/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { CombatTurnService } from './combat-turn.service';
import { CombatGateway } from '@app/gateways/combat/combat.gateway';
import { CombatService } from '@app/services/combat/combat.service';
import { Server } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import {
    COMBAT_EVASION_TURN_DURATION,
    COMBAT_TIME_INTERVAL,
    COMBAT_TURN_DURATION,
    VP_COMBAT_MAX_TIME,
    VP_COMBAT_MIN_TIME,
} from '@app/constants/fight-constants';

describe('CombatTurnService', () => {
    let service: CombatTurnService;
    let combatGateway: CombatGateway;
    let combatService: CombatService;
    let mockServer: Server;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CombatTurnService,
                {
                    provide: CombatGateway,
                    useValue: {
                        handleAttack: jest.fn(),
                    },
                },
                {
                    provide: CombatService,
                    useValue: {
                        attemptEvasion: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<CombatTurnService>(CombatTurnService);
        combatGateway = module.get<CombatGateway>(CombatGateway);
        combatService = module.get<CombatService>(CombatService);

        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            sockets: {
                sockets: new Map(),
            },
        } as unknown as Server;
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    // Helper function to create a mock session
    const createMockSession = (): Session => ({
        combatData: {
            combatants: [
                {
                    socketId: 'combatant1',
                    attributes: { nbEvasion: { currentValue: 1, name: 'nbEvasion', description: 'Evasion attempts', baseValue: 1 } },
                },
                {
                    socketId: 'combatant2',
                    attributes: { nbEvasion: { currentValue: 0, baseValue: 0, description: 'Evasion attempts', name: 'nbEvasion' } },
                },
            ],
            turnIndex: 0,
            timeLeft: 0,
            turnTimer: null,
            lastAttackResult: null,
        },
    } as unknown as Session);

    describe('startCombatTurnTimer', () => {
        it('should start the combat turn timer with evasion attempts', () => {
            const session = createMockSession();
            service['startCombatTurnTimer']('sessionCode', mockServer, session);

            expect(session.combatData.timeLeft).toBe(COMBAT_TURN_DURATION / COMBAT_TIME_INTERVAL);
            expect(mockServer.to).toHaveBeenCalledWith('combatant1');
            expect(mockServer.emit).toHaveBeenCalledWith('combatTurnStarted', {
                playerSocketId: 'combatant1',
                timeLeft: session.combatData.timeLeft,
            });
        });

        it('should start the combat turn timer without evasion attempts', () => {
            const session = createMockSession();
            session.combatData.turnIndex = 1;
            service['startCombatTurnTimer']('sessionCode', mockServer, session);

            expect(session.combatData.timeLeft).toBe(COMBAT_EVASION_TURN_DURATION / COMBAT_TIME_INTERVAL);
            expect(mockServer.to).toHaveBeenCalledWith('combatant2');
            expect(mockServer.emit).toHaveBeenCalledWith('combatTurnStarted', {
                playerSocketId: 'combatant2',
                timeLeft: session.combatData.timeLeft,
            });
        });

        it('should handle combat time left and end turn if no action taken', () => {
            jest.useFakeTimers();
            const session = createMockSession();
            service['startCombatTurnTimer']('sessionCode', mockServer, session);

            jest.advanceTimersByTime(COMBAT_TURN_DURATION);

            expect(mockServer.to).toHaveBeenCalledWith('combatant1');
            expect(mockServer.emit).toHaveBeenCalledWith('combatTimeLeft', {
                timeLeft: 0,
                playerSocketId: 'combatant1',
            });
            expect(combatGateway.handleAttack).toHaveBeenCalledWith(null, {
                sessionCode: 'sessionCode',
                clientSocketId: 'combatant1',
            });
        });

        it('should handle combat time left and end turn if action taken', () => {
            jest.useFakeTimers();
            const session = createMockSession();
            service['startCombatTurnTimer']('sessionCode', mockServer, session);
            service.markActionTaken(); // Mark action as taken

            jest.advanceTimersByTime(COMBAT_TURN_DURATION);

            expect(mockServer.to).toHaveBeenCalledWith('combatant1');
            expect(mockServer.emit).toHaveBeenCalledWith('combatTimeLeft', {
                timeLeft: 0,
                playerSocketId: 'combatant1',
            });
        });
    });

    describe('endCombatTurn', () => {
        it('should end the combat turn and start the next turn', () => {
            const session = createMockSession();
            jest.spyOn(service, 'startCombatTurnTimer').mockImplementation();

            service.endCombatTurn('sessionCode', mockServer, session);

            expect(session.combatData.turnIndex).toBe(1);
            expect(mockServer.to).toHaveBeenCalledWith('combatant2');
            expect(mockServer.emit).toHaveBeenCalledWith('combatTurnStarted', {
                playerSocketId: 'combatant2',
            });
            expect(service['startCombatTurnTimer']).toHaveBeenCalledWith('sessionCode', mockServer, session);
        });

        it('should trigger evasion for a defensive virtual player if attacked previously', () => {
            const virtualCombatant = {
                socketId: 'player2',
                isVirtual: true,
                type: 'Défensif',
                attributes: { nbEvasion: { currentValue: 1, baseValue: 1, description: 'Evasion attempts', name: 'nbEvasion' } },
                name: '',
                avatar: '',
                isOrganizer: false,
                position: undefined,
                accessibleTiles: [],
                inventory: [],
                statistics: undefined
            };

            const mockSession = createMockSession();
            mockSession.combatData.combatants = [
                {
                    socketId: 'player1',
                    isVirtual: false,
                    attributes: { nbEvasion: { currentValue: 0, baseValue: 0, description: 'Evasion attempts', name: 'nbEvasion' } },
                    name: '',
                    avatar: '',
                    isOrganizer: false,
                    position: undefined,
                    accessibleTiles: [],
                    inventory: [],
                    statistics: undefined
                },
                virtualCombatant,
            ];

            // Set lastAttackResult to indicate that player2 was attacked successfully
            mockSession.combatData.lastAttackResult = {
                success: true,
                target: virtualCombatant,
                attacker: mockSession.combatData.combatants[0],
            };

            jest.useFakeTimers();
            jest.spyOn(service['combatService'], 'attemptEvasion').mockImplementation();

            service.endCombatTurn('testSessionCode', mockServer, mockSession);

            // Fast-forward until all timers have been executed
            jest.runAllTimers();

            expect(service['combatService'].attemptEvasion).toHaveBeenCalledWith(
                'testSessionCode',
                virtualCombatant,
                mockServer,
            );
        });

        it('should trigger attack for a virtual player', () => {
            const virtualCombatant = {
                socketId: 'player2',
                isVirtual: true,
                type: 'Aggressif', // Assuming a different type triggers attack
                attributes: { nbEvasion: { currentValue: 0, name: '', description: '', baseValue: 0 } },
                // ... other properties
            };

            const mockSession = createMockSession();
            mockSession.combatData.combatants = [
                {
                    socketId: 'player1',
                    isVirtual: false,
                    attributes: {
                        nbEvasion: {
                            currentValue: 0,
                            name: '',
                            description: '',
                            baseValue: 0
                        }
                    },
                    name: '',
                    avatar: '',
                    isOrganizer: false,
                    position: undefined,
                    accessibleTiles: [],
                    inventory: [],
                    statistics: undefined
                },
                {
                    socketId: 'player2',
                    isVirtual: true,
                    type: 'Aggressif',
                    attributes: {
                        nbEvasion: {
                            currentValue: 0,
                            name: '',
                            description: '',
                            baseValue: 0
                        }
                    },
                    name: '',
                    avatar: '',
                    isOrganizer: false,
                    position: undefined,
                    accessibleTiles: [],
                    inventory: [],
                    statistics: undefined
                }
            ];

            jest.useFakeTimers();
            jest.spyOn(service['combatGateway'], 'handleAttack').mockImplementation();

            service.endCombatTurn('testSessionCode', mockServer, mockSession);

            // Fast-forward until all timers have been executed
            jest.runAllTimers();

            expect(service['combatGateway'].handleAttack).toHaveBeenCalledWith(null, {
                sessionCode: 'testSessionCode',
                clientSocketId: virtualCombatant.socketId,
            });
        });
    });

    describe('endCombat', () => {
        it('should end the combat and clear combat data', () => {
            const mockSession = createMockSession();
            const timerMock = jest.fn();
            mockSession.combatData.turnTimer = timerMock as unknown as NodeJS.Timeout;

            jest.spyOn(global, 'clearInterval').mockImplementation(() => {});

            service.endCombat('testSessionCode', mockServer, mockSession);

            expect(mockSession.combatData.turnTimer).toBeNull();
            expect(mockServer.to).toHaveBeenCalledWith('testSessionCode');
            expect(mockServer.emit).toHaveBeenCalledWith('combatEnded', { message: 'Le combat est fini.' });
            expect(mockSession.combatData.combatants).toEqual([]);
            expect(mockSession.combatData.turnIndex).toBe(-1);
        });

        it('should handle endCombat gracefully with no combatants', () => {
            const mockSession = createMockSession();
            mockSession.combatData.combatants = []; // No combatants

            service.endCombat('testSessionCode', mockServer as Server, mockSession);

            expect(mockServer.emit).toHaveBeenCalledWith('combatEnded', { message: 'Le combat est fini.' });
            expect(mockSession.combatData.turnIndex).toBe(-1);
        });
    });

    describe('markActionTaken', () => {
        it('should mark action as taken', () => {
            service.markActionTaken();
            expect(service['actionTaken']).toBe(true);
        });
    });

    describe('startCombat', () => {
        it('should start the combat and the first turn timer', () => {
            const session = createMockSession();
            jest.spyOn(service, 'startCombatTurnTimer').mockImplementation();

            service.startCombat('sessionCode', mockServer, session);

            expect(session.combatData.turnIndex).toBe(0);
            expect(service.startCombatTurnTimer).toHaveBeenCalledWith('sessionCode', mockServer, session);
        });
    });

    it('should attempt evasion for a virtual defensive combatant if attacked successfully', () => {
        const virtualDefensiveCombatant = {
            socketId: 'player2',
            isVirtual: true,
            type: 'Défensif', // This is important to trigger the block
            attributes: { nbEvasion: { currentValue: 1, name: 'nbEvasion', description: 'Evasion attempts', baseValue: 1 } },
            name: '',
            avatar: '',
            isOrganizer: false,
            position: undefined,
            accessibleTiles: [],
            inventory: [],
            statistics: undefined,
        };
    
        const mockSession = createMockSession();
        mockSession.combatData.combatants = [
            {
                socketId: 'player1',
                isVirtual: false,
                attributes: {
                    nbEvasion: {
                        currentValue: 0,
                        name: '',
                        description: '',
                        baseValue: 0
                    }
                },
                name: '',
                avatar: '',
                isOrganizer: false,
                position: undefined,
                accessibleTiles: [],
                inventory: [],
                statistics: undefined
            },
            virtualDefensiveCombatant,
        ];
    
        // Simulate a successful attack on the virtual combatant
        mockSession.combatData.lastAttackResult = {
            success: true,
            target: virtualDefensiveCombatant,
            attacker: mockSession.combatData.combatants[0],
        };
    
        jest.useFakeTimers();
        jest.spyOn(service['combatService'], 'attemptEvasion').mockImplementation();
    
        // Call the method that contains the logic to be tested
        service.endCombatTurn('testSessionCode', mockServer, mockSession);
    
        // Fast-forward until the setTimeout callback is triggered
        jest.runAllTimers();
    
        // Ensure attemptEvasion was called
        expect(service['combatService'].attemptEvasion).toHaveBeenCalledWith(
            'testSessionCode',
            virtualDefensiveCombatant,
            mockServer,
        );
    });
    
});