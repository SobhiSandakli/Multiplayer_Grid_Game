import { Subscription } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { DragDropService } from '@app/services/drag-and-drop/drag-and-drop.service';
import { GameService } from '@app/services/game/game.service';
import { GridService } from '@app/services/grid/grid.service';
import { TileService } from '@app/services/tile/tile.service';
import { LEFT_CLICK, RIGHT_CLICK } from 'src/constants/mouse-constants';
import { DEFAULT_TILES, TILES_LIST } from 'src/constants/tiles-constants';
import { GridSize } from 'src/constants/validate-constants';

@Component({
    selector: 'app-grid',
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss'],
})
export class GridComponent implements OnInit, OnDestroy {
    gridTiles: { images: string[]; isOccuped: boolean }[][] = this.gridService.gridTiles;
    objectsList: { link: string; count?: number; isDragAndDrop?: boolean }[] = [];
    gridSize: number;
    activeTile: string = '';
    isleftMouseDown: boolean = false;
    isRightMouseDown: boolean = false;
    currentObject: string = '';
    protected displayedNumber: number;

    private sizeMapping: { [key: string]: GridSize } = {
        small: GridSize.Small,
        medium: GridSize.Medium,
        large: GridSize.Large,
    };

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
        this.dragDropService.objectsList$.subscribe((list) => {
            this.objectsList = list;
        });
    }
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        window.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    }
    getConnectedDropLists(): string[] {
        return this.gridTiles.map((row, i) => row.map((_tile, j) => `cdk-drop-list-${i}-${j}`)).reduce((acc, val) => acc.concat(val), []);
    }

    findObject(objectToFind: string): { link: string; count?: number; isDragAndDrop?: boolean } {
        const foundObject = this.objectsList.find((object: { link: string }) => object.link === objectToFind);
        return foundObject ? foundObject : { link: '' };
    }

    updateObjectState(removedObject: { link: string; count?: number; isDragAndDrop?: boolean }): void {
        if (removedObject.count !== undefined && removedObject.count >= 0) {
            removedObject.count++;
        }

        if (removedObject) {
            removedObject.isDragAndDrop = false;
        }
    }
    moveObjectInGrid(event: CdkDragDrop<{ image: string; row: number; col: number }>): void {
        const element = event.event.target as Element;
        this.dragDropService.dropObjectBetweenCase(event, element);
    }

    handleMouseDown(event: MouseEvent, row: number, col: number) {
        const allowedTileNames = TILES_LIST.map((tile) => tile.name);

        if (event.button === LEFT_CLICK && allowedTileNames.includes(this.activeTile)) {
            this.isleftMouseDown = true;
            this.applyTile(row, col);
        } else if (event.button === RIGHT_CLICK) {
            this.isRightMouseDown = true;
            this.gridService.setCellToUnoccupied(row, col);
            this.deleteTile(row, col);
        }
    }

    handleMouseUp(event: MouseEvent) {
        if (event.button === LEFT_CLICK) {
            this.isleftMouseDown = false;
        } else if (event.button === RIGHT_CLICK) {
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

    isDraggableImage(image: string): boolean {
        return this.objectsList.some((object) => object.link === image);
    }

    private applyTile(row: number, col: number) {
        if (!this.activeTile) return;
        const currentTile = this.gridService.getTileType(row, col) || '';
        this.currentObject = this.gridService.getObjectOnTile(row, col);

        if (currentTile.includes('Door') || currentTile.includes('Door_open')) {
            this.reverseDoorState(row, col);
        } else if (currentTile !== this.activeTile) {
            this.updateTile(row, col);
        }
    }

    private deleteTile(row: number, col: number) {
        if (this.gridService.getObjectOnTile(row, col) === '') {
            this.gridService.replaceImageOnTile(row, col, DEFAULT_TILES);
        } else {
            const removedObjectImage = this.gridService.removeObjectFromTile(row, col);
            const removedObjectLink = this.findObject(removedObjectImage);
            this.updateObjectState(removedObjectLink);
        }
    }

    private reverseDoorState(row: number, col: number) {
        const currentTile = this.gridService.getTileType(row, col);
        if (currentTile === this.tileService.getTileImageSrc('door')) {
            this.gridService.replaceImageOnTile(row, col, this.tileService.getTileImageSrc('doorOpen'));
        } else if (currentTile === this.tileService.getTileImageSrc('doorOpen')) {
            this.gridService.replaceImageOnTile(row, col, this.tileService.getTileImageSrc('door'));
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
        this.gridService.replaceImageOnTile(row, col, this.tileService.getTileImageSrc(this.activeTile));
        this.gridService.setTileToCell(row, col, this.tileService.getTileImageSrc(this.activeTile));

        if (this.gridTiles[row][col].isOccuped) {
            const object = this.findObject(this.currentObject);
            this.updateObjectState(object);
            this.gridService.setCellToUnoccupied(row, col);
        }
    }
}
