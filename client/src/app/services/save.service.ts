import { Injectable } from '@angular/core';
import { GameFacadeService } from './game-facade.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Game } from '@app/interfaces/game-model.interface';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})

export class SaveService {
    gameName: string = '';
    gameDescription: string = '';
    gameId: string = '';
    readonly maxLengthName: number = 30;
    readonly maxLengthDescription: number = 100;
    isNameExceeded = false;
    isDescriptionExceeded = false;
    
    constructor(
        private route: ActivatedRoute,
        private gameFacade : GameFacadeService,
        private snackBar: MatSnackBar,
        private router: Router,
    ) {}
    onSave(): void {
        const GRID_ARRAY = this.gameFacade.gridTiles;
    
        if (!this.isInputValid()) {
            return;
        }
    
        if (this.gameFacade.validateAll(GRID_ARRAY)) {
            this.processGameSaving(GRID_ARRAY);
        } else {
            this.openSnackBar('Validation échouée, veuillez vérifier la grille.');
        }
    }

    isInputValid(): boolean {
        if (!this.gameName || !this.gameDescription) {
            this.openSnackBar('Veuillez remplir le nom et la description du jeu.');
            return false;
        }
        return true;
    }
    processGameSaving(grid: { images: string[]; isOccuped: boolean }[][]): void {
        this.gameFacade.createImage(grid)
            .then((base64Image) => {
                const GAME = this.createGameObject(grid, base64Image);
    
                const GAME_ID = this.route.snapshot.queryParamMap.get('gameId');
                if (GAME_ID) {
                    this.updateGame(GAME_ID, GAME);
                } else {
                    this.createNewGame(GAME);
                }
            })
            .catch(() => {
                this.openSnackBar("Erreur lors de la création de l'image composite");
            });
    }

    createGameObject(grid: { images: string[]; isOccuped: boolean }[][], base64Image: string): Game {
        return {
            name: this.gameName,
            description: this.gameDescription,
            size: `${grid.length}x${grid[0].length}`,
            mode: 'Classique',
            image: base64Image,
            date: new Date(),
            visibility: false,
            grid: grid,
            _id: '',
        };
    }
    createNewGame(game: Game): void {
        const ERROR_CODE = 500;
        this.gameFacade.createGame(game).subscribe({
            next: () => {
                this.openSnackBar('Le jeu a été enregistré avec succès.');
                this.router.navigate(['/admin-page']);
            },
            error: (error) => {
                if (error.status === ERROR_CODE) {
                    this.openSnackBar('Un jeu avec le même nom est déjà enregistré, veuillez choisir un autre.');
                }
            },
        });
    }
    updateGame(gameId: string, game: Game): void {
        const ERROR_CODE = 500;
        this.gameFacade.updateGame(gameId, game).subscribe({
            next: () => {
                this.openSnackBar('Le jeu a été mis à jour avec succès.');
                this.router.navigate(['/admin-page']);
            },
            error: (error) => {
                if (error.status === ERROR_CODE) {
                    this.openSnackBar('Un jeu avec le même nom est déjà enregistré, veuillez choisir un autre.');
                }
            },
        });
    }
    openSnackBar(message: string, action: string = 'OK') {
        this.snackBar.open(message, action, {
            duration: 5000, 
        });
    }
    onNameInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.isNameExceeded = textarea.value.length > this.maxLengthName;
        if (this.isNameExceeded) {
            this.openSnackBar('Le nom ne doit pas dépasser 30 caractères.');
        }
        this.gameName = textarea.value;
    }

    onDescriptionInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.isDescriptionExceeded = textarea.value.length > this.maxLengthDescription;
        if (this.isDescriptionExceeded) {
            this.openSnackBar('La description ne doit pas dépasser 100 caractères.');
        }
        this.gameDescription = textarea.value;
    }

            
}