/* eslint-disable */

import { Test, TestingModule } from '@nestjs/testing';
import { MovementService } from './movement.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { Player } from '@app/interfaces/player/player.interface';
import { Server, Socket } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import { EVASION_DELAY } from '@app/constants/session-gateway-constants';
import { MovementContext } from '@app/interfaces/player/movement.interface';
import { EventsGateway } from '@app/gateways/events/events.gateway';

const mockPlayer: Player = {
    socketId: 'socket1',
    name: 'Player One',
    avatar: 'avatar1.png',
    attributes: {
        life: { name: 'Life', description: 'Player life points', currentValue: 3, baseValue: 3 },
        combatWon: { name: 'Combat Won', description: 'Number of combats won', currentValue: 0, baseValue: 0 },
        speed: { name: 'Speed', description: 'Player speed', currentValue: 5, baseValue: 5 },
        attack: { name: 'Attack', description: 'Player attack', currentValue: 5, baseValue: 5 },
        defence: { name: 'Defence', description: 'Player defence', currentValue: 5, baseValue: 5 },
    },
    position: { row: 0, col: 0 },
    initialPosition: { row: 0, col: 0 },
    isOrganizer: false,
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
};

const mockSession: Session = {
    players: [mockPlayer],
    grid: [[{ images: ['assets/tiles/Grass.png'], isOccuped: false }], [{ images: ['assets/tiles/Grass.png'], isOccuped: false }]],
    combatData: {
        combatants: [],
        turnIndex: 0,
        turnTimer: null,
        timeLeft: 0,
    },
    organizerId: '',
    locked: false,
    maxPlayers: 0,
    selectedGameID: '',
    turnData: undefined,
    ctf: false,
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

describe('MovementService', () => {
    let service: MovementService;
    let changeGridService: ChangeGridService;
    let sessionsService: SessionsService;
    let mockServer: Server;
    let mockClient: Socket;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MovementService,
                {
                    provide: ChangeGridService,
                    useValue: {
                        isInBounds: jest.fn((position, grid) => {
                            return position.row >= 0 && position.col >= 0 && position.row < grid.length && position.col < grid[0].length;
                        }),
                        moveImage: jest.fn().mockReturnValue(true),
                    },
                },
                {
                    provide: SessionsService,
                    useValue: {
                        getSession: jest.fn().mockReturnValue(mockSession),
                        endTurn: jest.fn(),
                    },
                },
                {
                    provide: EventsGateway,
                    useValue: {
                        addEventToSession: jest.fn(),
                        emitNewEvent: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<MovementService>(MovementService);
        changeGridService = module.get<ChangeGridService>(ChangeGridService);
        sessionsService = module.get<SessionsService>(SessionsService);

        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as unknown as Server;

        mockClient = {
            emit: jest.fn(),
        } as unknown as Socket;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('calculateAccessibleTiles', () => {
        it('should calculate accessible tiles for a player', () => {
            const grid = [
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
            ];

            service.calculateAccessibleTiles(grid, mockPlayer, mockPlayer.attributes.speed.currentValue);

            expect(mockPlayer.accessibleTiles.length).toBeGreaterThan(0);
            expect(mockPlayer.accessibleTiles[0].position).toEqual({ row: 0, col: 0 });
        });

        it('should not calculate inaccessible tiles', () => {
            const grid = [
                [{ images: ['assets/tiles/Wall.png'], isOccuped: true }],
                [{ images: ['assets/tiles/Wall.png'], isOccuped: true }],
            ];

            service.calculateAccessibleTiles(grid, mockPlayer, mockPlayer.attributes.speed.currentValue);

            expect(mockPlayer.accessibleTiles.length).toBe(1);
        });
    });

    describe('calculateMovementCost', () => {
        it('should calculate the movement cost between two positions', () => {
            const grid = [
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
            ];
            service.calculateAccessibleTiles(grid, mockPlayer, 5);
            const cost = service.calculateMovementCost({ row: 0, col: 0 }, { row: 1, col: 0 }, mockPlayer, grid);

            expect(cost).toBe(1); // Grass tile cost
        });

        it('should return undefined for inaccessible positions', () => {
            const grid = [
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Wall.png'], isOccuped: true }],
            ];

            service.calculateAccessibleTiles(grid, mockPlayer, 5);
            const cost = service.calculateMovementCost({ row: 0, col: 0 }, { row: 1, col: 0 }, mockPlayer, grid);

            expect(cost).toBeUndefined();
        });
    });

    describe('processTile', () => {
        it('should process tiles and add accessible ones to the context', () => {
            const grid = [
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
            ];
            const context = service['initializeTileContext'](grid, mockPlayer);
            service['processTile']({ row: 0, col: 0 }, 0, 5, context, grid);

            expect(context.accessibleTiles.length).toBeGreaterThan(0);
        });
    });

    describe('getTileType', () => {
        it('should correctly identify tile types', () => {
            const grassTile = service.getTileType(['assets/tiles/Grass.png']);
            const wallTile = service.getTileType(['assets/tiles/Wall.png']);

            expect(grassTile).toBe('base');
            expect(wallTile).toBe('wall');
        });
    });
});
