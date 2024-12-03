import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as objectConstant from 'src/constants/objects-constants';
import { DEFAULT_TILES } from 'src/constants/tiles-constants';
import { GridSize } from 'src/constants/validate-constants';

@Injectable({
    providedIn: 'root',
})
export class GridService {
    gridTilesSubject = new BehaviorSubject<{ images: string[]; isOccuped: boolean }[][]>([]);
    defaultImage = DEFAULT_TILES;
    gridTiles$ = this.gridTilesSubject.asObservable();

    gridTiles: { images: string[]; isOccuped: boolean }[][] = [];
    gridSize: number;

    generateDefaultGrid(size: number) {
        this.gridSize = size;
        this.gridTiles = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ images: [this.defaultImage], isOccuped: false })));
        this.gridTilesSubject.next(this.gridTiles);
    }

    getGridTiles(): { images: string[]; isOccuped: boolean }[][] {
        return this.gridTiles;
    }

    resetDefaultGrid() {
        this.gridTiles.forEach((row) => row.forEach((tile) => (tile.isOccuped = false)));
        this.gridTiles.forEach((row) => row.forEach((tile) => (tile.images = [this.defaultImage])));
    }

    addObjectToTile(x: number, y: number, imageLink: string) {
        if (this.gridTiles[y] && this.gridTiles[y][x]) {
            this.gridTiles[y][x].images.push(imageLink);
            this.gridTiles[y][x].isOccuped = true;
            this.gridTilesSubject.next(this.gridTiles);
        }
    }

    replaceImageOnTile(rowIndex: number, colIndex: number, imageLink: string) {
        if (this.gridTiles[rowIndex] && this.gridTiles[rowIndex][colIndex]) {
            this.gridTiles[rowIndex][colIndex].images = [imageLink];
            this.gridTilesSubject.next(this.gridTiles);
        }
    }

    setGrid(grid: { images: string[]; isOccuped: boolean }[][]) {
        this.gridTiles = grid;
        this.gridTilesSubject.next(this.gridTiles);
    }

    getTileType(rowIndex: number, colIndex: number): string {
        return this.gridTiles[rowIndex][colIndex].images[0];
    }

    getObjectOnTile(rowIndex: number, colIndex: number): string {
        return this.gridTiles[rowIndex][colIndex].images[1] ? this.gridTiles[rowIndex][colIndex].images[1] : '';
    }

    setCellToOccupied(rowIndex: number, colIndex: number) {
        this.gridTiles[rowIndex][colIndex].isOccuped = true;
    }

    setCellToUnoccupied(rowIndex: number, colIndex: number) {
        this.gridTiles[rowIndex][colIndex].isOccuped = false;
    }

    removeObjectFromTile(rowIndex: number, colIndex: number): string {
        return this.gridTiles[rowIndex][colIndex].images.pop() || '';
    }

    setTileToCell(rowIndex: number, colIndex: number, tile: string) {
        this.gridTiles[rowIndex][colIndex].images = [tile];
    }

    getCounterByGridSize(size: number): number {
        if (size === GridSize.Small) {
            return objectConstant.MAX_COUNTER_SMALL_GRID;
        } else if (size === GridSize.Medium) {
            return objectConstant.MAX_COUNTER_MEDIUM_GRID;
        } else if (size === GridSize.Large) {
            return objectConstant.MAX_COUNTER_LARGE_GRID;
        } else return 0;
    }
}
