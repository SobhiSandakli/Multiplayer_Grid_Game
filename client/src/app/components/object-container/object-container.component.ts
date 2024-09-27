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
    startedPointsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Started Points');
    randomItemsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Random Items');
    tile: Tile;

    private maxCounterSmall: number = 2;
    private maxCounterMedium: number = 4;
    private maxCounterLarge: number = 6;

    constructor(private gridService: GridService) {
        this.tile = { x: 0, y: 0, image: [], isOccuped: false };
    }

    ngOnInit() {
        this.objectsList[this.randomItemsIndexInList].count = this.getNumberByGridSize(this.gridSize);
        this.objectsList[this.startedPointsIndexInList].count = this.getNumberByGridSize(this.gridSize);
    }

    drop(event: CdkDragDrop<unknown[]>, index: number): void {
        const validDropZone: boolean = this.isDropZoneValid(event.event.target as Element);
        if (validDropZone) {
            this.gridService.addObjectToTile(this.tile.x, this.tile.y, event.item.data);
            this.tile.isOccuped = true;

            if (this.objectsList[index] === this.objectsList[this.randomItemsIndexInList]) {
                if (this.counter(index)) {
                    return;
                }
            }

            if (this.objectsList[index] === this.objectsList[this.startedPointsIndexInList]) {
                if (this.counter(index)) {
                    return;
                }
            }

            this.objectsList[index].isDragAndDrop = true;
        }
    }

    isDropZoneValid(element: Element | null): boolean {
        while (element) {
            if (element.classList.contains('drop-zone')) {
                const x = (this.tile.x = parseInt(element.id.split(',')[0], 10));
                const y = (this.tile.y = parseInt(element.id.split(',')[1], 10));

                if (this.tile.image.length >= 2) {
                    this.tile.image = [];
                }
                if (x >= 0 && y >= 0 && !this.gridService.getGridTiles()[y][x].isOccuped) {
                    this.tile.image.push(element.id.split(',')[2] as string);
                    return true;
                } else return false;
            }
            element = element.parentElement;
        }
        return false;
    }

    getNumberByGridSize(size: GridSize): number {
        if (size === GridSize.Small) {
            return this.maxCounterSmall;
        } else if (size === GridSize.Medium) {
            return this.maxCounterMedium;
        } else if (size === GridSize.Large) {
            return this.maxCounterLarge;
        } else return 0;
    }

    counter(index: number): boolean {
        const object = this.objectsList[index];

        if (object && typeof object.count === 'number' && object.count > 1) {
            object.count -= 1;
            return true;
        } else if (object.count === 1) {
            object.count = 0;
            this.objectsList[index].isDragAndDrop = true;
            return true;
        } else return false;
    }
}
