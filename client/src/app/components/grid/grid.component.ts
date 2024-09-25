import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { GridService } from '@app/services/grid.service';

export interface Tile {
    tileType: string; // url
    item: string; // url
}

export interface Coord {
    x: number;
    y: number;
}

@Component({
    selector: 'app-grid',
    standalone: true,
    imports: [CommonModule, MatGridListModule, DragDropModule, CdkDrag],
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss'],
})
export class GridComponent implements OnInit {
    @Input() gridSize: number = 10;

    coord: Coord = { x: 0, y: 0 };
    gridTiles: { images: string[] }[][] = [];
    defaultImage = 'assets/grass.png';

    constructor(
        private gridService: GridService, //private dragDropService: DragDropService,
    ) {}

    ngOnInit() {
        this.gridService.generateGrid(this.gridSize, this.defaultImage);
        this.gridTiles = this.gridService.getGridTiles();
        console.log('Grille générée:', this.gridTiles);
    }
    onRightClick(element: HTMLElement, event: MouseEvent) {
        console.log('Clic droit:');
        event.preventDefault(); // Empêche le menu contextuel de s'afficher
        //console.log(element);
        //element.style.transform = 'none';
    }
}
