import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '@app/interfaces/game-model.interface';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';

@Injectable({
    providedIn: 'root',
})
export class SaveService {
    isNameExceeded = false;
    isDescriptionExceeded = false;
    readonly maxLengthName: number = 30;
    readonly maxLengthDescription: number = 100;
    constructor(
        private route: ActivatedRoute,
        private gameFacade: GameFacadeService,
        private snackBar: MatSnackBar,
        private router: Router,
    ) {}

    // eslint-disable-next-line no-unused-vars
    onNameInput(event: Event, gameName: string): string {
        const textarea = event.target as HTMLTextAreaElement;
        this.isNameExceeded = textarea.value.length > this.maxLengthName;
        if (this.isNameExceeded) {
            this.openSnackBar('Le nom ne doit pas dépasser 30 caractères.');
        }
        return textarea.value;
    }
    // eslint-disable-next-line no-unused-vars
    onDescriptionInput(event: Event, gameDescription: string): string {
        const textarea = event.target as HTMLTextAreaElement;
        this.isDescriptionExceeded = textarea.value.length > this.maxLengthDescription;
        if (this.isDescriptionExceeded) {
            this.openSnackBar('La description ne doit pas dépasser 100 caractères.');
        }
        return textarea.value;
    }

    onSave(gameName: string, gameDescription: string): void {
        const GRID_ARRAY = this.gameFacade.gridTiles;

        if (!this.isInputValid(gameName, gameDescription)) {
            return;
        }

        if (this.gameFacade.validateAll(GRID_ARRAY)) {
            this.handleImageCreation(gameName, gameDescription, GRID_ARRAY);
        }
    }

    isInputValid(gameName: string, gameDescription: string): boolean {
        if (!gameName || !gameDescription) {
            this.openSnackBar('Veuillez remplir le nom et la description du jeu.');
            return false;
        }
        return true;
    }

    handleImageCreation(gameName: string, gameDescription: string, grid: { images: string[]; isOccuped: boolean }[][]): void {
        this.gameFacade
            .createImage(grid)
            .then((base64Image) => {
                const gameObject = this.createGameObject(gameName, gameDescription, grid, base64Image);
                this.saveGame(gameObject);
            })
            .catch(() => {
                this.openSnackBar("Erreur lors de la création de l'image composite");
            });
    }

    saveGame(game: Game): void {
        const GAME_ID = this.route.snapshot.queryParamMap.get('gameId');

        if (GAME_ID) {
            game._id = GAME_ID;
            this.updateExistingGame(GAME_ID, game);
        } else {
            this.createNewGame(game);
        }
    }

    updateExistingGame(gameId: string, game: Game): void {
        this.gameFacade.updateGame(gameId, game).subscribe({
            next: () => {
                this.showSuccessSnackBar('Le jeu a été mis à jour avec succès.');
            },
            error: (error) => {
                this.handleSaveError(error);
            },
        });
    }

    createNewGame(game: Game): void {
        this.gameFacade.createGame(game).subscribe({
            next: () => {
                this.showSuccessSnackBar('Le jeu a été enregistré avec succès.');
            },
            error: (error) => {
                this.handleSaveError(error);
            },
        });
    }

    showSuccessSnackBar(message: string): void {
        this.openSnackBar(message);
        this.router.navigate(['/admin-page']);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSaveError(error: any): void {
        const ERROR_CODE = 500;
        if (error.status === ERROR_CODE) {
            this.openSnackBar('Un jeu avec le même nom est déjà enregistré.');
        } else {
            this.openSnackBar("Erreur lors de l'enregistrement du jeu.");
        }
    }

    createGameObject(gameName: string, gameDescription: string, grid: { images: string[]; isOccuped: boolean }[][], base64Image: string): Game {
        return {
            name: gameName,
            description: gameDescription,
            size: `${grid.length}x${grid[0].length}`,
            mode: 'Classique',
            image: base64Image,
            date: new Date(),
            visibility: false,
            grid,
            _id: '',
        };
    }

    openSnackBar(message: string, action: string = 'OK') {
        this.snackBar.open(message, action, { duration: 5000 });
    }
}
