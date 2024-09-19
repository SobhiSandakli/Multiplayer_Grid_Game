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
            await this.gameModel.create(game);
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
}
