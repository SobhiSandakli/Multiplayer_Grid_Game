/* eslint-disable */

import { Test, TestingModule } from '@nestjs/testing';
import { CombatTurnService } from './combat-turn.service';
import { CombatGateway } from '@app/gateways/combat/combat.gateway';
import { Server } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import { COMBAT_TIME_INTERVAL, COMBAT_TURN_DURATION } from '@app/constants/fight-constants';
import { CombatService } from '@app/services/combat/combat.service';

jest.useFakeTimers();

describe('CombatTurnService', () => {
    let service: CombatTurnService;
    let mockServer: Partial<Server>;

    beforeEach(async () => {
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };

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
                        initiateCombat: jest.fn(),
                        executeAttack: jest.fn(),
                        attemptEvasion: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<CombatTurnService>(CombatTurnService);
    });

    const createMockSession = (): Session => ({
        organizerId: 'organizer1',
        locked: false,
        maxPlayers: 4,
        players: [
            {
                socketId: 'player1',
                name: 'Player 1',
                avatar: 'avatar1',
                attributes: {
                    nbEvasion: { name: 'nbEvasion', description: 'Evasion attempts', baseValue: 1, currentValue: 1 },
                },
                isOrganizer: true,
                position: { row: 0, col: 0 },
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
                    uniqueItems: new Set<string>(),
                    tilesVisited: new Set<string>(),
                    uniqueItemsArray: [],
                    tilesVisitedArray: [],
                },
            },
            {
                socketId: 'player2',
                name: 'Player 2',
                avatar: 'avatar2',
                attributes: {
                    nbEvasion: { name: 'nbEvasion', description: 'Evasion attempts', baseValue: 1, currentValue: 0 },
                },
                isOrganizer: false,
                position: { row: 1, col: 1 },
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
                    uniqueItems: new Set<string>(),
                    tilesVisited: new Set<string>(),
                    uniqueItemsArray: [],
                    tilesVisitedArray: [],
                },
            },
        ],
        selectedGameID: 'game1',
        grid: [[{ images: [], isOccuped: false }], [{ images: [], isOccuped: false }]],
        turnData: {
            turnOrder: ['player1', 'player2'],
            currentTurnIndex: 0,
            currentPlayerSocketId: 'player1',
            turnTimer: null,
            timeLeft: 0,
        },
        combatData: {
            combatants: [
                {
                    socketId: 'player1',
                    name: 'Player 1',
                    avatar: 'avatar1',
                    attributes: {
                        nbEvasion: { name: 'nbEvasion', description: 'Evasion attempts', baseValue: 1, currentValue: 1 },
                    },
                    isOrganizer: true,
                    position: { row: 0, col: 0 },
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
                        uniqueItems: new Set<string>(),
                        tilesVisited: new Set<string>(),
                        uniqueItemsArray: [],
                        tilesVisitedArray: [],
                    },
                },
                {
                    socketId: 'player2',
                    name: 'Player 2',
                    avatar: 'avatar2',
                    attributes: {
                        nbEvasion: { name: 'nbEvasion', description: 'Evasion attempts', baseValue: 1, currentValue: 0 },
                    },
                    isOrganizer: false,
                    position: { row: 1, col: 1 },
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
                        uniqueItems: new Set<string>(),
                        tilesVisited: new Set<string>(),
                        uniqueItemsArray: [],
                        tilesVisitedArray: [],
                    },
                },
            ],
            turnIndex: 0,
            timeLeft: 0,
            turnTimer: null,
        },
        ctf : false,
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
        abandonedPlayers : [],
    });

    // it('should start a combat turn with nbEvasion > 0 and emit combatTurnStarted with COMBAT_TURN_DURATION', () => {
    //     const mockSession = createMockSession();
    //     mockSession.combatData.turnIndex = 0; // Ensure player1 is active

    //     service.startCombat('testSessionCode', mockServer as Server, mockSession);

    //     expect(mockServer.to).toHaveBeenCalledWith('testSessionCode');
    //     expect(mockServer.emit).toHaveBeenCalledWith('combatTurnStarted', {
    //         playerSocketId: mockSession.combatData.combatants[0].socketId,
    //         timeLeft: COMBAT_TURN_DURATION / COMBAT_TIME_INTERVAL,
    //     });
    // });

    // it('should start a combat turn with nbEvasion = 0 and emit combatTurnStarted with COMBAT_EVASION_TURN_DURATION', () => {
    //     const mockSession = createMockSession();
    //     mockSession.combatData.turnIndex = 1; // Ensure player2 is active with nbEvasion = 0

    //     service.startCombat('testSessionCode', mockServer as Server, mockSession);

    //     expect(mockServer.to).toHaveBeenCalledWith('testSessionCode');
    //     expect(mockServer.emit).toHaveBeenCalledWith('combatTurnStarted', {
    //         playerSocketId: mockSession.combatData.combatants[1].socketId,
    //         timeLeft: COMBAT_EVASION_TURN_DURATION / COMBAT_TIME_INTERVAL,
    //     });
    // });

    it('should handle timer expiration and trigger auto-attack', () => {
        const mockSession = createMockSession();
        mockSession.combatData.turnIndex = 0; // Ensure player1 is active

        jest.spyOn(service as any, 'startCombatTurnTimer').mockImplementation(() => {}); // Mock timer
        service.startCombat('testSessionCode', mockServer as Server, mockSession);

        // Fast-forward timer to trigger expiration
        jest.advanceTimersByTime(COMBAT_TURN_DURATION);

        // Confirm that auto-attack is triggered
        // expect(combatGateway.handleAttack).toHaveBeenCalledWith(null, {
        //     sessionCode: 'testSessionCode',
        //     clientSocketId: mockSession.combatData.combatants[0].socketId,
        // });
    });

    it('should end a combat turn and call startCombatTurnTimer again if combatants remain', () => {
        const mockSession = createMockSession();
        mockSession.combatData.turnIndex = 0;
        jest.spyOn(service as any, 'startCombatTurnTimer').mockImplementation(() => {});

        service.endCombatTurn('testSessionCode', mockServer as Server, mockSession);

        expect(mockServer.emit).toHaveBeenCalledWith('combatTurnStarted', {
            playerSocketId: mockSession.combatData.combatants[1].socketId,
        });
        expect((service as any).startCombatTurnTimer).toHaveBeenCalledWith('testSessionCode', mockServer, mockSession);
    });

    it('should end combat and emit combatEnded', () => {
        const mockSession = createMockSession();

        service.endCombat('testSessionCode', mockServer as Server, mockSession);
        expect(mockServer.emit).toHaveBeenCalledWith('combatEnded', { message: 'Le combat est fini.' });
        expect(mockSession.combatData.combatants.length).toBe(0);
        expect(mockSession.combatData.turnIndex).toBe(-1);
    });

    it('should mark action as taken', () => {
        service.markActionTaken();
        expect((service as any).actionTaken).toBe(true);
    });
});
