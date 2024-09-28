import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnInit } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { GridSize } from '@app/classes/grid-size.enum';
import { GameService } from '@app/services/game.service';
import { GridService } from '@app/services/grid.service';
import { TileService } from '@app/services/tile.service';

@Component({
    selector: 'app-grid',
    standalone: true,
    imports: [CommonModule, MatGridListModule, DragDropModule, CdkDrag],
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss'],
})
export class GridComponent implements OnInit {
    @Input() gridSize: number = GridSize.Small;

    gridTiles: { images: string[]; isOccuped: boolean }[][] = [];
    activeTile: string = 'base';
    isleftMouseDown: boolean = false;
    isRightMouseDown: boolean = false;

    sizeMapping: { [key: string]: GridSize } = {
        small: GridSize.Small,
        medium: GridSize.Medium,
        large: GridSize.Large,
    };

    constructor(
        private gridService: GridService,
        private tileService: TileService,
        private gameService: GameService,
    ) {
        this.gridService.generateDefaultGrid(this.gridSize);
    }

    @HostListener('dragstart', ['$event'])
    onDragStart(event: DragEvent) {
        event.preventDefault();
    }
    ngOnInit() {
        const gameConfig = this.gameService.getGameConfig();
        this.gridSize = this.sizeMapping[gameConfig?.size ?? 'small'];
        this.gridService.generateDefaultGrid(this.gridSize);
        this.gridTiles = this.gridService.getGridTiles();
        this.tileService.selectedTile$.subscribe((tile) => {
            this.activeTile = tile;
        });
    }
    applyTile(row: number, col: number) {
        const currentTile = this.gridTiles[row][col].images[0];
        if (this.activeTile === 'door' && (currentTile.includes('Door') || currentTile.includes('DoorOpen'))) {
            this.reverseDoorState(row, col);
        } else if (currentTile !== this.activeTile) {
            this.gridService.replaceImageOnTile(row, col, this.tileService.getTileImage(this.activeTile));
        }
    }

    deleteTile(row: number, col: number) {
        this.gridService.replaceImageOnTile(row, col, 'assets/grass.png');
    }

    reverseDoorState(row: number, col: number) {
        const currentTile = this.gridTiles[row][col].images[0];
        if (currentTile === 'assets/tiles/Door.png') {
            this.gridService.replaceImageOnTile(row, col, 'assets/tiles/DoorOpen.png');
        } else if (currentTile === 'assets/tiles/DoorOpen.png') {
            this.gridService.replaceImageOnTile(row, col, 'assets/tiles/Door.png');
        }
    }
    handleMouseDown(event: MouseEvent, row: number, col: number) {
        if (event.button === 0) {
            this.isleftMouseDown = true;
            this.applyTile(row, col);
        } else if (event.button === 2) {
            this.gridService.getGridTiles()[row][col].isOccuped = false;
            this.isRightMouseDown = true;
            this.deleteTile(row, col);
        }
    }

    handleMouseUp(event: MouseEvent) {
        if (event.button === 0) {
            this.isleftMouseDown = false;
        } else if (event.button === 2) {
            this.isRightMouseDown = false;
        }
    }

    handleMouseMove(row: number, col: number) {
        if (this.isleftMouseDown) {
            this.applyTile(row, col);
        } else if (this.isRightMouseDown) {
            this.deleteTile(row, col);
        }
    }
}
