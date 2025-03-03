import { Game } from '@app/model/schema/game.schema';
import { GameService } from '@app/services/game/game.service';
import { Test, TestingModule } from '@nestjs/testing';
import { GameController } from './game.controller';

describe('GameController', () => {
    let controller: GameController;
    let service: GameService;

    const mockGame: Game = {
        name: 'Game 1',
        size: '15x15',
        mode: 'Survival',
        image: 'https://example.com/image.jpg',
        date: new Date(),
        visibility: true,
        description: '',
        grid: [[]],
    };

    const mockGames: Game[] = [
        mockGame,
        {
            name: 'Game 2',
            size: '10x10',
            mode: 'Adventure',
            image: 'https://example.com/image2.jpg',
            date: new Date(),
            visibility: true,
            description: '',
            grid: [[]],
        },
        {
            name: 'Game 3',
            size: '20x20',
            mode: 'Puzzle',
            image: 'https://example.com/image3.jpg',
            date: new Date(),
            visibility: false,
            description: '',
            grid: [[]],
        },
    ];

    beforeEach(async () => {
        const mockGameService = {
            getAllGames: jest.fn().mockResolvedValue(mockGames),
            createGame: jest.fn().mockResolvedValue(mockGame),
            getGameById: jest.fn().mockResolvedValue(mockGame),
            deleteGameById: jest.fn().mockResolvedValue(void 0),
            toggleVisibility: jest.fn().mockResolvedValue(mockGame),
            updateGame: jest.fn().mockResolvedValue(mockGame),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [GameController],
            providers: [{ provide: GameService, useValue: mockGameService }],
        }).compile();

        controller = module.get<GameController>(GameController);
        service = module.get<GameService>(GameService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return all games', async () => {
        const result = await controller.getAllGames();
        expect(result).toEqual(mockGames);
        expect(service.getAllGames).toHaveBeenCalled();
    });

    it('should create a new game', async () => {
        const result = await controller.createGame(mockGame);
        expect(result).toEqual(mockGame);
        expect(service.createGame).toHaveBeenCalledWith(mockGame);
    });

    it('should get a game by ID', async () => {
        const result = await controller.getGameById('1');
        expect(result).toEqual(mockGame);
        expect(service.getGameById).toHaveBeenCalledWith('1');
    });

    it('should delete a game by ID', async () => {
        const result = await controller.deleteGameById('1');
        expect(result).toBeUndefined();
        expect(service.deleteGameById).toHaveBeenCalledWith('1');
    });

    it('should toggle visibility of a game by ID', async () => {
        const updatedGame = { ...mockGame, visibility: false };
        service.toggleVisibility = jest.fn().mockResolvedValue(updatedGame);

        const result = await controller.toggleVisibility('1', { visibility: false });
        expect(result).toEqual(updatedGame);
        expect(service.toggleVisibility).toHaveBeenCalledWith('1', false);
    });

    it('should handle error when creating a new game', async () => {
        const error = new Error('Create game failed');
        service.createGame = jest.fn().mockRejectedValue(error);

        await expect(controller.createGame(mockGame)).rejects.toThrow(error);
    });

    it('should handle error when deleting a game by ID', async () => {
        const error = new Error('Delete game failed');
        service.deleteGameById = jest.fn().mockRejectedValue(error);

        await expect(controller.deleteGameById('1')).rejects.toThrow(error);
    });

    it('should handle error when toggling visibility', async () => {
        const error = new Error('Toggle visibility failed');
        service.toggleVisibility = jest.fn().mockRejectedValue(error);

        await expect(controller.toggleVisibility('1', { visibility: false })).rejects.toThrow(error);
    });

    it('should update a game by ID', async () => {
        const updatedGame: Partial<Game> = {
            name: 'Updated Game',
            description: 'Updated Description',
        };

        const result = await controller.updateGame('1', updatedGame);
        expect(result).toEqual(mockGame);
        expect(service.updateGame).toHaveBeenCalledWith('1', updatedGame);
    });

    it('should handle error when updating a game', async () => {
        const error = new Error('Update game failed');
        service.updateGame = jest.fn().mockRejectedValue(error);

        const updatedGame: Partial<Game> = {
            name: 'Updated Game',
            description: 'Updated Description',
        };

        await expect(controller.updateGame('1', updatedGame)).rejects.toThrow(error);
    });
});
