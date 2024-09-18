import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GridComponent } from '@app/components/grid/grid.component';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { TileComponent } from '@app/components/tile/tile.component';

@Component({
    selector: 'app-game-editor-page',
    standalone: true,
    imports: [CommonModule, GridComponent, ObjectContainerComponent],
    templateUrl: './game-editor-page.component.html',
    styleUrl: './game-editor-page.component.scss',
})
export class GameEditorPageComponent {
    selectedTool: string = 'base';
    selectTool(tool: string): void {
        this.selectedTool = tool;
    }

    game = { name: '', description: '' };

    saveGame(): void {
        console.log('Game saved:', this.game);
    }

    resetGame(): void {
        this.game.name = '';
        this.game.description = '';
        console.log('Game reset to default');
    }

    updateGameName(event: any): void {
        this.game.name = event.target.value;
    }

    updateGameDescription(event: any): void {
        this.game.description = event.target.value;
    }
}
