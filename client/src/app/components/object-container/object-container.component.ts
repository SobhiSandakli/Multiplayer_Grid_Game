import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { Game } from '@app/interfaces/game-model.interface';
import { DragDropService } from '@app/services/drag-and-drop/drag-and-drop.service';
import { GridService } from '@app/services/grid/grid.service';
import * as objectConstant from 'src/constants/objects-constants';
import { GridSize, ObjectsImages } from 'src/constants/validate-constants';

@Component({
    selector: 'app-object-container',
    templateUrl: './object-container.component.html',
    styleUrls: ['./object-container.component.scss'],
})
export class ObjectContainerComponent implements OnInit {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Input() gameMode: string;
    objectsList: any[];
    startedPointsIndexInList: number;
    randomItemsIndexInList: number;

    constructor(
        private dragDropService: DragDropService,
        private gridService: GridService,
    ) {}

    ngOnInit() {
        if (this.gameMode !== 'Capture the Flag') {
            this.objectsList = this.dragDropService.objectsList;
            const flagIndex = this.objectsList.findIndex((obj) => obj.name === 'Flag');
            if (flagIndex !== -1) {
                this.objectsList.splice(flagIndex, 1);
            }
        } else {
            this.objectsList = this.dragDropService.objectsList;
        }
        this.startedPointsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Started Points');
        this.randomItemsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Random Items');

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

    setContainerObjects(game: Game): void {
        let count = 0;
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let row = 0; row < game.grid.length; row++) {
            // eslint-disable-next-line @typescript-eslint/prefer-for-of
            for (let col = 0; col < game.grid[row].length; col++) {
                const cell = game.grid[row][col];
                count = this.setCounterAndDragAndDrop(cell, count);
            }
        }
        const defaultCount = this.getCounterByGridSize(parseInt(game.size.split('x')[0], 10));
        this.calculateCounterForRandomItems(count, defaultCount);
    }

    private setCounterAndDragAndDrop(cell: { images: string[]; isOccuped: boolean }, count: number): number {
        if (cell.isOccuped) {
            count = this.setCounterForSaveGame(cell, count);
            if (!cell.images.includes(ObjectsImages.RandomItems)) {
                this.objectsList.find((object) => object.link === cell.images[1]).isDragAndDrop = true;
            }
        }
        return count;
    }

    private calculateCounterForRandomItems(count: number, defaultCount: number): void {
        if (defaultCount === count) {
            this.objectsList[this.randomItemsIndexInList].isDragAndDrop = true;
            this.objectsList[this.randomItemsIndexInList].count = 0;
        } else {
            const displayCount = defaultCount - count;
            this.objectsList[this.randomItemsIndexInList].count = displayCount;
        }
    }
    private setCounterForSaveGame(cell: { images: string[]; isOccuped: boolean }, count: number): number {
        if (cell.images.includes(ObjectsImages.StartPoint)) {
            this.objectsList[this.startedPointsIndexInList].count = 0; // because when we save grid, startedPoints count is necessary equals to zero
        }
        if (cell.images.includes(ObjectsImages.RandomItems)) {
            count++;
        }
        return count;
    }

    private getCounterByGridSize(size: number): number {
        if (size === GridSize.Small) {
            return objectConstant.MAX_COUNTER_SMALL_GRID;
        } else if (size === GridSize.Medium) {
            return objectConstant.MAX_COUNTER_MEDIUM_GRID;
        } else if (size === GridSize.Large) {
            return objectConstant.MAX_COUNTER_LARGE_GRID;
        } else return 0;
    }
}
