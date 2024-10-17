import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Injectable } from '@angular/core';
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
    private cell: Cell = { row: 0, col: 0, tile: '', object: '', isOccuped: false };
    private startedPointsIndexInList: number;
    private randomItemsIndexInList: number;

    constructor(
        private gridService: GridService,
        private tileService: TileService,
    ) {
        this.randomItemsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Random Items');
        this.startedPointsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Started Points');
    }
    updateObjectList(newList: any[]): void {
        this.objectsListSubject.next(newList);
    }
    drop(event: CdkDragDrop<unknown[]>, index: number): void {
        const isDropZoneValid: boolean = this.isDropZoneValid(event.event.target as Element);
        if (isDropZoneValid) {
            this.gridService.addObjectToTile(this.cell.row, this.cell.col, event.item.data);

            if (this.isSpecialObject(index)) {
                if (this.decrementObjectCounter(index)) {
                    return;
                }
            }

            this.objectsList[index].isDragAndDrop = true;
        }
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
    private isSpecialObject(index: number): boolean {
        return index === this.randomItemsIndexInList || index === this.startedPointsIndexInList;
    }
}
