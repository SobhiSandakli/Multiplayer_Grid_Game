import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { GridSize } from '@app/enums/grid-size.enum';
import { DragDropService } from '@app/services/drag-and-drop.service';
import { GridService } from '@app/services/grid.service';
import { OBJECTS_LIST } from './objects-list';
@Component({
    selector: 'app-object-container',
    templateUrl: './object-container.component.html',
    styleUrls: ['./object-container.component.scss'],
})
export class ObjectContainerComponent implements OnInit {
    objectsList = OBJECTS_LIST;
    startedPointsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Started Points');
    randomItemsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Random Items');

    private readonly maxCounterSmall: number = 2;
    private readonly maxCounterMedium: number = 4;
    private readonly maxCounterLarge: number = 6;

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
        this.objectsList[this.startedPointsIndexInList].isDragAndDrop = false; // it's just for sprint 1 because for sprint 2 isDragAndDrop attribute will be false for all objects
    }

    getCounterByGridSize(size: number): number {
        if (size === GridSize.Small) {
            return this.maxCounterSmall;
        } else if (size === GridSize.Medium) {
            return this.maxCounterMedium;
        } else if (size === GridSize.Large) {
            return this.maxCounterLarge;
        } else return 0;
    }
}
