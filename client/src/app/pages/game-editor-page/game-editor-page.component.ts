import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GridComponent } from '@app/components/grid/grid.component';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { AppMaterialModule } from '@app/modules/material.module';

import { TileComponent } from '@app/components/tile/tile.component';
import { Game } from '@app/game.model';
import { GameService } from '@app/services/game.service';
import { GridService } from '@app/services/grid.service';
import { ImageService } from '@app/services/image.service';
import { ValidateGameService } from '@app/services/validateGame.service';
import {Router} from '@angular/router';

@Component({
    selector: 'app-game-editor-page',
    standalone: true,
    imports: [CommonModule, GridComponent, ObjectContainerComponent, TileComponent, FormsModule, AppMaterialModule],
    templateUrl: './game-editor-page.component.html',
    styleUrls: ['./game-editor-page.component.scss'],
})
export class GameEditorPageComponent implements OnInit {
    readonly maxLengthName: number = 30;
    readonly maxLengthDescription: number = 200;

    isNameExceeded = false;
    isDescriptionExceeded = false;

    gameName: string = ''; // Initialize with empty string or a default value
    gameDescription: string = ''; // Initialize with empty string or a default value
    
    constructor(
        private route: ActivatedRoute,
        private gameService: GameService,
        private validateGameService: ValidateGameService,
        private gridService: GridService,
        private imageService: ImageService,
        private router : Router,
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
        this.gameService.fetchGame(gameId).subscribe((game: Game) => {
            this.gameName = game.name;
            this.gameDescription = game.description;
            this.gridService.setGrid(game.grid);
        });
    }
    @ViewChild(ObjectContainerComponent) objectContainer: ObjectContainerComponent;
    showCreationPopup = false;

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
        const gridArray = this.gridService.getGridTiles();
        if (!this.gameName || !this.gameDescription) {
            window.alert('Veuillez remplir le nom et la description du jeu.');
            return;
        }

        if (this.validateGameService.validateAll(gridArray)) {
            this.imageService
                .createCompositeImageAsBase64(gridArray)
                .then((base64Image) => {
                    const game: Game = {
                        name: this.gameName,
                        description: this.gameDescription,
                        size: gridArray.length + 'x' + gridArray[0].length,
                        mode: 'Classique', //TO BE CHANGED IN SPRINT 2
                        image: base64Image,
                        date: new Date(),
                        visibility: false,
                        grid: gridArray,
                        _id: '',
                    };

                    this.gameService.createGame(game).subscribe({
                        next: () => {
                            console.log('Game successfully created!');
                            window.alert('Le jeu a été enregistré avec succès.');
                            this.router.navigate(['/admin-page']); // Navigate to admin view
                        },
                        error: (error) => {
                            window.alert("Échec de l'enregistrement du jeu: " + error.message);
                        },
                    });
                })
                .catch((error) => {
                    console.error('Error creating composite image:', error);
                    window.alert("Erreur lors de la création de l'image composite: " + error.message);
                });
        } else {
            console.error('Validation failed');
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
        this.gridService.resetGrid();
        this.objectContainer.reset();
    }

    openPopup(): void {
        this.showCreationPopup = true;
    }
}
