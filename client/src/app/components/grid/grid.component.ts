import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, Input, OnInit } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { GridSize } from '@app/classes/grid-size.enum';
import { objectsList } from '@app/components/object-container/objects-list';
import { DragDropService } from '@app/services/drag-and-drop.service';
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

    private objectsList = objectsList;
    private dragDropService: DragDropService;

    constructor(
        private gridService: GridService,
        private tileService: TileService,
        private gameService: GameService,
        private cdr: ChangeDetectorRef,
    ) {
        this.gridService.generateDefaultGrid(this.gridSize);
    }

    @HostListener('dragstart', ['$event'])
    onDragStart(event: DragEvent) {
        event.preventDefault();
    }
    ngOnInit() {
        this.gridService.gridTiles$.subscribe((gridTiles) => {
            this.gridTiles = gridTiles;
            this.cdr.detectChanges();
        });
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
        // Define the allowed tile types for left-click actions
        const allowedTileNames = ['wall', 'water', 'door', 'ice'];

        // Check if the activeTile is one of the allowed types
        if (event.button === 0 && allowedTileNames.includes(this.activeTile)) {
            this.isleftMouseDown = true;
            this.applyTile(row, col); // Apply tile logic only for allowed tiles
        } else if (event.button === 2) {
            // Right click for deletion
            this.gridService.getGridTiles()[row][col].isOccuped = false;
            this.isRightMouseDown = true;
            this.deleteTile(row, col); // Delete tile logic
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
