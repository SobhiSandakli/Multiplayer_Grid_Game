import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GridService } from './grid.service';

@Injectable({
    providedIn: 'root',
})
export class TileService {
    private selectedTileSource = new BehaviorSubject<string>('base');
    constructor(private gridService: GridService) {}
    get selectedTile$() {
        return this.selectedTileSource.asObservable();
    }
    setSelectedTile(tile: string) {
        this.selectedTileSource.next(tile);
    }

    getTileImage(tile: string): string {
        switch (tile) {
            case 'wall':
                return 'assets/tiles/Wall.png';
            case 'water':
                return 'assets/tiles/Water.png';
            case 'door':
                return 'assets/tiles/Door.png';
            case 'doorOpen':
                return 'assets/tiles/Door-Open.png';
            case 'ice':
                return 'assets/tiles/Ice.png';
            default:
                return 'assets/tiles/Grass.png';
        }
    }
    removeObjectFromTile(row: number, col: number, object: string): void {
        const gridTiles = this.gridService.getGridTiles();
        gridTiles[row][col].images = gridTiles[row][col].images.filter((img) => img !== object);
        gridTiles[row][col].isOccuped = false;
    }
    addObjectToTile(row: number, col: number, object: string): void {
        const gridTiles = this.gridService.getGridTiles();
        gridTiles[row][col].images.push(object);
        gridTiles[row][col].isOccuped = true;
    }
}
