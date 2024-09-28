import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { ConfirmationPopupComponent } from '@app/components/confirmation-popup/confirmation-popup.component';
import { GridComponent } from '@app/components/grid/grid.component';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { TileComponent } from '@app/components/tile/tile.component';
import { GridService } from '@app/services/grid.service';
@Component({
    selector: 'app-game-editor-page',
    standalone: true,
    imports: [CommonModule, GridComponent, ObjectContainerComponent, TileComponent, ConfirmationPopupComponent],
    templateUrl: './game-editor-page.component.html',
    styleUrl: './game-editor-page.component.scss',
})
export class GameEditorPageComponent {
    readonly maxLengthName: number = 30;
    readonly maxLengthDescription: number = 200;

    isNameExceeded = false;
    isDescriptionExceeded = false;

    @ViewChild(ObjectContainerComponent) objectContainer: ObjectContainerComponent;
    showCreationPopup = false;

    constructor(private gridService: GridService) {}
    onNameInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.isNameExceeded = textarea.value.length > this.maxLengthName;
    }

    onDescriptionInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.isDescriptionExceeded = textarea.value.length > this.maxLengthDescription;
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
