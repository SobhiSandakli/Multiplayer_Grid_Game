import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { GridSize } from '@app/classes/grid-size.enum';
import { Tile } from '@app/interfaces/tile.interface';
import { DragDropService } from '@app/services/drag-and-drop.service';
import { objectsList } from './objects-list';
@Component({
    selector: 'app-object-container',
    templateUrl: './object-container.component.html',
    styleUrls: ['./object-container.component.scss'],
})
export class ObjectContainerComponent implements OnInit {
    gridSize: GridSize = GridSize.Large; // for test
    displayedNumber: number;
    objectsList = objectsList;
    startedPointsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Started Points');
    randomItemsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Random Items');
    tile: Tile;

    private readonly maxCounterSmall: number = 2;
    private readonly maxCounterMedium: number = 4;
    private readonly maxCounterLarge: number = 6;

    constructor(private dragDropService: DragDropService) {
        this.tile = { x: 0, y: 0, image: [], isOccuped: false };
    }

    ngOnInit() {
        this.reset();
    }

    drop(event: CdkDragDrop<unknown[]>, index: number): void {
        this.dragDropService.drop(event, index);
    }

    reset(): void {
        this.objectsList[this.randomItemsIndexInList].count = this.getNumberByGridSize(this.gridSize);
        this.objectsList[this.startedPointsIndexInList].count = this.getNumberByGridSize(this.gridSize);
        this.objectsList.forEach((object) => (object.isDragAndDrop = false));
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
}
