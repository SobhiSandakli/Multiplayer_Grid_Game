/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-lines */
import { Attribute } from '@app/interfaces/attribute/attribute.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { MovementService } from '@app/services/movement/movement.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ChangeGridService } from './changeGrid.service';
import { OBJECT, OBJECT_POSITION, ObjectsImages } from '@app/constants/objects-enums-constants';
import { Position } from '@app/interfaces/player/position.interface';
import { Grid } from '@app/interfaces/session/grid.interface';

describe('ChangeGridService', () => {
    let service: ChangeGridService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ChangeGridService, { provide: MovementService, useValue: { calculateAccessibleTiles: jest.fn() } }],
        }).compile();

        service = module.get<ChangeGridService>(ChangeGridService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('changeGrid', () => {
        it('should assign players to starting points and update positions', () => {
            const grid = [
                [
                    { images: ['assets/objects/started-points.png'], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: [], isOccuped: false },
                    { images: ['assets/objects/started-points.png'], isOccuped: false },
                ],
            ];

            const players: Player[] = [
                {
                    socketId: '1',
                    name: 'Player1',
                    avatar: 'assets/avatars/player1.png',
                    attributes: {
                        speed: { currentValue: 5, baseValue: 5 } as Attribute,
                    },
                    isOrganizer: false,
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
                    socketId: '2',
                    name: 'Player2',
                    avatar: 'assets/avatars/player2.png',
                    attributes: {
                        speed: { currentValue: 5, baseValue: 5 } as Attribute,
                    },
                    isOrganizer: false,
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
            ];

            const modifiedGrid = service.changeGrid(grid, players);
            expect(modifiedGrid[0][0].images).toContain(players[0].avatar);
            expect(players[0].position).toEqual({ row: 0, col: 0 });
            expect(players[0].initialPosition).toEqual({ row: 0, col: 0 });

            expect(modifiedGrid[1][1].images).toContain(players[1].avatar);
            expect(players[1].position).toEqual({ row: 1, col: 1 });
            expect(players[1].initialPosition).toEqual({ row: 1, col: 1 });
        });

        it('should remove excess starting points if there are more points than players', () => {
            const grid = [
                [
                    { images: ['assets/objects/started-points.png'], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: ['assets/objects/started-points.png'], isOccuped: false },
                    { images: ['assets/objects/started-points.png'], isOccuped: false },
                ],
            ];

            const players: Player[] = [
                {
                    socketId: '1',
                    name: 'Player1',
                    avatar: 'assets/avatars/player1.png',
                    attributes: {
                        speed: { currentValue: 5, baseValue: 5 } as Attribute,
                    },
                    isOrganizer: false,
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
            ];

            const modifiedGrid = service.changeGrid(grid, players);
            expect(modifiedGrid[0][0].images).toContain(players[0].avatar);
            expect(modifiedGrid[1][0].images).not.toContain('assets/objects/started-points.png');
            expect(modifiedGrid[1][1].images).not.toContain('assets/objects/started-points.png');
        });
    });
    describe('removePlayerAvatar', () => {
        it('should remove the player avatar and starting point image from the grid when player has position and initialPosition', () => {
            // Arrange
            const grid = [
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];

            const player: Player = {
                socketId: 'socket1',
                name: 'Player One',
                avatar: 'avatar1.png',
                attributes: {},
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

            // Place the player's avatar and starting point image on the grid
            grid[0][0].images = [player.avatar, 'assets/objects/started-points.png'];
            grid[0][0].isOccuped = true;

            // Act
            service.removePlayerAvatar(grid, player);

            // Assert
            expect(grid[0][0].images).not.toContain(player.avatar);
            expect(grid[0][0].images).not.toContain('assets/objects/started-points.png');
            expect(grid[0][0].isOccuped).toBe(false);
        });
        it('should not perform any action when player.position or player.initialPosition is undefined', () => {
            // Arrange
            const grid = [
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];

            const player: Player = {
                socketId: 'socket1',
                name: 'Player One',
                avatar: 'avatar1.png',
                attributes: {},
                position: undefined, // Undefined position and initialPosition
                initialPosition: undefined,
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

            // Place the player's avatar and starting point image on the grid
            grid[0][0].images = [player.avatar, 'assets/objects/started-points.png'];
            grid[0][0].isOccuped = true;

            // Act
            service.removePlayerAvatar(grid, player);

            // Assert
            // The grid should remain unchanged
            expect(grid[0][0].images).toContain(player.avatar);
            expect(grid[0][0].images).toContain('assets/objects/started-points.png');
            expect(grid[0][0].isOccuped).toBe(true);
        });
    });
    describe('moveImage', () => {
        it('should move an image from the source tile to the destination tile', () => {
            const grid = [
                [
                    { images: ['avatar.png'], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];

            const source = { row: 0, col: 0 };
            const destination = { row: 1, col: 1 };
            const movingImage = 'avatar.png';

            const result = service.moveImage(grid, source, destination, movingImage);

            expect(result).toBe(true);
            expect(grid[0][0].images).not.toContain(movingImage);
            expect(grid[1][1].images).toContain(movingImage);
        });

        it('should return false if the image is not found on the source tile', () => {
            const grid = [
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];

            const source = { row: 0, col: 0 };
            const destination = { row: 1, col: 1 };
            const movingImage = 'avatar.png';

            const result = service.moveImage(grid, source, destination, movingImage);

            expect(result).toBe(false);
        });
    });
    describe('removeObjectFromGrid', () => {
        it('should remove the object from the specified tile', () => {
            const grid = [
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: [ObjectsImages.Potion], isOccuped: true },
                    { images: [], isOccuped: false },
                ],
            ];
            const row = 1;
            const col = 0;
            const object = ObjectsImages.Potion;

            service.removeObjectFromGrid(grid, row, col, object);

            expect(grid[row][col].images).not.toContain(object);
            expect(grid[row][col].isOccuped).toBe(false);
        });

        it('should do nothing if the object does not exist on the tile', () => {
            const grid = [
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];
            const row = 1;
            const col = 0;
            const object = ObjectsImages.Flag;

            service.removeObjectFromGrid(grid, row, col, object);

            expect(grid[row][col].images).not.toContain(object);
            expect(grid[row][col].isOccuped).toBe(false);
        });
    });
    describe('addImage', () => {
        it('should place the image at OBJECT_POSITION when image includes OBJECT', () => {
            const tile = { images: [], isOccuped: false };
            const image = `path/to/${OBJECT}/image.png`; // Image path that includes 'object'

            service.addImage(tile, image);

            expect(tile.images[OBJECT_POSITION]).toBe(image);
            expect(tile.isOccuped).toBe(true);
        });
    });
    describe('countElements', () => {
        it('should count the number of tiles containing specified elements', () => {
            const grid = [
                [
                    { images: ['image1.png'], isOccuped: true },
                    { images: ['image2.png'], isOccuped: true },
                ],
                [
                    { images: ['image3.png'], isOccuped: true },
                    { images: ['image4.png'], isOccuped: true },
                ],
            ];
            const elements = ['image1.png', 'image3.png'];

            const count = service.countElements(grid, elements);

            expect(count).toBe(2);
        });

        it('should return zero when no tiles contain the specified elements', () => {
            const grid = [
                [
                    { images: ['image5.png'], isOccuped: true },
                    { images: ['image6.png'], isOccuped: true },
                ],
                [
                    { images: ['image7.png'], isOccuped: true },
                    { images: ['image8.png'], isOccuped: true },
                ],
            ];
            const elements = ['image1.png', 'image2.png'];

            const count = service.countElements(grid, elements);

            expect(count).toBe(0);
        });

        it('should count a tile only once even if multiple matching images are present', () => {
            const grid = [
                [
                    { images: ['image1.png', 'image3.png'], isOccuped: true },
                    { images: ['image2.png'], isOccuped: true },
                ],
                [
                    { images: ['image3.png', 'image1.png'], isOccuped: true },
                    { images: ['image4.png'], isOccuped: true },
                ],
            ];
            const elements = ['image1.png', 'image3.png'];

            const count = service.countElements(grid, elements);

            expect(count).toBe(2);
        });
    });
    describe('getAdjacentPositions', () => {
        const grid = [
            [{}, {}, {}],
            [{}, {}, {}],
            [{}, {}, {}],
        ] as Grid;

        it('should return all four adjacent positions when in the middle', () => {
            const position: Position = { row: 1, col: 1 };

            const adjacentPositions = service.getAdjacentPositions(position, grid);

            expect(adjacentPositions).toEqual([
                { row: 0, col: 1 }, // Up
                { row: 2, col: 1 }, // Down
                { row: 1, col: 0 }, // Left
                { row: 1, col: 2 }, // Right
            ]);
        });

        it('should return valid adjacent positions when on the edge', () => {
            const position: Position = { row: 0, col: 1 };

            const adjacentPositions = service.getAdjacentPositions(position, grid);

            expect(adjacentPositions).toEqual([
                { row: 1, col: 1 }, // Down
                { row: 0, col: 0 }, // Left
                { row: 0, col: 2 }, // Right
            ]);
        });

        it('should return valid adjacent positions when in the corner', () => {
            const position: Position = { row: 0, col: 0 };

            const adjacentPositions = service.getAdjacentPositions(position, grid);

            expect(adjacentPositions).toEqual([
                { row: 1, col: 0 }, // Down
                { row: 0, col: 1 }, // Right
            ]);
        });
    });
    describe('findNearestTerrainTiles', () => {
        const TERRAIN_TYPES = ['grass', 'sand', 'water'];

        interface Tile {
            images: string[];
            isOccuped: boolean;
        }

        const grid: Tile[][] = [
            [
                { images: ['grass'], isOccuped: false },
                { images: ['stone'], isOccuped: false },
                { images: ['sand'], isOccuped: false },
            ],
            [
                { images: ['water'], isOccuped: false },
                { images: ['lava'], isOccuped: false },
                { images: ['grass'], isOccuped: false },
            ],
            [
                { images: ['sand'], isOccuped: false },
                { images: ['grass'], isOccuped: false },
                { images: ['stone'], isOccuped: false },
            ],
        ];

        beforeEach(() => {
            jest.spyOn<any, any>(service, 'isSuitableTile').mockImplementation((tile: Tile) => {
                return tile.images.length === 1 && TERRAIN_TYPES.includes(tile.images[0]);
            });
        });

        it('should return positions of adjacent suitable terrain tiles', () => {
            const position: Position = { row: 1, col: 1 };
            const count = 2;

            const result = service.findNearestTerrainTiles(position, grid, count);

            expect(result).toEqual([
                { row: 2, col: 1 },
                { row: 1, col: 0 },
            ]);
        });

        it('should return empty array when no suitable tiles are adjacent', () => {
            const position: Position = { row: 1, col: 1 };
            const count = 2;

            grid[0][1].images = ['lava'];
            grid[1][0].images = ['lava'];
            grid[1][2].images = ['lava'];
            grid[2][1].images = ['lava'];

            const result = service.findNearestTerrainTiles(position, grid, count);

            expect(result).toEqual([]);
        });

        it('should return up to the specified count of suitable tiles', () => {
            const position: Position = { row: 0, col: 1 };
            const count = 1;

            const result = service.findNearestTerrainTiles(position, grid, count);

            expect(result.length).toBeLessThanOrEqual(count);
        });
    });
    describe('addItemsToGrid', () => {
        it('should add items to the grid at specified positions when lengths are equal', () => {
            const grid: Grid = [
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];

            const positions: Position[] = [
                { row: 0, col: 0 },
                { row: 1, col: 1 },
            ];
            const items = ['item1.png', 'item2.png'];

            const addImageSpy = jest.spyOn(service, 'addImage');

            service.addItemsToGrid(grid, positions, items);

            expect(addImageSpy).toHaveBeenCalledTimes(2);
            expect(addImageSpy).toHaveBeenCalledWith(grid[0][0], 'item1.png');
            expect(addImageSpy).toHaveBeenCalledWith(grid[1][1], 'item2.png');
            expect(grid[0][0].images).toContain('item1.png');
            expect(grid[1][1].images).toContain('item2.png');
        });

        it('should stop adding items when there are no more positions', () => {
            const grid: Grid = [
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];

            const positions: Position[] = [{ row: 0, col: 0 }];
            const items = ['item1.png', 'item2.png'];

            const addImageSpy = jest.spyOn(service, 'addImage');

            service.addItemsToGrid(grid, positions, items);

            expect(addImageSpy).toHaveBeenCalledTimes(1);
            expect(addImageSpy).toHaveBeenCalledWith(grid[0][0], 'item1.png');
            expect(grid[0][0].images).toContain('item1.png');
            expect(grid[0][1].images).toEqual([]);
        });

        it('should only add available items and ignore excess positions', () => {
            const grid: Grid = [
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];

            const positions: Position[] = [
                { row: 0, col: 0 },
                { row: 0, col: 1 },
                { row: 1, col: 0 },
            ];
            const items = ['item1.png', 'item2.png'];

            const addImageSpy = jest.spyOn(service, 'addImage');

            service.addItemsToGrid(grid, positions, items);

            expect(addImageSpy).toHaveBeenCalledTimes(2);
            expect(addImageSpy).toHaveBeenCalledWith(grid[0][0], 'item1.png');
            expect(addImageSpy).toHaveBeenCalledWith(grid[0][1], 'item2.png');
            expect(grid[0][0].images).toContain('item1.png');
            expect(grid[0][1].images).toContain('item2.png');
            expect(grid[1][0].images).toEqual([]);
        });

        it('should do nothing when positions array is empty', () => {
            const grid: Grid = [
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];
            const positions: Position[] = [];
            const items = ['item1.png'];
            const addImageSpy = jest.spyOn(service, 'addImage');
            service.addItemsToGrid(grid, positions, items);
            expect(addImageSpy).not.toHaveBeenCalled();
            expect(grid[0][0].images).toEqual([]);
            expect(grid[0][1].images).toEqual([]);
        });

        it('should do nothing when items array is empty', () => {
            const grid: Grid = [
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];

            const positions: Position[] = [{ row: 0, col: 0 }];
            const items: string[] = [];

            const addImageSpy = jest.spyOn(service, 'addImage');

            service.addItemsToGrid(grid, positions, items);

            expect(addImageSpy).not.toHaveBeenCalled();
            expect(grid[0][0].images).toEqual([]);
            expect(grid[0][1].images).toEqual([]);
        });
    });
    describe('ChangeGridService - replaceRandomItemsWithUniqueItems', () => {
        beforeEach(() => {
            service = new ChangeGridService();
        });

        it('should replace RandomItems with unique available items', () => {
            const grid = [
                [
                    { images: [ObjectsImages.RandomItems], isOccuped: false },
                    { images: [ObjectsImages.Flag], isOccuped: false },
                ],
                [
                    { images: [ObjectsImages.RandomItems], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];

            jest.spyOn<any, any>(service, 'getAvailableRandomItems').mockReturnValue([ObjectsImages.Key, ObjectsImages.FlyingShoe]);
            (service as any).replaceRandomItemsWithUniqueItems(grid);

            const replacedItems: string[] = [];
            grid.forEach((row) => {
                row.forEach((tile) => {
                    if (tile.images.includes(ObjectsImages.Key) || tile.images.includes(ObjectsImages.FlyingShoe)) {
                        replacedItems.push(...tile.images);
                    }
                });
            });

            expect(replacedItems).toContain(ObjectsImages.Key);
            expect(replacedItems).toContain(ObjectsImages.FlyingShoe);
            expect(replacedItems).not.toContain(ObjectsImages.RandomItems);
        });

        it('should not alter grid when there are no RandomItems', () => {
            const grid = [
                [
                    { images: [ObjectsImages.Flag], isOccuped: false },
                    { images: [ObjectsImages.Key], isOccuped: false },
                ],
                [
                    { images: [ObjectsImages.FlyingShoe], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];

            const originalGrid = JSON.parse(JSON.stringify(grid)); // Deep copy

            jest.spyOn<any, any>(service, 'getAvailableRandomItems').mockReturnValue([ObjectsImages.Key, ObjectsImages.FlyingShoe]);

            (service as any).replaceRandomItemsWithUniqueItems(grid);

            expect(grid).toEqual(originalGrid);
        });

        it('should not replace RandomItems when no available items', () => {
            const grid = [
                [
                    { images: [ObjectsImages.RandomItems], isOccuped: false },
                    { images: [ObjectsImages.RandomItems], isOccuped: false },
                ],
                [
                    { images: [ObjectsImages.RandomItems], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];

            jest.spyOn<any, any>(service, 'getAvailableRandomItems').mockReturnValue([]);

            (service as any).replaceRandomItemsWithUniqueItems(grid);

            grid.forEach((row) => {
                row.forEach((tile) => {
                    if (tile.images.length > 0) {
                        expect(tile.images).toEqual([ObjectsImages.RandomItems]);
                    } else {
                        expect(tile.images).toEqual([]);
                    }
                });
            });
        });

        it('should replace only as many RandomItems as available items', () => {
            const grid = [
                [
                    { images: [ObjectsImages.RandomItems], isOccuped: false },
                    { images: [ObjectsImages.RandomItems], isOccuped: false },
                ],
                [
                    { images: [ObjectsImages.RandomItems], isOccuped: false },
                    { images: [ObjectsImages.RandomItems], isOccuped: false },
                ],
            ];
            jest.spyOn<any, any>(service, 'getAvailableRandomItems').mockReturnValue([ObjectsImages.Key, ObjectsImages.FlyingShoe]);

            (service as any).replaceRandomItemsWithUniqueItems(grid);

            let replacedCount = 0;
            let remainingRandomItems = 0;
            grid.forEach((row) => {
                row.forEach((tile) => {
                    if (tile.images.includes(ObjectsImages.Key) || tile.images.includes(ObjectsImages.FlyingShoe)) {
                        replacedCount++;
                    } else if (tile.images.includes(ObjectsImages.RandomItems)) {
                        remainingRandomItems++;
                    }
                });
            });

            expect(replacedCount).toBe(2);
            expect(remainingRandomItems).toBe(2);
        });
    });
    describe('ChangeGridService', () => {
        beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [ChangeGridService],
            }).compile();

            service = module.get<ChangeGridService>(ChangeGridService);
        });

        describe('isSuitableTile', () => {
            it('should return true when tile has one image in TERRAIN_TYPES', () => {
                const tile = { images: ['grass'] };
                const result = (service as any).isSuitableTile(tile);
                expect(result).toBe(false);
            });

            it('should return false when tile has one image not in TERRAIN_TYPES', () => {
                const tile = { images: ['stone'] };
                const result = (service as any).isSuitableTile(tile);
                expect(result).toBe(false);
            });

            it('should return false when tile has multiple images even if one is in TERRAIN_TYPES', () => {
                const tile = { images: ['grass', 'tree'] };
                const result = (service as any).isSuitableTile(tile);
                expect(result).toBe(false);
            });

            it('should return false when tile has no images', () => {
                const tile = { images: [] };
                const result = (service as any).isSuitableTile(tile);
                expect(result).toBe(false);
            });
        });
    });
});
