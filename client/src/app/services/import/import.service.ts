import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game-model.interface';
import { GameService } from '@app/services/game/game.service';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { ValidateGameService } from '@app/services/validate-game/validateGame.service';
import { ValidationRules } from 'src/constants/validate-constants';
import { Observable, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ImportService {
    constructor(
        private gameService: GameService,
        private gameFacade: GameFacadeService,
        private validateGameService: ValidateGameService,
    ) {}

    importGame(gameData: Game, existingGames: Game[]): Observable<Game> {
        const validationError = this.validateImportedGameData(gameData);
        if (validationError) {
            return throwError(() => new Error(validationError));
        }

        if (this.isDuplicateGame(gameData, existingGames)) {
            return throwError(() => new Error('DUPLICATE_GAME_NAME'));
        }

        if (!this.isValidGrid(gameData.grid)) {
            return throwError(() => new Error('INVALID_GRID'));
        }

        return this.createGameObservable(gameData);
    }

    downloadGame(game: Game): void {
        const { visibility, ...gameData } = game;
        const jsonString = JSON.stringify(gameData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${game.name}.json`;
        link.click();
    }

    private isDuplicateGame(gameData: Game, existingGames: Game[]): boolean {
        return existingGames.some((game) => game.name === gameData.name);
    }

    private isValidGrid(grid: any): boolean {
        return grid && Array.isArray(grid);
    }

    private async generateGameImage(gameData: Game): Promise<Game> {
        const base64Image = await this.gameFacade.createImage(gameData.grid);
        gameData.image = base64Image;
        const newGame: Game = {
            ...gameData,
            visibility: false,
            date: new Date(),
        };
        return newGame;
    }

    private saveNewGame(newGame: Game): Observable<void> {
        return new Observable<void>((observer) => {
            this.gameService.createGame(newGame).subscribe(
                () => {
                    observer.next();
                    observer.complete();
                },
                (error) => observer.error(error),
            );
        });
    }
    private createGameObservable(gameData: Game): Observable<Game> {
        return new Observable<Game>((observer) => {
            this.generateGameImage(gameData)
                .then((newGame: Game) => {
                    this.saveNewGame(newGame).subscribe(
                        () => {
                            observer.next(newGame);
                            observer.complete();
                        },
                        (error) => observer.error(error),
                    );
                })
                .catch((error) => observer.error(error));
        });
    }

    private validateImportedGameData(gameData: Game): string | null {
        for (const rule of ValidationRules(gameData, this.validateGameService)) {
            if (rule.condition) {
                return rule.message;
            }
        }
        return null;
    }
}
