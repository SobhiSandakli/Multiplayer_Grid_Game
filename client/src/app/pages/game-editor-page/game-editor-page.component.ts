import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { TileComponent } from '@app/components/tile/tile.component';

@Component({
    selector: 'app-game-editor-page',
    standalone: true,
    imports: [CommonModule, ObjectContainerComponent, TileComponent],
    templateUrl: './game-editor-page.component.html',
    styleUrl: './game-editor-page.component.scss',
})
export class GameEditorPageComponent implements OnInit {
    rows: number = 4; // Nombre de lignes
    cols: number = 4; // Nombre de colonnes
    grid: number[] = []; // Tableau pour les cellules de la grille

    ngOnInit(): void {
        this.generateGrid();
    }

    generateGrid(): void {
        const totalCells = this.rows * this.cols;
        this.grid = Array.from({ length: totalCells }, (_, index) => index + 1);
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
