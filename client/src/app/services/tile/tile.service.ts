import { Injectable } from '@angular/core';
import { GridService } from '@app/services/grid/grid.service';
import { BehaviorSubject } from 'rxjs';
import { TILES_LIST } from 'src/constants/tiles-constants';

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

    getTileImageSrc(tile: string): string {
        return TILES_LIST.find((t) => t.name === tile)?.imgSrc || '';
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
