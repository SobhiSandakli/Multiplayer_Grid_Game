import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GridComponent } from '@app/components/grid/grid.component';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { TileComponent } from '@app/components/tile/tile.component';

@Component({
    selector: 'app-game-editor-page',
    standalone: true,
    imports: [CommonModule, GridComponent, ObjectContainerComponent, TileComponent],
    templateUrl: './game-editor-page.component.html',
    styleUrl: './game-editor-page.component.scss',
})
export class GameEditorPageComponent {
    readonly maxLengthName: number = 30;
    readonly maxLengthDescription: number = 200;

    isNameExceeded = false;
    isDescriptionExceeded = false;

    onNameInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.isNameExceeded = textarea.value.length > this.maxLengthName;
    }

    onDescriptionInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.isDescriptionExceeded = textarea.value.length > this.maxLengthDescription;
    }
}
