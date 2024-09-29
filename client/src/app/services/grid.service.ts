import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GridService {
    // Grid tiles are now a BehaviorSubject to notify components of changes
    private gridTilesSubject = new BehaviorSubject<{ images: string[]; isOccuped: boolean }[][]>([]);
    gridTiles$ = this.gridTilesSubject.asObservable();

    // Set initial grid tiles
    private gridTiles: { images: string[]; isOccuped: boolean }[][] = [];

    generateDefaultGrid(size: number, defaultImage: string) {
        this.gridTiles = Array.from({ length: size }, () => 
            Array.from({ length: size }, () => ({ images: [defaultImage], isOccuped: false }))
        );
        this.gridTilesSubject.next(this.gridTiles); // Emit the new grid state
    }

    getGridTiles(): { images: string[]; isOccuped: boolean }[][] {
        return this.gridTiles;
    }

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
        console.log(this.gridTiles);
    }
}
