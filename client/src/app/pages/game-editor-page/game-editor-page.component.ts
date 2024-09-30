
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { Game } from '@app/game.model';
import { GameFacadeService } from '@app/services/game-facade.service';
import { faArrowLeft, IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-game-editor-page',
    templateUrl: './game-editor-page.component.html',
    styleUrls: ['./game-editor-page.component.scss'],
})
export class GameEditorPageComponent implements OnInit {
    faArrowLeft: IconDefinition = faArrowLeft; 
    @ViewChild(ObjectContainerComponent) objectContainer: ObjectContainerComponent;
    showCreationPopup = false;
    readonly maxLengthName: number = 30;
    readonly maxLengthDescription: number = 200;

    isNameExceeded = false;
    isDescriptionExceeded = false;

    gameName: string = '';
    gameDescription: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private gameFacade: GameFacadeService,
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
        this.gameFacade.gameService.fetchGame(gameId).subscribe((game: Game) => {
            this.gameName = game.name;
            this.gameDescription = game.description;
            this.gameFacade.gridService.setGrid(game.grid);
            //  this.gridService.setGrid(game.grid as { images: string[]; isOccuped: boolean }[][]);
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
        const gridArray = this.gameFacade.gridService.getGridTiles();
        if (!this.gameName || !this.gameDescription) {
            window.alert('Veuillez remplir le nom et la description du jeu.');
            return;
        }

        if (this.gameFacade.validateGameService.validateAll(gridArray)) {
            this.gameFacade.imageService
                .createCompositeImageAsBase64(gridArray)
                .then((base64Image) => {
                    const game: Game = {
                        name: this.gameName,
                        description: this.gameDescription,
                        size: gridArray.length + 'x' + gridArray[0].length,
                        mode: 'Classique', // TO BE CHANGED IN SPRINT 2
                        image: base64Image,
                        date: new Date(),
                        visibility: false,
                        grid: gridArray,
                        _id: '',
                    };

                    const gameId = this.route.snapshot.queryParamMap.get('gameId');
                    if (gameId) {
                        game._id = gameId; // Set the game ID for updating
                        this.gameFacade.gameService.updateGame(gameId, game).subscribe({
                            next: () => {
                                window.alert('Le jeu a été mis à jour avec succès.');
                                this.router.navigate(['/admin-page']); // Navigate to admin view
                            },
                            error: (error) => {
                                window.alert('Échec de la mise à jour du jeu: ' + error.message);
                            },
                        });
                    } else {
                        // If no gameId, create a new game
                        this.gameFacade.gameService.createGame(game).subscribe({
                            next: () => {
                                window.alert('Le jeu a été enregistré avec succès.');
                                this.router.navigate(['/admin-page']); // Navigate to admin view
                            },
                            error: (error) => {
                                window.alert("Échec de l'enregistrement du jeu: " + error.message);
                            },
                        });
                    }
                })
                .catch((error) => {
                    window.alert("Erreur lors de la création de l'image composite: " + error.message);
                });
        } else {
            window.alert('Validation failed');
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
        this.gameFacade.gridService.resetGrid();
        this.objectContainer.reset();
        this.gameName = '';
        this.gameDescription = '';
    }

    openPopup(): void {
        this.showCreationPopup = true;
    }
}
