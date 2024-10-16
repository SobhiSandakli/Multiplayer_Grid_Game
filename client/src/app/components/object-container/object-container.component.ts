import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { GridSize } from '@app/enums/grid-size.enum';
import { Game } from '@app/interfaces/game-model.interface';
import { DragDropService } from '@app/services/drag-and-drop/drag-and-drop.service';
import { GridService } from '@app/services/grid/grid.service';
import * as objectConstant from 'src/constants/objects-constants';

@Component({
    selector: 'app-object-container',
    templateUrl: './object-container.component.html',
    styleUrls: ['./object-container.component.scss'],
})
export class ObjectContainerComponent implements OnInit {
    objectsList: any[] = [];
    startedPointsIndexInList: number;
    randomItemsIndexInList: number;

    constructor(
        private dragDropService: DragDropService,
        private gridService: GridService,
    ) {}

    ngOnInit() {
        this.objectsList = this.dragDropService.objectsList;
        if (this.objectsList) {
            this.startedPointsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Started Points');
            this.randomItemsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Random Items');
        }

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

    // À METTRE DANS UN SERVICE POUR LES OBJETS
    setContainerObjects(game: Game): void {
        let count = 0;
        for (let row = 0; row < game.grid.length; row++) {
            for (let col = 0; col < game.grid[row].length; col++) {
                const cell = game.grid[row][col];
                if (cell.isOccuped) {
                    console.log(cell.images.includes('/assets/objects/started-points.png'));
                    console.log(cell.images);
                    if (cell.images.includes('assets/objects/started-points.png')) {
                        this.objectsList[this.startedPointsIndexInList].count = 0; // because when we save grid, startedPoints count is necessary equals to zero
                    }
                    if (cell.images.includes('../../../assets/objects/Random_items.png')) {
                        console.log(cell.images);
                        count++;
                    }
                    if (!cell.images.includes('../../../assets/objects/Random_items.png')) {
                        this.objectsList.find((object) => object.link === cell.images[1]).isDragAndDrop = true;
                    }
                }
            }
        }
        const defaultCount = this.getCounterByGridSize(this.gridService.gridSize);
        if (defaultCount === count) {
            this.objectsList[this.randomItemsIndexInList].isDragAndDrop = true;
            this.objectsList[this.randomItemsIndexInList].count = 0;
        } else {
            const displayCount = defaultCount - count;
            this.objectsList[this.randomItemsIndexInList].count = displayCount;
        }
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
