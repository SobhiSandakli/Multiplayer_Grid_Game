import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { GridService } from '@app/services/grid.service';
import { TileService } from '@app/services/tile.service';

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
    activeTile: string = 'base';  
    
    constructor(private gridService: GridService, private tileService: TileService) {}

    ngOnInit() {
        this.gridService.generateGrid(this.gridSize, 'assets/grass.png');  
        this.gridTiles = this.gridService.getGridTiles();
        this.tileService.selectedTile$.subscribe((tile) => {
            this.activeTile = tile;
        });
    }

    applyTile(row: number, col: number) {
        const currentTile = this.gridTiles[row][col].images[0]; 
        if (this.activeTile === 'door' && (currentTile.includes('Door') || currentTile.includes('DoorOpen'))) {
            this.ReverseDoorState(row, col); 
        } 
        else if (currentTile !== this.activeTile) {
            this.gridService.replaceImageOnTile(row, col, this.tileService.getTileImage(this.activeTile));
        }
    }

    removeTile(row: number, col: number) {
        this.gridService.replaceWithDefault(row, col, 'assets/grass.png');
    }

    ReverseDoorState(row: number, col: number) {
        const currentTile = this.gridTiles[row][col].images[0];
        if (currentTile === 'assets/tiles/Door.png') {
            this.gridService.replaceImageOnTile(row, col, 'assets/tiles/DoorOpen.png');
        } 
        else if (currentTile === 'assets/tiles/DoorOpen.png') {
            this.gridService.replaceImageOnTile(row, col, 'assets/tiles/Door.png');
        }
    }


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
