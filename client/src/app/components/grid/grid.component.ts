import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { GridSize } from '@app/enums/grid-size.enum';
import { DragDropService } from '@app/services/drag-and-drop.service';
import { GameService } from '@app/services/game.service';
import { GridService } from '@app/services/grid.service';
import { TileService } from '@app/services/tile.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-grid',
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss'],
})
export class GridComponent implements OnInit {
    @Input() gridSize: number;

    gridTiles: { images: string[]; isOccuped: boolean }[][] = [];
    activeTile: string = '';
    isleftMouseDown: boolean = false;
    isRightMouseDown: boolean = false;
    currentObject: string = '';
    displayedNumber: number;

    sizeMapping: { [key: string]: GridSize } = {
        small: GridSize.Small,
        medium: GridSize.Medium,
        large: GridSize.Large,
    };

    private objectsList = this.dragDropService.objectsList;
    private subscriptions: Subscription = new Subscription();

    constructor(
        private gridService: GridService,
        private tileService: TileService,
        private gameService: GameService,
        private cdr: ChangeDetectorRef,
        private dragDropService: DragDropService,
    ) {}

    ngOnInit() {
        this.initializeGrid();
        this.gridService.generateDefaultGrid(this.gridSize);
        this.subscribeToGridChanges();
        this.subscribeToTileSelection();
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }
    getConnectedDropLists(): string[] {
        return this.gridTiles.map((row, i) => row.map((_tile, j) => `cdk-drop-list-${i}-${j}`)).reduce((acc, val) => acc.concat(val), []);
    }

    moveObjectInGrid(event: CdkDragDrop<{ image: string; row: number; col: number }>): void {
        //if (this.isDraggableImage(event.item.data.image)) {
        const element = event.event.target as Element;
        console.log('moving object', element);
        this.dragDropService.dropObjectBetweenCase(event, element);
        //}
    }

    isDraggableImage(image: string): boolean {
        return this.objectsList.some((object) => object.link === image);
    }

    applyTile(row: number, col: number) {
        const currentTile = this.gridTiles[row][col].images[0];
        if (this.gridTiles[row][col].images.length > 1) {
            this.currentObject = this.gridTiles[row][col].images[1];
        }
        if (this.activeTile === 'door' && (currentTile.includes('Door') || currentTile.includes('Door-Open'))) {
            this.reverseDoorState(row, col);
        } else if (currentTile !== this.activeTile) {
            this.updateTile(row, col);
        }
    }

    deleteTile(row: number, col: number) {
        if (this.gridTiles[row][col].images.length === 1) {
            this.gridService.replaceImageOnTile(row, col, this.tileService.getTileImage('grass'));
        } else if (this.gridTiles[row][col].images.length === 2) {
            const removedObjectImage = this.gridTiles[row][col].images.pop();
            this.updateObjectState(removedObjectImage);
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

            removedObject.isDragAndDrop = false;
        }
    }

    reverseDoorState(row: number, col: number) {
        const currentTile = this.gridTiles[row][col].images[0];
        if (currentTile === this.tileService.getTileImage('door')) {
            this.gridService.replaceImageOnTile(row, col, this.tileService.getTileImage('doorOpen'));
        } else if (currentTile === this.tileService.getTileImage('doorOpen')) {
            this.gridService.replaceImageOnTile(row, col, this.tileService.getTileImage('door'));
        }
    }

    handleMouseDown(event: MouseEvent, row: number, col: number) {
        const allowedTileNames = ['wall', 'water', 'door', 'ice'];

        if (event.button === 0 && allowedTileNames.includes(this.activeTile)) {
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

    private initializeGrid() {
        const gameConfig = this.gameService.getGameConfig();
        if (gameConfig) {
            this.gridSize = this.sizeMapping[gameConfig.size] ?? GridSize.Small;
        } else {
            this.gridSize = GridSize.Small;
        }
    }

    private subscribeToGridChanges() {
        const gridSubscription = this.gridService.gridTiles$.subscribe((gridTiles) => {
            this.gridTiles = gridTiles;
            this.cdr.detectChanges();
        });
        this.subscriptions.add(gridSubscription);
    }

    private subscribeToTileSelection() {
        const tileSubscription = this.tileService.selectedTile$.subscribe((tile) => {
            this.activeTile = tile;
        });
        this.subscriptions.add(tileSubscription);
    }
    private updateTile(row: number, col: number): void {
        this.gridService.replaceImageOnTile(row, col, this.tileService.getTileImage(this.activeTile));
        this.gridTiles[row][col].images[0] = this.tileService.getTileImage(this.activeTile);

        if (this.gridTiles[row][col].isOccuped) {
            this.updateObjectState(this.currentObject);
            this.gridTiles[row][col].isOccuped = false;
        }
    }
}
