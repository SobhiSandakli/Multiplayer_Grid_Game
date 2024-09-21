import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { GridService } from '@app/services/grid.service';

@Component({
    selector: 'app-grid',
    standalone: true,
    imports: [CommonModule, MatGridListModule, DragDropModule],
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss'],
})
export class GridComponent implements OnInit {
    @Input() gridSize: number = 10;

    gridTiles: { images: string[] }[][] = [];
    defaultImage = 'assets/grass.png';

    constructor(private gridService: GridService) {}
    ngOnInit() {
        this.gridService.generateGrid(this.gridSize, this.defaultImage);
        this.gridTiles = this.gridService.getGridTiles();
        console.log('Grille générée:', this.gridTiles);
    }

    // updateGrid() {
    // this.gridCols = this.gridSize; // Définit le nombre de colonnes selon la taille de la grille
    //this.gridTiles = Array(this.gridSize * this.gridSize).fill(0); // Crée la grille
    //}

    // Gestion du drop dans la grille
    onDrop(event: CdkDragDrop<any>) {
        const draggedItem = event.item.data; // Objet déplacé
        const targetTile = event.container.data; // Récupérer la tuile cible

        // Vérifier que targetTile contient les indices de ligne et de colonne
        if (targetTile && targetTile.row !== undefined && targetTile.col !== undefined) {
            const rowIndex = targetTile.row;
            const colIndex = targetTile.col;

            // Ajouter l'image dans la tuile
            this.gridService.addImageToTile(rowIndex, colIndex, draggedItem.link);
        }
    }
}
