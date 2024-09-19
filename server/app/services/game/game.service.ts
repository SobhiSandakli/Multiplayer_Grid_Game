// game.service.ts
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Game, GameDocument } from '@app/model/schema/game.schema';

@Injectable()
export class GameService {
    constructor(
        @InjectModel(Game.name) private gameModel: Model<GameDocument>,
        private readonly logger: Logger,
    ) {}

    async getAllGames(): Promise<Game[]> {
        try {
            const games = await this.gameModel.find({}).exec();
            return games;
        } catch (error) {
            this.logger.error(`Failed to retrieve games: ${error}`);
            throw error;
        }
    }

    async getGameById(id: string): Promise<Game> {
        try {
            return await this.gameModel.findById(id).exec();
        } catch (error) {
            this.logger.error(`Failed to retrieve game: ${error}`);
            throw error;
        }
    }

    async createGame(game: Game): Promise<void> {
        try {
            const existingGame = await this.gameModel.findOne({ name: game.name }).exec();
            if (existingGame) {
                throw new Error(`A game with the name "${game.name}" already exists.`);
            }
            await this.gameModel.create(game);
            this.logger.log(`Game "${game.name}" created successfully.`);
        } catch (error) {
            this.logger.error(`Failed to create game: ${error}`);
            throw error;
        }
    }

    async deleteGameById(id: string): Promise<void> {
        try {
            const deletedGame = await this.gameModel.findByIdAndDelete(id).exec();
            if (!deletedGame) {
                throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
            }
        } catch (error) {
            this.logger.error(`Failed to delete game: ${error.message}`, error.stack);
            throw new HttpException('Failed to delete game', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async toggleVisibility(id: string, visibility: boolean): Promise<Game> {
        try {
            const updatedGame = await this.gameModel
                .findByIdAndUpdate(
                    id,
                    { visibility },
                    { new: true }, // Return the updated document
                )
                .exec();
            if (!updatedGame) {
                throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
            }
            this.logger.log(`Visibility updated for game ${id}: ${visibility}`);
            return updatedGame;
        } catch (error) {
            this.logger.error(`Failed to update visibility for game ${id}: ${error.message}`, error.stack);
            throw new HttpException('Failed to update visibility', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
