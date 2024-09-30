import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { GridSize } from '@app/classes/grid-size.enum';
import { Tile } from '@app/interfaces/tile.interface';
import { DragDropService } from '@app/services/drag-and-drop.service';
import { GridService } from '@app/services/grid.service';
import { objectsList } from './objects-list';
@Component({
    selector: 'app-object-container',
    standalone: true,
    templateUrl: './object-container.component.html',
    styleUrls: ['./object-container.component.scss'],
    imports: [CommonModule, DragDropModule],
})
export class ObjectContainerComponent implements OnInit {
    tile: Tile;
    displayedNumber: number;
    objectsList = objectsList;
    startedPointsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Started Points');
    randomItemsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Random Items');

    private readonly maxCounterSmall: number = 2;
    private readonly maxCounterMedium: number = 4;
    private readonly maxCounterLarge: number = 6;

    constructor(
        private dragDropService: DragDropService,
        private gridService: GridService,
    ) {
        this.tile = { x: 0, y: 0, image: [], isOccuped: false };
    }

    ngOnInit() {
        this.resetDefault();
    }

    drop(event: CdkDragDrop<unknown[]>, index: number): void {
        this.dragDropService.drop(event, index);
    }

    resetDefault(): void {
        this.objectsList[this.randomItemsIndexInList].count = this.getNumberByGridSize(this.gridService.gridSize);
        this.objectsList[this.startedPointsIndexInList].count = this.getNumberByGridSize(this.gridService.gridSize);
        this.objectsList.forEach((object) => (object.isDragAndDrop = false));
    }

    getNumberByGridSize(size: number): number {
        if (size === GridSize.Small) {
            return this.maxCounterSmall;
        } else if (size === GridSize.Medium) {
            return this.maxCounterMedium;
        } else if (size === GridSize.Large) {
            return this.maxCounterLarge;
        } else return 0;
    }
}
