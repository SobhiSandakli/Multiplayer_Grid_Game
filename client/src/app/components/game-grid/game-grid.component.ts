import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    SimpleChanges,
    ViewChildren,
} from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { GameGridService } from '@app/services/game-grid/gameGrid.service';
import { GridFacadeService } from '@app/services/grid-facade/gridFacade.service';
import { Subscription } from 'rxjs';
import { INFO_DISPLAY_DURATION } from 'src/constants/game-grid-constants';

@Component({
    selector: 'app-game-grid',
    templateUrl: './game-grid.component.html',
    styleUrls: ['./game-grid.component.scss'],
})
export class GameGridComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
    @Input() sessionCode: string;
    @Input() playerAvatar: string;
    @Output() actionPerformed: EventEmitter<void> = this.gameGridService.actionPerformed;
    @Input() isActive: boolean = false;
    @Output() emitIsFight: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() emitAvatarCombat: EventEmitter<string> = new EventEmitter<string>();
    @ViewChildren('tileContent') tileElements!: QueryList<ElementRef>;
    gridTiles: { images: string[]; isOccuped: boolean }[][] = [];
    accessibleTiles: { position: { row: number; col: number }; path: { row: number; col: number }[] }[] = [];
    hoverPath: { x: number; y: number }[] = [];
    tileHeight: number = 0;
    tileWidth: number = 0;
    isInfoActive: boolean = false;
    infoMessage: SafeHtml;
    infoPosition = { x: 0, y: 0 };
    highlightedTile: { row: number; col: number } | null = null;
    private subscriptions: Subscription = new Subscription();
    private infoTimeout: ReturnType<typeof setTimeout>;
    constructor(
        private gameGridService: GameGridService,
        private cdr: ChangeDetectorRef,
        private gridFacade: GridFacadeService,
    ) {}
    get getGridArrayChange$() {
        return this.gridFacade.getGridArrayChange$(this.sessionCode);
    }
    get onDoorStateUpdated() {
        return this.gridFacade.onDoorStateUpdated();
    }
    get getAccessibleTiles() {
        return this.gridFacade.getAccessibleTiles(this.sessionCode);
    }
    get onPlayerMovement() {
        return this.gridFacade.onPlayerMovement();
    }
    get onCombatStarted() {
        return this.gridFacade.onCombatStarted();
    }
    get onAvatarInfo() {
        return this.gridFacade.onAvatarInfo();
    }
    get onTileInfo() {
        return this.gridFacade.onTileInfo();
    }

    @HostListener('window:resize')
    onResize() {
        this.updateTileDimensions();
    }

    ngOnInit() {
        this.gameGridService.setSessionCode(this.sessionCode);
        this.gameGridService.setPlayerAvatar(this.playerAvatar);
        const gridArrayChangeSubscription = this.getGridArrayChange$.subscribe((data) => {
            if (data) {
                this.updateGrid(data.grid);
                this.getInitialPosition();
            }
        });
        this.subscriptions.add(
            this.gameGridService.infoMessage$.subscribe(({ message, x, y }) => {
                this.showInfo(message, x, y);
            }),
        );
        this.subscriptions.add(
            this.onDoorStateUpdated.subscribe((data) => {
                const { row, col, newState } = data;
                const tile = this.gridTiles[row][col];

                const doorIndex = tile.images.findIndex((img) => img.includes('assets/tiles/Door.png'));
                const doorOpenIndex = tile.images.findIndex((img) => img.includes('assets/tiles/Door-Open.png'));

                if (doorIndex !== -1) {
                    tile.images[doorIndex] = newState;
                    this.cdr.detectChanges();
                }

                if (doorOpenIndex !== -1) {
                    tile.images[doorOpenIndex] = newState;
                    this.cdr.detectChanges();
                }
            }),
        );
        this.getAccessibleTiles.subscribe((response) => {
            this.updateAccessibleTiles(response.accessibleTiles);
        });

        const playerMovementSubscription = this.onPlayerMovement.subscribe((movementData) => {
            this.animatePlayerMovement(movementData.avatar, movementData.desiredPath, movementData.realPath, movementData.slipOccurred);
        });

        this.subscriptions.add(gridArrayChangeSubscription);
        this.subscriptions.add(playerMovementSubscription);

        this.updateAccessibleTilesBasedOnActive();
    }

    ngOnChanges(changes: SimpleChanges) {
        this.onCombatStarted.subscribe(() => {
            this.emitIsFight.emit(true);
        });

        if (changes['isActive']) {
            this.updateAccessibleTilesBasedOnActive();
        }
    }

    ngAfterViewInit() {
        this.updateTileDimensions();
    }
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    updateGrid(newGrid: { images: string[]; isOccuped: boolean }[][]) {
        this.gridTiles = newGrid;
        this.cdr.detectChanges();
    }

    updateAccessibleTiles(newAccessibleTiles: { position: { row: number; col: number }; path: { row: number; col: number }[] }[]) {
        this.accessibleTiles = newAccessibleTiles;
        this.cdr.detectChanges();
    }

    updateAccessibleTilesBasedOnActive() {
        const accessibleTilesSubscription = this.getAccessibleTiles.subscribe((response) => {
            if (this.isActive) {
                this.clearPath();
                this.updateAccessibleTilesForCombat();
            } else {
                this.updateAccessibleTiles(response.accessibleTiles);
            }
        });

        this.subscriptions.add(accessibleTilesSubscription);
    }

    updateAccessibleTilesForCombat() {
        const playerPosition = this.getPlayerPosition();
        if (!playerPosition) return;

        this.accessibleTiles = [];

        const directions = [
            { rowOffset: -1, colOffset: 0 }, // top
            { rowOffset: 1, colOffset: 0 }, // bottom
            { rowOffset: 0, colOffset: -1 }, // left
            { rowOffset: 0, colOffset: 1 }, // right
        ];

        for (const { rowOffset, colOffset } of directions) {
            const adjacentRow = playerPosition.row + rowOffset;
            const adjacentCol = playerPosition.col + colOffset;

            if (adjacentRow >= 0 && adjacentRow < this.gridTiles.length && adjacentCol >= 0 && adjacentCol < this.gridTiles[adjacentRow].length) {
                const tile = this.gridTiles[adjacentRow][adjacentCol];

                if (
                    tile.images.some(
                        (img) => img.includes('assets/tiles/Door') || img.includes('assets/tiles/Door-Open') || img.includes('assets/avatars'),
                    )
                ) {
                    this.accessibleTiles.push({
                        position: { row: adjacentRow, col: adjacentCol },
                        path: [
                            { row: playerPosition.row, col: playerPosition.col },
                            { row: adjacentRow, col: adjacentCol },
                        ],
                    });
                }
            }
        }

        this.cdr.detectChanges();
    }

    onTileClick(rowIndex: number, colIndex: number): void {
        this.gameGridService.onTileClick(rowIndex, colIndex, this.accessibleTiles);
    }
    onRightClickTile(row: number, col: number, event: MouseEvent): void {
        this.gameGridService.onRightClickTile(row, col, event, this.gridTiles);
    }

    showInfo(message: SafeHtml, x: number, y: number) {
        clearTimeout(this.infoTimeout);

        this.infoMessage = message;
        this.infoPosition = { x, y };
        this.isInfoActive = true;
        this.cdr.detectChanges();

        this.infoTimeout = setTimeout(() => {
            this.isInfoActive = false;
            this.cdr.detectChanges();
        }, INFO_DISPLAY_DURATION);
    }

    updateTileDimensions(): void {
        const dimensions = this.gameGridService.updateTileDimensions(this.tileElements);
        this.tileWidth = dimensions.tileWidth;
        this.tileHeight = dimensions.tileHeight;
    }

    onTileHover(rowIndex: number, colIndex: number): void {
        this.updateTileDimensions();
        const hoverPath = this.gameGridService.calculateHoverPath(rowIndex, colIndex, this.accessibleTiles, this.tileWidth, this.tileHeight);
        this.hoverPath = hoverPath;
        this.cdr.detectChanges();
    }

    animatePlayerMovement(
        avatar: string,
        desiredPath: { row: number; col: number }[],
        realPath: { row: number; col: number }[],
        slipOccurred: boolean,
    ) {
        const delay = 150;
        let index = 0;
        const isSlip = slipOccurred;

        this.hoverPath = [];
        this.accessibleTiles = [];
        this.cdr.detectChanges();

        const moveStep = () => {
            if (index < realPath.length) {
                const currentTile = realPath[index];

                this.updateAvatarPosition(avatar, currentTile.row, currentTile.col);

                index++;
                setTimeout(moveStep, delay);
            } else if (isSlip) {
                this.rotateAvatar(realPath[realPath.length - 1].row, realPath[realPath.length - 1].col);
            } else {
                this.getAccessibleTiles.subscribe((response) => {
                    this.updateAccessibleTiles(response.accessibleTiles);
                });
            }
        };

        moveStep();
    }

    getTilePosition(index: number) {
        return this.gameGridService.getTilePosition(index, this.gridTiles[0].length);
    }

    rotateAvatar(row: number, col: number) {
        this.gameGridService.rotateAvatar(row, col, this.tileElements, this.playerAvatar);
        this.cdr.detectChanges();
    }

    updateAvatarPosition(avatar: string, row: number, col: number) {
        this.gameGridService.updateAvatarPosition(avatar, row, col, this.gridTiles, this.cdr);
    }
    clearPath(): void {
        this.hoverPath = [];
    }

    hasTopBorder(row: number, col: number) {
        return this.gameGridService.hasTopBorder(row, col, this.accessibleTiles);
    }

    hasRightBorder(row: number, col: number) {
        return this.gameGridService.hasRightBorder(row, col, this.accessibleTiles);
    }

    hasBottomBorder(row: number, col: number) {
        return this.gameGridService.hasBottomBorder(row, col, this.accessibleTiles);
    }

    hasLeftBorder(row: number, col: number) {
        return this.gameGridService.hasLeftBorder(row, col, this.accessibleTiles);
    }
    handleTileClick(tile: { images: string[]; isOccuped: boolean }, row: number, col: number, event: MouseEvent) {
        const gameState = {
            isActive: this.isActive,
            accessibleTiles: this.accessibleTiles,
            gridTiles: this.gridTiles,
        };

        const tileInfo = {
            tile,
            position: { row, col },
        };

        this.gameGridService.handleTileClick(gameState, tileInfo, event);
    }

    toggleDoorState(row: number, col: number): void {
        this.gameGridService.toggleDoorState(row, col);
    }
    startCombatWithOpponent(opponentAvatar: string) {
        this.gameGridService.startCombatWithOpponent(opponentAvatar);
    }
    private getPlayerPosition(): { row: number; col: number } {
        return this.gameGridService.getPlayerPosition(this.gridTiles);
    }

    private getInitialPosition(): { row: number; col: number } {
        if (this.highlightedTile) {
            return this.highlightedTile;
        } else {
            this.highlightedTile = this.gameGridService.getPlayerPosition(this.gridTiles);
            return this.highlightedTile;
        }
    }
}
