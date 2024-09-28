import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnInit } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { GridSize } from '@app/classes/grid-size.enum';
import { GameService } from '@app/services/game.service';
import { GridService } from '@app/services/grid.service';
import { TileService } from '@app/services/tile.service';
import { objectsList } from '../object-container/objects-list';
import { DragDropService } from '@app/services/drag-and-drop.service';

@Component({
    selector: 'app-grid',
    standalone: true,
    imports: [CommonModule, MatGridListModule, DragDropModule, CdkDrag],
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss'],
})
export class GridComponent implements OnInit {
    private objectsList = objectsList;
    private dragDropService: DragDropService;
    @Input() gridSize: number = GridSize.Small;

    gridTiles: { images: string[]; isOccuped: boolean }[][] = [];
    activeTile: string = 'base';
    isleftMouseDown: boolean = false;
    isRightMouseDown: boolean = false;

    defaultImage = 'assets/grass.png';
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
        this.gridService.generateDefaultGrid(this.gridSize, this.defaultImage);
    }

    @HostListener('dragstart', ['$event'])
    onDragStart(event: DragEvent) {
        event.preventDefault();
    }
    ngOnInit() {
        const gameConfig = this.gameService.getGameConfig();
        this.gridSize = this.sizeMapping[gameConfig?.size ?? 'small'];
        this.gridService.generateDefaultGrid(this.gridSize, this.defaultImage);
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
        // Check if a valid object exists on the tile
        if (this.gridTiles[row][col].images.length > 0) {
            const removedObjectImage = this.gridTiles[row][col].images.pop();
            this.gridService.replaceImageOnTile(row, col, 'assets/grass.png');
            this.updateObjectState(removedObjectImage); // Call the function to update object state
        }
    }
    updateObjectState(removedObjectImage: string | undefined): void {
        if (!removedObjectImage) return;

        const removedObjectIndex = this.objectsList.findIndex((object) => object.link === removedObjectImage);

        if (removedObjectIndex >= 0) {
            const removedObject = this.objectsList[removedObjectIndex];

            if (removedObject.count !== undefined && removedObject.count >= 0) {
                removedObject.count += 1;
            }

            removedObject.isDragAndDrop = false; // Reset the drag state
        }
    }
    incrementObjectCounter(removedObjectImage: string | undefined): void {
        if (!removedObjectImage) return;

        const removedObjectIndex = this.objectsList.findIndex((object) => object.link === removedObjectImage);

        if (removedObjectIndex >= 0) {
            this.dragDropService.incrementCounter(removedObjectIndex);
        }
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
