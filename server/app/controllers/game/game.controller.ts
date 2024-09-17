// game.controller.ts
import { Game } from '@app/model/schema/game.schema';
import { GameService } from '@app/services/game/game.service';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Game')
@Controller('games')
export class GameController {
    constructor(private readonly gameService: GameService) {}

    @ApiOkResponse({
        description: 'Return all games',
        type: Game,
        isArray: true,
    })
    @Get('/')
    async getAllGames() {
        const games = await this.gameService.getAllGames();
        return games;
    }

    @ApiCreatedResponse({
        description: 'Create a new game',
    })
    @Post('/create')
    createGame(@Body() game: Game) {
        return this.gameService.createGame(game);
    }

    @ApiOkResponse({
        description: 'Get a game by ID',
        type: Game,
    })
    @Get('/:id')
    getGameById(@Param('id') id: string) {
        return this.gameService.getGameById(id);
    }
}
