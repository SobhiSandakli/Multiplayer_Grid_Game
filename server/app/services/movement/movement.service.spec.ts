/* eslint-disable */

import { ObjectsImages } from '@app/constants/objects-enums-constants';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { Player } from '@app/interfaces/player/player.interface';
import { Session } from '@app/interfaces/session/session.interface';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { ItemService } from '../item/item.service';
import { MovementService } from './movement.service';


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
        startTime : new Date(),
        endTime : new Date(),
    },
    abandonedPlayers : [],
    isDebugMode: false,
};

describe('MovementService', () => {
    let service: MovementService;
    let changeGridService: ChangeGridService;
    let sessionsService: SessionsService;
    let itemService: ItemService;
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
                        terminateSession: jest.fn(),
                    },
                },
                {
                    provide: EventsGateway,
                    useValue: {
                        addEventToSession: jest.fn(),
                        emitNewEvent: jest.fn(),
                    },
                },
                {
                    provide: ItemService,
                    useValue: {
                        handleItemPickup: jest.fn(),
                        handleItemDiscard: jest.fn(),
                        updatePlayerTileEffect: jest.fn(),
                        checkForItemsAlongPath: jest.fn().mockReturnValue({ adjustedPath: [], itemFound: false }),
                    },
                },
            ],
        }).compile();

        service = module.get<MovementService>(MovementService);
        changeGridService = module.get<ChangeGridService>(ChangeGridService);
        sessionsService = module.get<SessionsService>(SessionsService);
        itemService = module.get<ItemService>(ItemService);

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

            expect(cost).toBe(1); 
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
            const context = (service as any).initializeTileContext(grid, mockPlayer);
            (service as any).processTile({ row: 0, col: 0 }, 0, 5, context, grid);

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

    describe('processPlayerMovement', () => {
        it('should process player movement and handle item pickup when item is found', () => {
            const data = {
                sessionCode: 'session1',
                source: { row: 0, col: 0 },
                destination: { row: 1, col: 0 },
                movingImage: 'assets/avatars/avatar1.png',
            };
            const server = mockServer;
            const client = mockClient;

            const player = { ...mockPlayer };
            const session = { ...mockSession, grid: [
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
            ]};

            sessionsService.getSession = jest.fn().mockReturnValue(session);

            itemService.checkForItemsAlongPath = jest.fn().mockReturnValue({
                adjustedPath: [{ row: 0, col: 0 }, { row: 1, col: 0 }],
                itemFound: true,
            });
            itemService.handleItemPickup = jest.fn();
            itemService.updatePlayerTileEffect = jest.fn();

            service.calculateAccessibleTiles(session.grid, player, player.attributes.speed.currentValue);

            service.processPlayerMovement(client, player, session, data, server);

            expect(itemService.handleItemPickup).toHaveBeenCalled();
            expect(itemService.updatePlayerTileEffect).toHaveBeenCalled();
            expect(player.position).toEqual({ row: 1, col: 0 });
        });

        it('should process player movement without item pickup when no item is found', () => {
            const data = {
                sessionCode: 'session1',
                source: { row: 0, col: 0 },
                destination: { row: 1, col: 0 },
                movingImage: 'assets/avatars/avatar1.png',
            };
            const server = mockServer;
            const client = mockClient;

            const player = { ...mockPlayer };
            const session = { ...mockSession, grid: [
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
            ]};

            sessionsService.getSession = jest.fn().mockReturnValue(session);

            itemService.checkForItemsAlongPath = jest.fn().mockReturnValue({
                adjustedPath: [{ row: 0, col: 0 }, { row: 1, col: 0 }],
                itemFound: false,
            });
            itemService.handleItemPickup = jest.fn();
            itemService.updatePlayerTileEffect = jest.fn();

            service.calculateAccessibleTiles(session.grid, player, player.attributes.speed.currentValue);

            service.processPlayerMovement(client, player, session, data, server);

            expect(itemService.handleItemPickup).not.toHaveBeenCalled();
            expect(itemService.updatePlayerTileEffect).toHaveBeenCalled();
            expect(player.position).toEqual({ row: 1, col: 0 });
        });

        it('should process player movement and handle slipping on ice tiles', () => {
            const data = {
                sessionCode: 'session1',
                source: { row: 0, col: 0 },
                destination: { row: 2, col: 0 },
                movingImage: 'assets/avatars/avatar1.png',
            };
            const server = mockServer;
            const client = mockClient;

            const player = { ...mockPlayer };
            player.attributes.speed.currentValue = 5;

            const session = { ...mockSession, grid: [
                [{ images: ['assets/tiles/Ice.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Ice.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Ice.png'], isOccuped: false }],
            ]};

            sessionsService.getSession = jest.fn().mockReturnValue(session);

            itemService.checkForItemsAlongPath = jest.fn().mockReturnValue({
                adjustedPath: [{ row: 0, col: 0 }, { row: 1, col: 0 }],
                itemFound: false,
            });
            itemService.handleItemPickup = jest.fn();
            itemService.updatePlayerTileEffect = jest.fn();

            jest.spyOn(Math, 'random').mockReturnValueOnce(1).mockReturnValueOnce(0.1);

            service.calculateAccessibleTiles(session.grid, player, player.attributes.speed.currentValue);

            service.processPlayerMovement(client, player, session, data, server);

            expect(player.position).toEqual({ row: 1, col: 0 }); 
            expect(itemService.updatePlayerTileEffect).toHaveBeenCalled();
            expect(server.to).toHaveBeenCalledWith('session1');

            jest.spyOn(Math, 'random').mockRestore();
        });

        it('should not slip on ice tiles when player has FlyingShoe', () => {
            const data = {
                sessionCode: 'session1',
                source: { row: 0, col: 0 },
                destination: { row: 2, col: 0 },
                movingImage: 'assets/avatars/avatar1.png',
            };
            const server = mockServer;
            const client = mockClient;

            const player = { ...mockPlayer };
            player.attributes.speed.currentValue = 5;
            player.inventory = [ObjectsImages.FlyingShoe];

            const session = { ...mockSession, grid: [
                [{ images: ['assets/tiles/Ice.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Ice.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Ice.png'], isOccuped: false }],
            ]};

            sessionsService.getSession = jest.fn().mockReturnValue(session);

            itemService.checkForItemsAlongPath = jest.fn().mockReturnValue({
                adjustedPath: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
                itemFound: false,
            });
            itemService.handleItemPickup = jest.fn();
            itemService.updatePlayerTileEffect = jest.fn();

            jest.spyOn(Math, 'random').mockReturnValue(0.1);

            service.calculateAccessibleTiles(session.grid, player, player.attributes.speed.currentValue);

            service.processPlayerMovement(client, player, session, data, server);

            expect(player.position).toEqual({ row: 2, col: 0 }); 
            expect(itemService.updatePlayerTileEffect).toHaveBeenCalled();
            expect(server.to).toHaveBeenCalledWith('session1');

            jest.spyOn(Math, 'random').mockRestore();
        });

        it('should not move if player does not have enough speed', () => {
            const data = {
                sessionCode: 'session1',
                source: { row: 0, col: 0 },
                destination: { row: 2, col: 0 },
                movingImage: 'assets/avatars/avatar1.png',
            };
            const server = mockServer;
            const client = mockClient;

            const player = { ...mockPlayer };
            player.attributes.speed.currentValue = 1; 

            const session = { ...mockSession, grid: [
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
            ]};

            sessionsService.getSession = jest.fn().mockReturnValue(session);

            itemService.checkForItemsAlongPath = jest.fn().mockReturnValue({
                adjustedPath: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
                itemFound: false,
            });
            itemService.handleItemPickup = jest.fn();
            itemService.updatePlayerTileEffect = jest.fn();

            service.calculateAccessibleTiles(session.grid, player, player.attributes.speed.currentValue);

            service.processPlayerMovement(client, player, session, data, server);

            expect(player.position).toEqual({ row: 0, col: 0 }); 
            expect(itemService.updatePlayerTileEffect).not.toHaveBeenCalled();
            expect(server.to).not.toHaveBeenCalledWith('session1');
        });
    });
    describe('getMovementCost', () => {
        it('should return correct movement cost for different tile types', () => {
            const iceTile = { images: ['assets/tiles/Ice.png']};
            const grassTile = { images: ['assets/tiles/Grass.png']};
            const doorOpenTile = { images: ['assets/tiles/Door-Open.png'] };
            const waterTile = { images: ['assets/tiles/Water.png']};
            const wallTile = { images: ['assets/tiles/Wall.png'] };
            
    
            expect(service.getMovementCost(iceTile)).toBe(0);
            expect(service.getMovementCost(grassTile)).toBe(1);
            expect(service.getMovementCost(doorOpenTile)).toBe(1);
            expect(service.getMovementCost(waterTile)).toBe(2);
            expect(service.getMovementCost(wallTile)).toBe(Infinity);
            
        });
    });
    
    describe('getTileEffect', () => {
        it('should return correct tile effect for different tile types', () => {
            const iceTile = { images: ['assets/tiles/Ice.png'], isOccuped: false };
            const waterTile = { images: ['assets/tiles/Water.png'], isOccuped: false };
            const grassTile = { images: ['assets/tiles/Grass.png'], isOccuped: false };
            const unknownTile = { images: ['unknown.png'], isOccuped: false };
    
            expect(service.getTileEffect(iceTile)).toBe('Glissant');
            expect(service.getTileEffect(waterTile)).toBe('Lent');
            expect(service.getTileEffect(grassTile)).toBe('Normal');
            expect(service.getTileEffect(unknownTile)).toBe('Normal');
        });
    });
    
    describe('handleItemDiscard', () => {
        it('should call itemService.handleItemDiscard', () => {
            const player = { ...mockPlayer };
            service.handleItemDiscard(player, ObjectsImages.FlyingShoe, ObjectsImages.Flag, mockServer, 'session1');
            expect(itemService.handleItemDiscard).toHaveBeenCalledWith(player, ObjectsImages.FlyingShoe, ObjectsImages.Flag, mockServer, 'session1');
        });
    });
    
    describe('handleItemPickup', () => {
        it('should call itemService.handleItemPickup', () => {
            const player = { ...mockPlayer };
            const session = { ...mockSession };
            const position = { row: 1, col: 1 };
            service.handleItemPickup(player, session, position, mockServer, 'session1');
            expect(itemService.handleItemPickup).toHaveBeenCalledWith(player, session, position, mockServer, 'session1');
        });
    });
    
    describe('calculatePathWithSlips', () => {
        it('should return desiredPath when player has FlyingShoe', () => {
            const desiredPath = [{ row: 0, col: 0 }, { row: 1, col: 0 }];
            const grid = [
                [{ images: ['assets/tiles/Ice.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Ice.png'], isOccuped: false }],
            ];
            const player = { ...mockPlayer, inventory: [ObjectsImages.FlyingShoe] };
    
            const result = service.calculatePathWithSlips(desiredPath, grid, player, false);
            expect(result).toEqual({ realPath: desiredPath, slipOccurred: false });
        });
    
        it('should return desiredPath when isDebugMode is true', () => {
            const desiredPath = [{ row: 0, col: 0 }, { row: 1, col: 0 }];
            const grid = [
                [{ images: ['assets/tiles/Ice.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Ice.png'], isOccuped: false }],
            ];
            const player = { ...mockPlayer };
    
            const result = service.calculatePathWithSlips(desiredPath, grid, player, true);
            expect(result).toEqual({ realPath: desiredPath, slipOccurred: false });
        });
    
    
        it('should not simulate slipping when no ice tile', () => {
            const desiredPath = [{ row: 0, col: 0 }, { row: 1, col: 0 }];
            const grid = [
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
            ];
            const player = { ...mockPlayer };
    
            const result = service.calculatePathWithSlips(desiredPath, grid, player, false);
            expect(result).toEqual({ realPath: desiredPath, slipOccurred: false });
        });
    });
    
    describe('getPathToDestination', () => {
        it('should return path to destination if accessible', () => {
            const player = { ...mockPlayer };
            player.accessibleTiles = [
                {
                    position: { row: 1, col: 0 },
                    path: [{ row: 0, col: 0 }, { row: 1, col: 0 }],
                },
            ];
    
            const path = service.getPathToDestination(player, { row: 1, col: 0 });
            expect(path).toEqual([{ row: 0, col: 0 }, { row: 1, col: 0 }]);
        });
    
        it('should return null if destination is not accessible', () => {
            const player = { ...mockPlayer };
            player.accessibleTiles = [];
    
            const path = service.getPathToDestination(player, { row: 1, col: 0 });
            expect(path).toBeNull();
        });
    });
    
    describe('calculateMovementCostFromPath', () => {
        it('should calculate movement cost from path', () => {
            const path = [{ row: 0, col: 0 }, { row: 1, col: 0 }];
            const grid = [
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Water.png'], isOccuped: false }],
            ];
    
            const cost = service.calculateMovementCostFromPath(path, grid);
            expect(cost).toBe(3); 
        });
    });
    
    describe('isDestinationAccessible', () => {
        it('should return true if destination is accessible', () => {
            const player = { ...mockPlayer };
            player.accessibleTiles = [
                {
                    position: { row: 1, col: 0 },
                    path: [{ row: 0, col: 0 }, { row: 1, col: 0 }],
                },
            ];
    
            const accessible = service.isDestinationAccessible(player, { row: 1, col: 0 });
            expect(accessible).toBe(true);
        });
    
        it('should return false if destination is not accessible', () => {
            const player = { ...mockPlayer };
            player.accessibleTiles = [];
    
            const accessible = service.isDestinationAccessible(player, { row: 1, col: 0 });
            expect(accessible).toBe(false);
        });
    });
    
    describe('updatePlayerAttributesOnTile', () => {
        it('should update player attributes on ice tile', () => {
            const player = { ...mockPlayer };
            const tile = { images: ['assets/tiles/Ice.png'], isOccuped: false };
    
            service.updatePlayerAttributesOnTile(player, tile);
    
            expect(player.attributes.attack.currentValue).toBe(player.attributes.attack.baseValue - 2);
            expect(player.attributes.defence.currentValue).toBe(player.attributes.defence.baseValue - 2);
        });
    
        it('should update player attributes on normal tile', () => {
            const player = { ...mockPlayer };
            player.attributes.attack.currentValue = 3;
            player.attributes.defence.currentValue = 3;
            const tile = { images: ['assets/tiles/Grass.png'], isOccuped: false };
    
            service.updatePlayerAttributesOnTile(player, tile);
    
            expect(player.attributes.attack.currentValue).toBe(player.attributes.attack.baseValue);
            expect(player.attributes.defence.currentValue).toBe(player.attributes.defence.baseValue);
        });
    
    });
    
    describe('calculatePathMovementCost', () => {
        it('should calculate total movement cost excluding starting tile', () => {
            const path = [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }];
            const grid = [
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Water.png'], isOccuped: false }],
                [{ images: ['assets/tiles/Ice.png'], isOccuped: false }],
            ];
    
            const cost = service.calculatePathMovementCost(path, grid);
            expect(cost).toBe(2); 
        });
    });
    
    describe('isPositionAccessible', () => {
        it('should return true if position is accessible', () => {
            const position = { row: 0, col: 0 };
            const grid = [
                [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
            ];
    
            const accessible = service.isPositionAccessible(position, grid);
            expect(accessible).toBe(true);
        });
    
        it('should return false if position is wall', () => {
            const position = { row: 0, col: 0 };
            const grid = [
                [{ images: ['assets/tiles/Wall.png'], isOccuped: false }],
            ];
    
            const accessible = service.isPositionAccessible(position, grid);
            expect(accessible).toBe(false);
        });
    
        it('should return false if position has closed door', () => {
            const position = { row: 0, col: 0 };
            const grid = [
                [{ images: ['assets/tiles/Door.png'], isOccuped: false }],
            ];
    
            const accessible = service.isPositionAccessible(position, grid);
            expect(accessible).toBe(false);
        });
    
        it('should return false if position has avatar', () => {
            const position = { row: 0, col: 0 };
            const grid = [
                [{ images: ['assets/avatars/avatar1.png'], isOccuped: false }],
            ];
    
            const accessible = service.isPositionAccessible(position, grid);
            expect(accessible).toBe(false);
        });
    });
    
    
});
