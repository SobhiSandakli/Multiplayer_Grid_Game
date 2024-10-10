import { Injectable } from '@angular/core';
import { GameService } from './game.service';
import { GridService } from './grid.service';
import { ImageService } from './image.service';
import { ValidateGameService } from './validateGame.service';
import { Game } from '../interfaces/game-model.interface';
import { Observable } from 'rxjs';

export interface Tile {
    images: string[];
    isOccuped: boolean;
}
type Row = Tile[];
type Grid = Row[];

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
    fetchGame(id: string) {
        return this.gameService.fetchGame(id);
    }
    updateGame(id: string, game: Partial<Game>): Observable<void> {
        return this.gameService.updateGame(id, game);
    }
    createGame(game: Game): Observable<void> {
        return this.gameService.createGame(game);
    }
    setGrid(grid: { images: string[]; isOccuped: boolean }[][]) {
        this.gridService.setGrid(grid);
    }
    get gridTiles() {
        return this.gridService.getGridTiles();
    }
    validateAll(grid: { images: string[]; isOccuped: boolean }[][]) {
        return this.validateGameService.validateAll(grid);
    }
    createImage(grid: Grid): Promise<string> {
        return this.imageService.createCompositeImageAsBase64(grid);
    }
    resetDefaultGrid() {
        this.gridService.resetDefaultGrid();
    }
}
