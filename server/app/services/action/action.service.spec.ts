import { Player } from '@app/interfaces/player/player.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { ActionService } from './action.service';

describe('ActionService', () => {
    let service: ActionService;
    let player: Player;
    let grid: { images: string[]; isOccuped: boolean }[][];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ActionService],
        }).compile();

        service = module.get<ActionService>(ActionService);

        player = {
            socketId: 'player1',
            name: 'Player1',
            avatar: 'assets/avatars/player1.png',
            position: { row: 1, col: 1 },
            attributes: {
                speed: { currentValue: 5, baseValue: 5, dice: '', name: '', description: '' },
            },
            isOrganizer: false,
            accessibleTiles: [],
        };

        grid = [
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
            [
                { images: [], isOccuped: false },
                { images: [player.avatar], isOccuped: true },
                { images: [], isOccuped: false },
            ],
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
        ];
    });

    it('should return true if there is an open or closed door nearby', () => {
        grid[0][1].images.push('Door-Open.png');

        const result = service.checkAvailableActions(player, grid);
        expect(result).toBe(true);
    });

    it('should return true if there is another player nearby', () => {
        grid[1][0].images.push('assets/avatars/player2.png');

        const result = service.checkAvailableActions(player, grid);
        expect(result).toBe(true);
    });

    it('should return false if there are no doors or other players nearby', () => {
        const result = service.checkAvailableActions(player, grid);
        expect(result).toBe(false);
    });

    it('should detect a door on the tile (isDoor method)', () => {
        grid[0][1].images.push('Door-Closed.png');

        const result = service.checkAvailableActions(player, grid);
        expect(result).toBe(true);
    });

    it('should detect another player on the tile (hasOtherPlayer method)', () => {
        grid[1][0].images.push('assets/avatars/player2.png');

        const result = service.checkAvailableActions(player, grid);
        expect(result).toBe(true);
    });

    it('should return false if the adjacent tile contains only the current player', () => {
        grid[1][0].images.push(player.avatar);

        const result = service.checkAvailableActions(player, grid);
        expect(result).toBe(false);
    });

    it('should ignore tiles outside of grid bounds', () => {
        grid[0][1].images.push('Door-Open.png');

        const result = service.checkAvailableActions(player, grid);
        expect(result).toBe(true);
    });
    it('should return false if all adjacent tiles are out of bounds', () => {
        player.position = { row: 0, col: 0 };

        const result = service.checkAvailableActions(player, grid);
        expect(result).toBe(false);
    });
});
