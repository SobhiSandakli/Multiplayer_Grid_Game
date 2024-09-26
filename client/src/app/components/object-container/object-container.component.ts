import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { GridSize } from '../../classes/grid-size.enum';
import { Tile } from '../../interfaces/tile.interface';
import { GridService } from '../../services/grid.service';
import { objectsList } from './objects-list';

@Component({
    selector: 'app-object-container',
    standalone: true,
    templateUrl: './object-container.component.html',
    styleUrls: ['./object-container.component.scss'],
    imports: [CommonModule, DragDropModule],
})
export class ObjectContainerComponent implements OnInit {
    gridSize: GridSize = GridSize.Large; // for test
    displayedNumber: number;
    objectsList = objectsList;

    tile: Tile;
    constructor(private gridService: GridService) {
        this.tile = { x: 0, y: 0, image: [] };
    }

    drop(event: CdkDragDrop<any[]>, index: number): void {
        const validDropZone: Tile = this.isDropZoneValid(event.event.target as Element);
        if (validDropZone.x >= 0 && validDropZone.y >= 0) {
            validDropZone.image.push(event.item.data);
            this.gridService.addImageToTile(validDropZone.x, validDropZone.y, event.item.data);
            this.objectsList[index].isDragAndDrop = true;
            console.log('Fin du glissé:', validDropZone);
        } else {
            console.log('Déplacement non valide:', event.item.data);
        }
    }

    isDropZoneValid(element: Element | null): Tile {
        while (element) {
            if (element.classList.contains('drop-zone')) {
                this.tile.x = parseInt(element.id.split(',')[0]);
                this.tile.y = parseInt(element.id.split(',')[1]);
                if (this.tile.image.length >= 2) {
                    this.tile.image = [];
                }
                this.tile.image.push(element.id.split(',')[2] as string);

                return { x: this.tile.x, y: this.tile.y, image: this.tile.image };
            }
            element = element.parentElement;
        }
        return { x: -1, y: -1, image: [] };
    }

    ngOnInit() {
        this.displayedNumber = this.getNumberByGridSize(this.gridSize);
    }

    getNumberByGridSize(size: GridSize): number {
        if (size === GridSize.Small) {
            return 2;
        } else if (size === GridSize.Medium) {
            return 4;
        } else if (size === GridSize.Large) {
            return 6;
        } else return 0;
    }
}
