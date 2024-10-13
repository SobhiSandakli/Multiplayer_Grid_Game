import { Component } from '@angular/core';
import { TileService } from '@app/services/tile/tile.service';
import { TILES_LIST } from 'src/constants/tiles-constants';

@Component({
    selector: 'app-tile',
    templateUrl: './tile.component.html',
    styleUrls: ['./tile.component.scss'],
})
export class TileComponent {
    selectedTile: string = '';
    tilesList = TILES_LIST;
    constructor(private tileService: TileService) {}

    selectTile(tile: string): void {
        if (this.selectedTile === tile) {
            this.selectedTile = '';
            this.tileService.setSelectedTile('');
        } else {
            this.selectedTile = tile;
            this.tileService.setSelectedTile(tile);
        }
    }
}
