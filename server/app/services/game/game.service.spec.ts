import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { getModelToken } from '@nestjs/mongoose';
import { Game, GameDocument } from '@app/model/schema/game.schema';
import { Model, Query } from 'mongoose';
import { Logger, HttpException, HttpStatus } from '@nestjs/common';

describe('GameService', () => {
    let service: GameService;
    let gameModel: Model<GameDocument>;
    let logger: Logger;

    const mockGame: Game = {
        name: 'Game 1',
        size: '15x15',
        mode: 'Survival',
        image: 'https://example.com/image.jpg',
        date: new Date(),
        visibility: true,
        description: '',
        grid: [],
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
            grid: [],
        },
        {
            name: 'Game 3',
            size: '20x20',
            mode: 'Puzzle',
            image: 'https://example.com/image3.jpg',
            date: new Date(),
            visibility: false,
            description: '',
            grid: [],
        },
    ];

    beforeEach(async () => {
        const mockGameModel = {
            find: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockGames),
            } as unknown as Query<GameDocument[], GameDocument>),
            findById: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockGame),
            } as unknown as Query<GameDocument, GameDocument>),
            findOne: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            } as unknown as Query<GameDocument, GameDocument>),
            create: jest.fn().mockResolvedValue(mockGame),
            findByIdAndDelete: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockGame),
            } as unknown as Query<GameDocument, GameDocument>),
            findByIdAndUpdate: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockGame),
            } as unknown as Query<GameDocument, GameDocument>),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameService,
                { provide: getModelToken(Game.name), useValue: mockGameModel },
                { provide: Logger, useValue: { log: jest.fn(), error: jest.fn() } },
            ],
        }).compile();

        service = module.get<GameService>(GameService);
        gameModel = module.get<Model<GameDocument>>(getModelToken(Game.name));
        logger = module.get<Logger>(Logger);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should retrieve all games', async () => {
        const result = await service.getAllGames();
        expect(result).toEqual(mockGames);
        expect(gameModel.find).toHaveBeenCalled();
    });

    it('should handle error when retrieving all games', async () => {
        const errorMessage = 'Database error';
        jest.spyOn(gameModel, 'find').mockReturnValueOnce({
            exec: jest.fn().mockRejectedValueOnce(new Error(errorMessage)),
        } as unknown as Query<GameDocument[], GameDocument>);

        await expect(service.getAllGames()).rejects.toThrow(errorMessage);
        expect(logger.error).toHaveBeenCalledWith(`Failed to retrieve games: Error: ${errorMessage}`);
    });

    it('should retrieve a game by ID', async () => {
        const result = await service.getGameById('1');
        expect(result).toEqual(mockGame);
        expect(gameModel.findById).toHaveBeenCalledWith('1');
    });

    it('should handle error when retrieving a game by ID', async () => {
        const errorMessage = 'Database error';
        jest.spyOn(gameModel, 'findById').mockReturnValueOnce({
            exec: jest.fn().mockRejectedValueOnce(new Error(errorMessage)),
        } as unknown as Query<GameDocument, GameDocument>);

        await expect(service.getGameById('1')).rejects.toThrow(errorMessage);
        expect(logger.error).toHaveBeenCalledWith(`Failed to retrieve game: Error: ${errorMessage}`);
    });

    it('should create a new game', async () => {
        jest.spyOn(gameModel, 'findOne').mockReturnValueOnce({
            exec: jest.fn().mockResolvedValueOnce(null),
        } as unknown as Query<GameDocument, GameDocument>);

        await service.createGame(mockGame);
        expect(gameModel.create).toHaveBeenCalledWith(mockGame);
        expect(logger.log).toHaveBeenCalledWith('Game "Game 1" created successfully.');
    });

    it('should throw an error if game name already exists', async () => {
        jest.spyOn(gameModel, 'findOne').mockReturnValueOnce({
            exec: jest.fn().mockResolvedValueOnce(mockGame),
        } as unknown as Query<GameDocument, GameDocument>);

        await expect(service.createGame(mockGame)).rejects.toThrow('A game with the name "Game 1" already exists.');
        expect(logger.error).toHaveBeenCalledWith('Failed to create game: Error: A game with the name "Game 1" already exists.');
    });

    it('should delete a game by ID', async () => {
        await service.deleteGameById('1');
        expect(gameModel.findByIdAndDelete).toHaveBeenCalledWith('1');
    });

    it('should throw an error if game to delete is not found', async () => {
        jest.spyOn(gameModel, 'findByIdAndDelete').mockReturnValueOnce({
            exec: jest.fn().mockResolvedValueOnce(null),
        } as unknown as Query<GameDocument, GameDocument>);

        await expect(service.deleteGameById('1')).rejects.toThrow(new HttpException('Failed to delete game', HttpStatus.INTERNAL_SERVER_ERROR));
        expect(logger.error).toHaveBeenCalledWith('Failed to delete game: Game not found', expect.any(String));
    });

    it('should toggle visibility of a game by ID', async () => {
        const updatedGame = { ...mockGame, visibility: false };
        jest.spyOn(gameModel, 'findByIdAndUpdate').mockReturnValueOnce({
            exec: jest.fn().mockResolvedValueOnce(updatedGame),
        } as unknown as Query<GameDocument, GameDocument>);

        const result = await service.toggleVisibility('1', false);
        expect(result).toEqual(updatedGame);
        expect(gameModel.findByIdAndUpdate).toHaveBeenCalledWith('1', { visibility: false }, { new: true });
        expect(logger.log).toHaveBeenCalledWith('Visibility updated for game 1: false');
    });

    it('should throw an error if game to toggle visibility is not found', async () => {
        jest.spyOn(gameModel, 'findByIdAndUpdate').mockReturnValueOnce({
            exec: jest.fn().mockResolvedValueOnce(null),
        } as unknown as Query<GameDocument, GameDocument>);
        await expect(service.toggleVisibility('1', false)).rejects.toThrow(
            new HttpException('Failed to update visibility', HttpStatus.INTERNAL_SERVER_ERROR),
        );
        expect(logger.error).toHaveBeenCalledWith('Failed to update visibility for game 1: Game not found', expect.any(String));
    });
    it('should update a game by ID', async () => {
        const updatedGameData = { name: 'Updated Game Name', size: '20x20' };
        const updatedGame = { ...mockGame, ...updatedGameData };

        // Mocking the findById method to return the mock game as a GameDocument
        const mockGameDocument = { ...mockGame, save: jest.fn().mockResolvedValueOnce(updatedGame) } as unknown as GameDocument;
        jest.spyOn(gameModel, 'findById').mockResolvedValueOnce(mockGameDocument);

        const result = await service.updateGame('1', updatedGameData);
        expect(result).toEqual(updatedGame);
        expect(gameModel.findById).toHaveBeenCalledWith('1');
        expect(mockGameDocument.save).toHaveBeenCalled();
    });
    it('should throw an error if game to update is not found', async () => {
        const updatedGameData = { name: 'Updated Game Name', size: '20x20' };

        // Mocking findById to return null, simulating a "game not found" scenario
        jest.spyOn(gameModel, 'findById').mockResolvedValueOnce(null);

        await expect(service.updateGame('1', updatedGameData)).rejects.toThrow('Game with ID 1 not found');
        expect(gameModel.findById).toHaveBeenCalledWith('1');
    });
});
