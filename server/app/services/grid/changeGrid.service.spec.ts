/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Attribute } from '@app/interfaces/attribute/attribute.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { MovementService } from '@app/services/movement/movement.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ChangeGridService } from './changeGrid.service';

describe('ChangeGridService', () => {
    let service: ChangeGridService;
    let mockMovementService: MovementService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ChangeGridService, { provide: MovementService, useValue: { calculateAccessibleTiles: jest.fn() } }],
        }).compile();

        service = module.get<ChangeGridService>(ChangeGridService);
        mockMovementService = module.get<MovementService>(MovementService);
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
                },
            ];

            const modifiedGrid = service.changeGrid(grid, players);
            expect(modifiedGrid[0][0].images).toContain(players[0].avatar);
            expect(modifiedGrid[1][0].images).not.toContain('assets/objects/started-points.png');
            expect(modifiedGrid[1][1].images).not.toContain('assets/objects/started-points.png');
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
});
