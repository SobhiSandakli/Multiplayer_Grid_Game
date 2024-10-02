import { Injectable } from '@angular/core';
import { GameService } from './game.service';
import { GridService } from './grid.service';
import { ImageService } from './image.service';
import { ValidateGameService } from './validateGame.service';

@Injectable({
    providedIn: 'root',
})
export class GameFacadeService {
    constructor(
        public gameService: GameService,
        public validateGameService: ValidateGameService,
        public gridService: GridService,
        public imageService: ImageService,
    ) {}
}
