import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { Game } from '@app/interfaces/game-model.interface';
import { DragDropService } from '@app/services/drag-and-drop/drag-and-drop.service';
import { GridService } from '@app/services/grid/grid.service';
import { OBJECTS_LIST } from 'src/constants/objects-constants';
import { ObjectsImages } from 'src/constants/validate-constants';

@Component({
    selector: 'app-object-container',
    templateUrl: './object-container.component.html',
    styleUrls: ['./object-container.component.scss'],
})
export class ObjectContainerComponent implements OnInit {
    @Input() gameMode: string;
    objectsList = [...OBJECTS_LIST];
    startedPointsIndexInList: number;
    randomItemsIndexInList: number;

    constructor(
        private dragDropService: DragDropService,
        private gridService: GridService,
    ) {}

    ngOnInit() {
        if (this.gameMode !== 'Capture the Flag') {
            const flagIndex = this.objectsList.findIndex((obj) => obj.name === 'Flag');
            if (flagIndex !== -1) {
                this.objectsList.splice(flagIndex, 1);
            }
        }
        this.startedPointsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Started Points');
        this.randomItemsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Random Items');

        this.resetDefaultContainer();
    }

    drop(event: CdkDragDrop<unknown[]>, index: number): void {
        this.dragDropService.drop(event, index);
    }

    resetDefaultContainer(): void {
        for (const object of this.objectsList) {
            object.isDragAndDrop = false;
            object.count = 1;
        }
        this.objectsList[this.startedPointsIndexInList].count = this.gridService.getCounterByGridSize(this.gridService.gridSize);
        this.objectsList[this.randomItemsIndexInList].count = this.gridService.getCounterByGridSize(this.gridService.gridSize);
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
        const defaultCount = this.gridService.getCounterByGridSize(parseInt(game.size.split('x')[0], 10));
        this.calculateCounterForRandomItems(count, defaultCount);
    }

    private setCounterAndDragAndDrop(cell: { images: string[]; isOccuped: boolean }, count: number): number {
        if (cell.isOccuped) {
            count = this.setCounterForSaveGame(cell, count);
            if (!cell.images.includes(ObjectsImages.RandomItems)) {
                const foundObject = this.objectsList.find((object) => object.link === cell.images[1]);
                if (foundObject) {
                    foundObject.isDragAndDrop = true;
                }
                const foundObject_ = this.objectsList.find((object) => object.link === cell.images[1]);
                if (foundObject_) {
                    foundObject_.count = 0;
                }
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
}
