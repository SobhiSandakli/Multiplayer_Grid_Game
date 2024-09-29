import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Injectable } from '@angular/core';
import { objectsList } from '@app/components/object-container/objects-list';
import { Tile } from '@app/interfaces/tile.interface';
import { BehaviorSubject } from 'rxjs';
import { GridService } from './grid.service';

@Injectable({
    providedIn: 'root',
})
export class DragDropService {
    private dragInProgressSubject = new BehaviorSubject<boolean>(false);
    private objectsListSubject = new BehaviorSubject<any[]>(objectsList);
    private tile: Tile;
    private objectsList = objectsList;
    startedPointsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Started Points');
    randomItemsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Random Items');
    // Observable pour surveiller le statut du drag-and-drop

    constructor(private gridService: GridService) {
        this.tile = { x: 0, y: 0, image: [], isOccuped: false };
    }

    // Observable pour surveiller le statut du drag-and-drop
    dragInProgress$ = this.dragInProgressSubject.asObservable();
    objects$ = this.objectsListSubject.asObservable();
    previousCoordinates: { row: number | null; column: number | null } = { row: null, column: null };

    // Démarrer le drag-and-drop
    startDrag(): void {
        //this.previousCoordinates = { row: rowIndex, column: cellIndex };
        this.dragInProgressSubject.next(true);
    }

    // Annuler le drag-and-drop
    cancelDrag() {
        this.dragInProgressSubject.next(false);
    }

    drop(event: CdkDragDrop<unknown[]>, index: number): void {
        const validDropZone: boolean = this.isDropZoneValid(event.event.target as Element);
        if (validDropZone) {
            this.gridService.addObjectToTile(this.tile.x, this.tile.y, event.item.data);
            this.tile.isOccuped = true;

            if (this.objectsList[index] === this.objectsList[this.randomItemsIndexInList]) {
                if (this.counter(index)) {
                    return;
                }
            }

            if (this.objectsList[index] === this.objectsList[this.startedPointsIndexInList]) {
                if (this.counter(index)) {
                    return;
                }
            }

            this.objectsList[index].isDragAndDrop = true;
        }
    }

    dropGrid(event: CdkDragDrop<unknown[]>): void {
        const validDropZone: boolean = this.isDropZoneValid(event.event.target as Element);
        if (validDropZone) {
            this.gridService.addObjectToTile(this.tile.x, this.tile.y, event.item.data);
            this.tile.isOccuped = true;
        }
    }
    isDropZoneValid(element: Element | null): boolean {
        while (element) {
            if (element.classList.contains('drop-zone')) {
                const x = (this.tile.x = parseInt(element.id.split(',')[0], 10));
                const y = (this.tile.y = parseInt(element.id.split(',')[1], 10));

                if (this.tile.image.length >= 2) {
                    this.tile.image = [];
                }
                if (x >= 0 && y >= 0 && !this.gridService.getGridTiles()[y][x].isOccuped) {
                    this.tile.image.push(element.id.split(',')[2] as string);
                    return true;
                } else return false;
            }
            element = element.parentElement;
        }
        return false;
    }

    counter(index: number): boolean {
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

    incrementCounter(index: number): void {
        const object = this.objectsList[index];
        if (object && typeof object.count === 'number') {
            object.count += 1;
            this.objectsList[index].isDragAndDrop = false;
        }
    }
}
