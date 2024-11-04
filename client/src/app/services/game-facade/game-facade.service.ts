import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game-model.interface';
import { GameService } from '@app/services/game/game.service';
import { GridService } from '@app/services/grid/grid.service';
import { ImageService } from '@app/services/image/image.service';
import { ValidateGameService } from '@app/services/validate-game/validateGame.service';
import { Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameFacadeService {
    constructor(
        private gameService: GameService,
        private validateGameService: ValidateGameService,
        private gridService: GridService,
        private imageService: ImageService,
    ) {}
    get gridTiles() {
        return this.gridService.getGridTiles();
    }
    fetchGame(id: string) {
        return this.gameService.fetchGame(id).pipe(
            tap((game: Game) => {
                this.gridService.setGrid(game.grid);
            }),
        );
    }
    updateGame(id: string, game: Partial<Game>): Observable<void> {
        return this.gameService.updateGame(id, game);
    }
    createGame(game: Game): Observable<void> {
        return this.gameService.createGame(game);
    }
    validateAll(grid: { images: string[]; isOccuped: boolean }[][]) {
        return this.validateGameService.validateAll(grid);
    }
    async createImage(grid: { images: string[]; isOccuped: boolean }[][]): Promise<string> {
        return this.imageService.createCompositeImageAsBase64(grid);
    }
    resetDefaultGrid() {
        this.gridService.resetDefaultGrid();
    }
}
