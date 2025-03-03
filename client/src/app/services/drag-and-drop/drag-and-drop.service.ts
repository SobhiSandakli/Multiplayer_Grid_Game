import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Cell } from '@app/interfaces/cell.interface';
import { GridService } from '@app/services/grid/grid.service';
import { TileService } from '@app/services/tile/tile.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { OBJECTS_LIST } from 'src/constants/objects-constants';
@Injectable({
    providedIn: 'root',
})
export class DragDropService {
    objectsList = [...OBJECTS_LIST];
    objectsListSubject = new BehaviorSubject(OBJECTS_LIST);
    objectsList$ = this.objectsListSubject.asObservable();
    isCountMax: boolean = false;
    private isSnackBarDisplayed = false;
    private cell: Cell = { row: 0, col: 0, tile: '', object: '', isOccuped: false };

    constructor(
        private gridService: GridService,
        private tileService: TileService,
        private snackBar: MatSnackBar,
    ) {}

    drop(event: CdkDragDrop<unknown[]>, index: number): void {
        const isDropZoneValid: boolean = this.isDropZoneValid(event.event.target as Element);
        if (isDropZoneValid) {
            this.gridService.addObjectToTile(this.cell.row, this.cell.col, event.item.data);
            this.decrementObjectCounter(index);
            this.compareObjectsCountWithCountMax();
        }
    }

    compareObjectsCountWithCountMax() {
        let totalCount = 0;
        const countMax = this.gridService.getCounterByGridSize(this.gridService.gridSize);
        for (const object of this.objectsList) {
            if (object.name === 'Started Points' || object.name === 'Flag') {
                continue;
            } else {
                if (object.name === 'Random Items') {
                    totalCount = totalCount + (countMax - object.count);
                } else {
                    if (object.count === 0) {
                        totalCount++;
                    }
                }
            }
        }
        this.setDragAndDropToTrueIfCountMax(totalCount, countMax);
    }

    dropObjectBetweenCase(event: CdkDragDrop<{ image: string; row: number; col: number }>, element: Element): void {
        const isDropZoneValid: boolean = this.isDropZoneValid(event.event.target as Element);
        const { row: previousRow, col: previousCol, image: objectToMove } = event.item.data;
        const { row: currentRow, col: currentCol } = event.container.data;
        if (objectToMove && isDropZoneValid) {
            this.tileService.removeObjectFromTile(previousRow, previousCol, objectToMove);
            this.tileService.addObjectToTile(currentRow, currentCol, objectToMove);
        }
        if (element.classList.contains('drop-zone2') || objectToMove.isDragAndDrop) {
            this.tileService.removeObjectFromTile(currentRow, currentCol, objectToMove);
            this.incrementObjectCounter(objectToMove);
            this.compareObjectsCountWithCountMax();
        }
    }

    isDropZoneValid(element: Element | null): boolean {
        while (element) {
            if (element.classList.contains('drop-zone')) {
                const row = (this.cell.row = parseInt(element.id.split(',')[0], 10));
                const col = (this.cell.col = parseInt(element.id.split(',')[1], 10));

                if (row >= 0 && col >= 0 && !this.gridService.gridTiles[col][row].isOccuped && !this.isDoorOrWallTile(element)) {
                    this.cell.object = element.id.split(',')[2] as string;
                    return true;
                } else return false;
            }

            if (element.classList.contains('drop-zone2')) {
                return true;
            }

            element = element.parentElement;
        }
        return false;
    }

    incrementObjectCounter(objectToMove: string): void {
        for (const object of this.objectsList) {
            if (object.link === objectToMove) {
                object.isDragAndDrop = false;
                if (object.count !== undefined) {
                    object.count += 1;
                }
            }
        }
    }
    decrementObjectCounter(index: number): boolean {
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

    isDoorOrWallTile(element: Element | null): boolean {
        while (element) {
            if (element.classList.contains('drop-zone')) {
                const row = (this.cell.row = parseInt(element.id.split(',')[0], 10));
                const col = (this.cell.col = parseInt(element.id.split(',')[1], 10));
                if (
                    this.gridService.gridTiles[col][row].images[0] === 'assets/tiles/Door-Open.png' ||
                    this.gridService.gridTiles[col][row].images[0] === 'assets/tiles/Door.png' ||
                    this.gridService.gridTiles[col][row].images[0] === 'assets/tiles/Wall.png'
                ) {
                    return true;
                } else return false;
            }
            element = element.parentElement;
        }
        return false;
    }
    private setDragAndDropToTrueIfCountMax(totalCount: number, countMax: number): void {
        if (totalCount >= countMax) {
            this.isCountMax = true;
            for (const object of this.objectsList) {
                if ((object.name === 'Started Points' || object.name === 'Flag') && object.count === 0) {
                    object.isDragAndDrop = true;
                } else if (object.name === 'Started Points' || object.name === 'Flag') {
                    object.isDragAndDrop = false;
                } else {
                    object.isDragAndDrop = true;
                }
            }
            if (!this.isSnackBarDisplayed) {
                this.openSnackBar("Vous avez atteint le nombre maximum d'objets.");
                this.isSnackBarDisplayed = true;
            }
        } else if (this.isCountMax) {
            this.setDragAndDropToFalse();
            this.isSnackBarDisplayed = false;
        }
    }

    private openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: ['custom-snackbar'],
        });
    }

    private setDragAndDropToFalse(): void {
        this.isCountMax = false;
        for (const object of this.objectsList) {
            if (object.count >= 1) {
                object.isDragAndDrop = false;
            }
        }
    }
}
