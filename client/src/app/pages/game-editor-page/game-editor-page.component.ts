import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { Game } from '@app/interfaces/game-model.interface';
import { DragDropService } from '@app/services/drag-and-drop.service';
import { GameFacadeService } from '@app/services/game-facade.service';
import { faArrowLeft, IconDefinition } from '@fortawesome/free-solid-svg-icons';

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
    readonly maxLengthDescription: number = 200;

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
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            const gameId = params['gameId'];
            if (gameId) {
                this.loadGame(gameId);
            }
        });
    }
    loadGame(gameId: string): void {
        this.gameId = gameId;
        this.gameFacade.gameService.fetchGame(gameId).subscribe((game: Game) => {
            this.gameName = game.name;
            this.gameDescription = game.description;
            this.gameFacade.gridService.setGrid(game.grid);
            this.dragDropService.setInvalid(this.objectContainer.startedPointsIndexInList);
        });
    }

    onNameInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.isNameExceeded = textarea.value.length > this.maxLengthName;
        this.gameName = textarea.value;
    }

    onDescriptionInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.isDescriptionExceeded = textarea.value.length > this.maxLengthDescription;
        this.gameDescription = textarea.value;
    }

    onSave(): void {
        const GRID_ARRAY = this.gameFacade.gridService.getGridTiles();
        const ERROR_CODE = 500;
        if (!this.gameName || !this.gameDescription) {
            window.alert('Veuillez remplir le nom et la description du jeu.');
            return;
        }

        if (this.gameFacade.validateGameService.validateAll(GRID_ARRAY)) {
            this.gameFacade.imageService
                .createCompositeImageAsBase64(GRID_ARRAY)
                .then((base64Image) => {
                    const GAME: Game = {
                        name: this.gameName,
                        description: this.gameDescription,
                        size: GRID_ARRAY.length + 'x' + GRID_ARRAY[0].length,
                        mode: 'Classique', // TO BE CHANGED IN SPRINT 2
                        image: base64Image,
                        date: new Date(),
                        visibility: false,
                        grid: GRID_ARRAY,
                        _id: '',
                    };

                    const GAME_ID = this.route.snapshot.queryParamMap.get('gameId');
                    if (GAME_ID) {
                        GAME._id = GAME_ID;
                        this.gameFacade.gameService.updateGame(GAME_ID, GAME).subscribe({
                            next: () => {
                                window.alert('Le jeu a été mis à jour avec succès.');
                                this.router.navigate(['/admin-page']);
                            },
                            error: (error) => {
                                window.alert('Échec de la mise à jour du jeu: ' + error.message);
                            },
                        });
                    } else {
                        this.gameFacade.gameService.createGame(GAME).subscribe({
                            next: () => {
                                window.alert('Le jeu a été enregistré avec succès.');
                                this.router.navigate(['/admin-page']);
                            },
                            error: (error) => {
                                if (error.status === ERROR_CODE) {
                                    window.alert('Un jeu avec le même nom est déjà enregistré, veuillez choisir un autre.');
                                } else {
                                    window.alert("Échec de l'enregistrement du jeu: " + error.message);
                                }
                            },
                        });
                    }
                })
                .catch((error) => {
                    window.alert("Erreur lors de la création de l'image composite: " + error.message);
                });
        } else {
            window.alert('Échec de la validation du jeu');
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
            this.gameFacade.gridService.resetDefaultGrid();
            this.objectContainer.resetDefaultContainer();
        }
    }

    openPopup(): void {
        this.showCreationPopup = true;
    }
}
