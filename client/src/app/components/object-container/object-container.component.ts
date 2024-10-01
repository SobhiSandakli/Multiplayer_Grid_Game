import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { GridSize } from '@app/classes/grid-size.enum';
import { DragDropService } from '@app/services/drag-and-drop.service';
import { GridService } from '@app/services/grid.service';
import { OBJECTS_LIST } from './objects-list';
@Component({
    selector: 'app-object-container',
    templateUrl: './object-container.component.html',
    styleUrls: ['./object-container.component.scss'],
})
export class ObjectContainerComponent implements OnInit {
    readonly OBJECTS_LIST = OBJECTS_LIST;
    startedPointsIndexInList = this.OBJECTS_LIST.findIndex((obj) => obj.name === 'Started Points');
    randomItemsIndexInList = this.OBJECTS_LIST.findIndex((obj) => obj.name === 'Random Items');

    private readonly MAX_COUNTER_SMALL: number = 2;
    private readonly MAX_COUNTER_MEDIUM: number = 4;
    private readonly MAX_COUNTER_LARGE: number = 6;

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
        this.OBJECTS_LIST[this.startedPointsIndexInList].count = this.getCounterByGridSize(this.gridService.gridSize);
        this.OBJECTS_LIST[this.startedPointsIndexInList].isDragAndDrop = false; // it's just for sprint 1 because for sprint 2 isDragAndDrop attribute will be false for all objects
    }

    private getCounterByGridSize(size: number): number {
        if (size === GridSize.Small) {
            return this.MAX_COUNTER_SMALL;
        } else if (size === GridSize.Medium) {
            return this.MAX_COUNTER_MEDIUM;
        } else if (size === GridSize.Large) {
            return this.MAX_COUNTER_LARGE;
        } else return 0;
    }
}
