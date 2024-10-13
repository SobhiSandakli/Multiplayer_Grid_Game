import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { GridSize } from '@app/enums/grid-size.enum';
import { DragDropService } from '@app/services/drag-and-drop.service';
import { GridService } from '@app/services/grid.service';
import * as OBJECT_CONSTANTS from 'src/constants/objects-constants';
@Component({
    selector: 'app-object-container',
    templateUrl: './object-container.component.html',
    styleUrls: ['./object-container.component.scss'],
})
export class ObjectContainerComponent implements OnInit {
    objectsList = this.dragDropService.objectsList;
    startedPointsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Started Points');
    randomItemsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Random Items');

    constructor(
        private dragDropService: DragDropService,
        private gridService: GridService,
    ) {}

    ngOnInit() {
        this.resetDefaultContainer();
    }

    drop(event: CdkDragDrop<unknown[]>, index: number): void {
        this.dragDropService.drop(event, index);
    }

    resetDefaultContainer(): void {
        this.objectsList[this.startedPointsIndexInList].count = this.getCounterByGridSize(this.gridService.gridSize);
        this.objectsList[this.randomItemsIndexInList].count = this.getCounterByGridSize(this.gridService.gridSize);
        for (const object of this.objectsList) {
            object.isDragAndDrop = false;
        }
    }

    getCounterByGridSize(size: number): number {
        if (size === GridSize.Small) {
            return OBJECT_CONSTANTS.MAX_COUNTER_SMALL_GRID;
        } else if (size === GridSize.Medium) {
            return OBJECT_CONSTANTS.MAX_COUNTER_MEDIUM_GRID;
        } else if (size === GridSize.Large) {
            return OBJECT_CONSTANTS.MAX_COUNTER_LARGE_GRID;
        } else return 0;
    }
}
