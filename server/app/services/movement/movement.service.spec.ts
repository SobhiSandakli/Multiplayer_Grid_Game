/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Player } from '@app/interfaces/player/player.interface';
import { MovementService } from './movement.service';

describe('MovementService', () => {
    let service: MovementService;

    beforeEach(() => {
        service = new MovementService();
    });

    it('should calculate accessible tiles for a player in an open area', () => {
        const grid = [
            [
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
            ],
            [
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
            ],
        ];

        const player: Player = {
            position: { row: 0, col: 0 },
            accessibleTiles: [],
        } as any;

        const maxMovement = 2;

        service.calculateAccessibleTiles(grid, player, maxMovement);

        expect(player.accessibleTiles.length).toBeGreaterThan(0);
        expect(player.accessibleTiles).toEqual(
            expect.arrayContaining([
                {
                    position: { row: 0, col: 0 },
                    path: [{ row: 0, col: 0 }],
                },
                {
                    position: { row: 0, col: 1 },
                    path: [
                        { row: 0, col: 0 },
                        { row: 0, col: 1 },
                    ],
                },
                {
                    position: { row: 1, col: 0 },
                    path: [
                        { row: 0, col: 0 },
                        { row: 1, col: 0 },
                    ],
                },
                {
                    position: { row: 1, col: 1 },
                    path: [
                        { row: 0, col: 0 },
                        { row: 1, col: 0 },
                        { row: 1, col: 1 },
                    ],
                },
            ]),
        );
    });

    it('should calculate the correct movement cost to a destination', () => {
        const grid = [
            [
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
                { images: ['assets/tiles/Water.png'], isOccuped: false },
            ],
            [
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
            ],
        ];

        const player: Player = {
            position: { row: 0, col: 0 },
            accessibleTiles: [],
        } as any;

        const maxMovement = 5;

        service.calculateAccessibleTiles(grid, player, maxMovement);

        const destination = { row: 0, col: 1 };
        const cost = service.calculateMovementCost(player.position, destination, player, grid);

        expect(cost).toBe(2);
    });

    it('should return the correct path to a destination', () => {
        const grid = [
            [
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
            ],
            [
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
            ],
        ];

        const player: Player = {
            position: { row: 0, col: 0 },
            accessibleTiles: [],
        } as any;

        const maxMovement = 2;

        service.calculateAccessibleTiles(grid, player, maxMovement);

        const destination = { row: 1, col: 1 };
        const path = service.getPathToDestination(player, destination);

        expect(path).toEqual([
            { row: 0, col: 0 },
            { row: 1, col: 0 },
            { row: 1, col: 1 },
        ]);
    });

    it('should return the correct movement cost for different tiles', () => {
        const grassTile = { images: ['assets/tiles/Grass.png'] };
        const waterTile = { images: ['assets/tiles/Water.png'] };
        const wallTile = { images: ['assets/tiles/Wall.png'] };

        expect(service.getMovementCost(grassTile)).toBe(1);
        expect(service.getMovementCost(waterTile)).toBe(2);
        expect(service.getMovementCost(wallTile)).toBe(Infinity);
    });

    it('should return the correct tile effect', () => {
        const iceTile = { images: ['assets/tiles/Ice.png'] };
        const waterTile = { images: ['assets/tiles/Water.png'] };
        const grassTile = { images: ['assets/tiles/Grass.png'] };

        expect(service.getTileEffect(iceTile)).toBe('Glissant');
        expect(service.getTileEffect(waterTile)).toBe('Lent');
        expect(service.getTileEffect(grassTile)).toBe('Normal');
    });

    it('should return the correct tile type', () => {
        const iceTileImages = ['assets/tiles/Ice.png'];
        const grassTileImages = ['assets/tiles/Grass.png'];
        const doorOpenTileImages = ['assets/tiles/Door-Open.png'];
        const waterTileImages = ['assets/tiles/Water.png'];
        const wallTileImages = ['assets/tiles/Wall.png'];
        const unknownTileImages = ['assets/tiles/Unknown.png'];

        expect(service.getTileType(iceTileImages)).toBe('ice');
        expect(service.getTileType(grassTileImages)).toBe('base');
        expect(service.getTileType(doorOpenTileImages)).toBe('doorOpen');
        expect(service.getTileType(waterTileImages)).toBe('water');
        expect(service.getTileType(wallTileImages)).toBe('wall');
        expect(service.getTileType(unknownTileImages)).toBe('base');
    });

    it('should handle a player surrounded by walls', () => {
        const grid = [
            [
                { images: ['assets/tiles/Wall.png'], isOccuped: false },
                { images: ['assets/tiles/Wall.png'], isOccuped: false },
            ],
            [
                { images: ['assets/tiles/Wall.png'], isOccuped: false },
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
            ],
        ];

        const player: Player = {
            position: { row: 1, col: 1 },
            accessibleTiles: [],
        } as any;

        const maxMovement = 2;

        service.calculateAccessibleTiles(grid, player, maxMovement);

        expect(player.accessibleTiles.length).toBe(1);
        expect(player.accessibleTiles).toEqual([
            {
                position: { row: 1, col: 1 },
                path: [{ row: 1, col: 1 }],
            },
        ]);
    });

    it('should throw an error if destination is not accessible', () => {
        const grid = [
            [
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
                { images: ['assets/tiles/Wall.png'], isOccuped: false },
            ],
            [
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
                { images: ['assets/tiles/Grass.png'], isOccuped: false },
            ],
        ];

        const player: Player = {
            position: { row: 0, col: 0 },
            accessibleTiles: [],
        } as any;

        const maxMovement = 3;

        service.calculateAccessibleTiles(grid, player, maxMovement);

        const destination = { row: 0, col: 1 };

        expect(() => {
            service.calculateMovementCost(player.position, destination, player, grid);
        }).toThrow('Path to destination not found in accessible tiles.');
    });
});
