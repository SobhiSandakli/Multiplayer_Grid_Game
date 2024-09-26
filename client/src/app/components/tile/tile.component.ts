import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TileService } from '@app/services/tile.service';

@Component({
    selector: 'app-tile',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './tile.component.html',
    styleUrls: ['./tile.component.scss'],
})
export class TileComponent {
    selectedTile: string = 'base';
    tiles = [
        { name: 'wall', label: 'Mur: on ne peut pas passer à travers.', imgSrc: '../../../assets/tiles/Wall.png', alt: 'Wall Tile' },
        { name: 'water', label: 'Eau', imgSrc: '../../../assets/tiles/Water.png', alt: 'Water Tile' },
        { name: 'door', label: 'Porte: on peut franchir une porte que si elle est ouverte.', imgSrc: '../../../assets/tiles/Door.png', alt: 'Door Tile' },
        { name: 'ice', label: 'Glace: on a plus de chances de tomber sur de la glace.', imgSrc: '../../../assets/tiles/Ice.png', alt: 'Ice Tile' },
    ];
    constructor(private tileService: TileService) {}

    selectTile(tile: string): void {
        this.selectedTile = tile;
        this.tileService.setSelectedTile(tile);  
    }
}