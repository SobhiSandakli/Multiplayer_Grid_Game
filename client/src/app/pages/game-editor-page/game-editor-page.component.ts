import { Component } from '@angular/core';
import { ValidateGameService } from '@app/services/validateGame.service';
import { GridService } from '@app/services/grid.service';
import { ImageService } from '@app/services/image.service';
import { GameService } from '@app/services/game.service';
import { CommonModule } from '@angular/common';
import { GridComponent } from '@app/components/grid/grid.component';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { TileComponent } from '@app/components/tile/tile.component';
import { Game } from '@app/game.model';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-game-editor-page',
    standalone: true,
    imports: [CommonModule, GridComponent, ObjectContainerComponent, TileComponent, FormsModule],
    templateUrl: './game-editor-page.component.html',
    styleUrls: ['./game-editor-page.component.scss'],
})
export class GameEditorPageComponent {
    isNameExceeded = false;
    isDescriptionExceeded = false;
    readonly maxLengthName: number = 30;
    readonly maxLengthDescription: number = 200;
    gameName: string = ''; // Initialize with empty string or a default value
    gameDescription: string = ''; // Initialize with empty string or a default value

    constructor(
        private validateGameService: ValidateGameService,
        private gridService: GridService,
        private imageService: ImageService,
        private gameService: GameService,
        private router: Router,
    ) {}

    onNameInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.isNameExceeded = textarea.value.length > this.maxLengthName;
    }

    onDescriptionInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.isDescriptionExceeded = textarea.value.length > this.maxLengthDescription;
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
}
