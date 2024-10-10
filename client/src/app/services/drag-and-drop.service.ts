import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Injectable } from '@angular/core';
import { Tile } from '@app/interfaces/tile.interface';
import { OBJECTS_LIST } from 'src/constants/objects-constants';
import { GridService } from './grid.service';
import { TileService } from './tile.service';

@Injectable({
    providedIn: 'root',
})
export class DragDropService {
    tile: Tile;
    objectsList = OBJECTS_LIST;
    startedPointsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Started Points');
    randomItemsIndexInList = this.objectsList.findIndex((obj) => obj.name === 'Random Items');

    constructor(
        private gridService: GridService,
        private tileService: TileService,
    ) {
        this.tile = { x: 0, y: 0, image: [], isOccuped: false };
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

    dropObjectBetweenCase(event: CdkDragDrop<{ image: string; row: number; col: number }>, element: Element): void {
        const { row: previousRow, col: previousCol, image: objectToMove } = event.item.data;
        const { row: currentRow, col: currentCol } = event.container.data;
        console.log(element.classList);
        if (objectToMove) {
            console.log(objectToMove);
            this.tileService.removeObjectFromTile(previousRow, previousCol, objectToMove);
            this.tileService.addObjectToTile(currentRow, currentCol, objectToMove);
            if (element.classList.contains('object-container')) {
                this.tileService.removeObjectFromTile(currentRow, currentCol, objectToMove);
                for (const object of this.objectsList) {
                    if (object.link === objectToMove) {
                        object.isDragAndDrop = false;
                        console.log(object);
                        if (object.count !== undefined) {
                            object.count += 1;
                        }
                    }
                }
                return;
            }
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
                if (x >= 0 && y >= 0 && !this.gridService.getGridTiles()[y][x].isOccuped && !this.isDoorOrWallTile(element)) {
                    this.tile.image.push(element.id.split(',')[2] as string);
                    return true;
                } else return false;
            }

            if (element.classList.contains('drop-zone2')) {
                console.log('salut');
                return true;
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

    isDoorOrWallTile(element: Element | null): boolean {
        while (element) {
            if (element.classList.contains('drop-zone')) {
                const x = (this.tile.x = parseInt(element.id.split(',')[0], 10));
                const y = (this.tile.y = parseInt(element.id.split(',')[1], 10));
                if (
                    this.gridService.getGridTiles()[y][x].images[0] === 'assets/tiles/Door.png' ||
                    this.gridService.getGridTiles()[y][x].images[0] === 'assets/tiles/Wall.png' ||
                    this.gridService.getGridTiles()[y][x].images[0] === 'assets/tiles/DoorOpen.png'
                ) {
                    return true;
                } else return false;
            }
            element = element.parentElement;
        }
        return false;
    }
    setInvalid(index: number): void {
        const object = this.objectsList[index];
        if (object && typeof object.count === 'number') {
            object.count = 0;
            this.objectsList[index].isDragAndDrop = true;
        }
    }
}
