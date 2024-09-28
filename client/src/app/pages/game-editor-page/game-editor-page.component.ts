import { Component } from '@angular/core';
import { ValidateGameService } from '@app/services/validateGame.service';
import { GridService } from '@app/services/grid.service';
import { CommonModule } from '@angular/common';
import { GridComponent } from '@app/components/grid/grid.component';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { TileComponent } from '@app/components/tile/tile.component';

@Component({
    selector: 'app-game-editor-page',
    standalone: true,
    imports: [CommonModule, GridComponent, ObjectContainerComponent, TileComponent],
    templateUrl: './game-editor-page.component.html',
    styleUrls: ['./game-editor-page.component.scss'],
})
export class GameEditorPageComponent {
    isNameExceeded = false;
    isDescriptionExceeded = false;
    readonly maxLengthName: number = 30;
    readonly maxLengthDescription: number = 200;

    constructor(
        private validateGameService: ValidateGameService,
        private gridService: GridService,
    ) {}

    onNameInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.isNameExceeded = textarea.value.length > this.maxLengthName;
    }

    onDescriptionInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.isDescriptionExceeded = textarea.value.length > this.maxLengthDescription;
    }

    // Method called when the "Sauvegarder" button is clicked
    onSave(): void {
        const gridArray = this.gridService.getGridTiles(); // Get the grid data from GridService
        // Validate all conditions using the ValidateGameService
        if (this.validateGameService.validateAll(gridArray)) {
            // Logic to save the game (e.g., send the data to the backend)
        } else {
            // Handle validation errors
        }
    }
}
