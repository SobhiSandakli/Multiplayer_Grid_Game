import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class TileService {
    private selectedTileSource = new BehaviorSubject<string>('base');
    selectedTile$ = this.selectedTileSource.asObservable();

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
                return 'assets/tiles/DoorOpen.png';
            case 'ice':
                return 'assets/tiles/Ice.png';
            default:
                return 'assets/grass.png';
        }
    }
}
