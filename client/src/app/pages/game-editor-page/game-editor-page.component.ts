import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { Game } from '@app/interfaces/game-model.interface';
import { DragDropService } from '@app/services/drag-and-drop.service';
import { GameFacadeService } from '@app/services/game-facade.service';
import { faArrowLeft, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-game-editor-page',
    templateUrl: './game-editor-page.component.html',
    styleUrls: ['./game-editor-page.component.scss'],
})
export class GameEditorPageComponent implements OnInit {
    @ViewChild(ObjectContainerComponent) objectContainer: ObjectContainerComponent;
    faArrowLeft: IconDefinition = faArrowLeft;
    showCreationPopup = false;
    readonly maxLengthName: number = 30;
    readonly maxLengthDescription: number = 100;

    isNameExceeded = false;
    isDescriptionExceeded = false;

    gameName: string = '';
    gameDescription: string = '';
    gameId: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private gameFacade: GameFacadeService,
        private dragDropService: DragDropService,
        private snackBar: MatSnackBar,
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            const gameId = params['gameId'];
            if (gameId) {
                this.loadGame(gameId);
            }
        });
    }

    openSnackBar(message: string, action: string = 'OK') {
        this.snackBar.open(message, action, {
            duration: 5000, // You can adjust the duration as needed
        });
    }

    loadGame(gameId: string): void {
        this.gameId = gameId;
        this.gameFacade.fetchGame(gameId).subscribe((game: Game) => {
            this.gameName = game.name;
            this.gameDescription = game.description;
            this.gameFacade.setGrid(game.grid);
            this.dragDropService.setInvalid(this.objectContainer.startedPointsIndexInList);
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

    onSave(): void {
        const GRID_ARRAY = this.gameFacade.gridTiles;
        const ERROR_CODE = 500;
        if (!this.gameName || !this.gameDescription) {
            this.openSnackBar('Veuillez remplir le nom et la description du jeu.');
            return;
        }

        if (this.gameFacade.validateAll(GRID_ARRAY)) {
            this.gameFacade.createImage(GRID_ARRAY)
                .then((base64Image) => {
                    const GAME: Game = {
                        name: this.gameName,
                        description: this.gameDescription,
                        size: GRID_ARRAY.length + 'x' + GRID_ARRAY[0].length,
                        mode: 'Classique',
                        image: base64Image,
                        date: new Date(),
                        visibility: false,
                        grid: GRID_ARRAY,
                        _id: '',
                    };

                    const GAME_ID = this.route.snapshot.queryParamMap.get('gameId');
                    if (GAME_ID) {
                        GAME._id = GAME_ID;
                        this.gameFacade.updateGame(GAME_ID, GAME).subscribe({
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
                    } else {
                        this.gameFacade.createGame(GAME).subscribe({
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
                })
                .catch(() => {
                    this.openSnackBar("Erreur lors de la création de l'image composite");
                });
        }
    }

    confirmReset(): void {
        this.showCreationPopup = false;
        this.reset();
    }

    cancelReset(): void {
        this.showCreationPopup = false;
    }

    reset(): void {
        if (this.gameId) {
            this.loadGame(this.gameId);
        } else {
            this.gameName = '';
            this.gameDescription = '';
            this.gameFacade.resetDefaultGrid();
            this.objectContainer.resetDefaultContainer();
        }
    }

    openPopup(): void {
        this.showCreationPopup = true;
    }
}
