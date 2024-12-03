/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-lines */
import { Game, GameDocument } from '@app/model/schema/game.schema';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Query } from 'mongoose';
import { GameService } from './game.service';

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

    it('should throw an error if game to update is not found', async () => {
        const updatedGameData = { name: 'Updated Game Name', size: '20x20' };

        jest.spyOn(gameModel, 'findById').mockResolvedValueOnce(null);

        await expect(service.updateGame('1', updatedGameData)).rejects.toThrow('Game with ID 1 not found');
        expect(gameModel.findById).toHaveBeenCalledWith('1');
    });

    describe('updateGame', () => {
        it('should update game successfully', async () => {
            const id = 'gameId';
            const gameDto = { name: 'New Game Name', size: '10x10' };

            const game = {
                _id: id,
                name: 'Old Game Name',
                size: '8x8',
                save: jest.fn().mockResolvedValue({ ...gameDto, _id: id }),
            };

            gameModel.findById = jest.fn().mockResolvedValue(game);
            gameModel.findOne = jest.fn().mockResolvedValue(null);

            const result = await service.updateGame(id, gameDto);

            expect(gameModel.findById).toHaveBeenCalledWith(id);
            expect(gameModel.findOne).toHaveBeenCalledWith({ name: gameDto.name });
            expect(game.save).toHaveBeenCalled();
            expect(result).toEqual({ ...gameDto, _id: id });
        });

        it('should throw an error if game not found', async () => {
            const id = 'nonExistingGameId';
            const gameDto = { name: 'New Game Name', size: '10x10' };

            gameModel.findById = jest.fn().mockResolvedValue(null);

            await expect(service.updateGame(id, gameDto)).rejects.toThrow(`Game with ID ${id} not found`);
            expect(gameModel.findById).toHaveBeenCalledWith(id);
        });

        it('should throw an error if new game name already exists', async () => {
            const id = 'gameId';
            const gameDto = { name: 'Existing Game Name' };

            const game = {
                _id: id,
                name: 'Old Game Name',
                save: jest.fn(),
            };

            const existingGame = { _id: 'anotherGameId', name: 'Existing Game Name' };

            gameModel.findById = jest.fn().mockResolvedValue(game);
            gameModel.findOne = jest.fn().mockResolvedValue(existingGame);

            await expect(service.updateGame(id, gameDto)).rejects.toThrow(`A game with the name "${gameDto.name}" already exists.`);

            expect(gameModel.findById).toHaveBeenCalledWith(id);
            expect(gameModel.findOne).toHaveBeenCalledWith({ name: gameDto.name });
            expect(game.save).not.toHaveBeenCalled();
        });
    });
});
