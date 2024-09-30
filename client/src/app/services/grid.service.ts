import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GridService {
    // Grid tiles are now a BehaviorSubject to notify components of changes
    gridTilesSubject = new BehaviorSubject<{ images: string[]; isOccuped: boolean }[][]>([]);
    defaultImage: string = 'assets/grass.png';
    gridTiles$ = this.gridTilesSubject.asObservable();

    // Set initial grid tiles
    gridTiles: { images: string[]; isOccuped: boolean }[][] = [];
    gridSize: number;

    generateDefaultGrid(size: number) {
        this.gridSize = size;
        this.gridTiles = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ images: [this.defaultImage], isOccuped: false })));
        this.gridTilesSubject.next(this.gridTiles); // Emit the new grid state
    }

    getGridTiles(): { images: string[]; isOccuped: boolean }[][] {
        return this.gridTiles;
    }

    resetDefaultGrid() {
        this.gridTiles.forEach((row) => row.forEach((tile) => (tile.isOccuped = false)));
        this.gridTiles.forEach((row) => row.forEach((tile) => (tile.images = [this.defaultImage])));
    }
    // Ajouter une image à une tuile spécifique
    addObjectToTile(x: number, y: number, imageLink: string) {
        if (this.gridTiles[y] && this.gridTiles[y][x]) {
            this.gridTiles[y][x].images.push(imageLink);
            this.gridTiles[y][x].isOccuped = true;
            this.gridTilesSubject.next(this.gridTiles); // Notify changes
        }
    }

    replaceImageOnTile(rowIndex: number, colIndex: number, imageLink: string) {
        if (this.gridTiles[rowIndex] && this.gridTiles[rowIndex][colIndex]) {
            this.gridTiles[rowIndex][colIndex].images = [imageLink];
            this.gridTilesSubject.next(this.gridTiles); // Notify changes
        }
    }

    setGrid(grid: { images: string[]; isOccuped: boolean }[][]) {
        this.gridTiles = grid;
        this.gridTilesSubject.next(this.gridTiles); // Emit the new grid state
    }
}
