import { Game } from '@app/model/schema/game.schema';
import { GameService } from '@app/services/game/game.service';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
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
    async createGame(@Body() game: Game) {
        return this.gameService.createGame(game);
    }

    @ApiOkResponse({
        description: 'Get a game by ID',
        type: Game,
    })
    @Get('/:id')
    async getGameById(@Param('id') id: string) {
        return this.gameService.getGameById(id);
    }
    @Delete('/:id')
    async deleteGameById(@Param('id') id: string) {
        return this.gameService.deleteGameById(id);
    }
    @ApiOkResponse({
        description: 'Toggle visibility of a game by ID',
        type: Game,
    })
    @Patch('/toggle-visibility/:id')
    async toggleVisibility(@Param('id') id: string, @Body() body: { visibility: boolean }) {
        return this.gameService.toggleVisibility(id, body.visibility);
    }
}
