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
import { GridFacadeService } from '@app/services/facade/gridFacade.service';
import { GameGridService } from '@app/services/game-grid/gameGrid.service';
import { Subscription } from 'rxjs';
import { INFO_DISPLAY_DURATION, PATH_ANIMATION_DELAY } from 'src/constants/game-grid-constants';

@Component({
    selector: 'app-game-grid',
    templateUrl: './game-grid.component.html',
    styleUrls: ['./game-grid.component.scss'],
})
export class GameGridComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
    @Input() sessionCode: string;
    @Input() playerAvatar: string;
    @Output() actionPerformed: EventEmitter<void> = new EventEmitter<void>();
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
    infoMessage: string = '';
    infoPosition = { x: 0, y: 0 };
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
    private subscriptions: Subscription = new Subscription();
    private infoTimeout: ReturnType<typeof setTimeout>;

    constructor(
        private gameGridService: GameGridService,
        private cdr: ChangeDetectorRef,
        private gridFacade: GridFacadeService,
    ) {}
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
            }
        });
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
            this.animatePlayerMovement(movementData.avatar, movementData.desiredPath, movementData.realPath);
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
        event.preventDefault();

        const tile = this.gridTiles[row][col];
        const lastImage = tile.images[tile.images.length - 1];

        const x = event.clientX;
        const y = event.clientY;

        if (lastImage.includes('assets/avatars')) {
            this.gridFacade.emitAvatarInfoRequest(this.sessionCode, lastImage);
            this.subscriptions.add(
                this.onAvatarInfo.subscribe((data) => {
                    const message = `Nom: ${data.name}, Avatar: ${data.avatar}`;
                    this.showInfo(message, x, y);
                }),
            );
        } else {
            this.gridFacade.emitTileInfoRequest(this.sessionCode, row, col);
            this.subscriptions.add(
                this.onTileInfo.subscribe((data) => {
                    const message = `Coût: ${data.cost}, Effet: ${data.effect}`;
                    this.showInfo(message, x, y);
                }),
            );
        }
    }

    showInfo(message: string, x: number, y: number) {
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
        const firstTile = this.tileElements.first;

        if (firstTile) {
            const rect = firstTile.nativeElement.getBoundingClientRect();
            this.tileWidth = rect.width;
            this.tileHeight = rect.height;
        }
    }

    onTileHover(rowIndex: number, colIndex: number): void {
        this.updateTileDimensions();

        const tile = this.accessibleTiles.find((t) => t.position.row === rowIndex && t.position.col === colIndex);

        if (tile) {
            const pointsPerSegment = 4;

            this.hoverPath = [];

            for (let k = 0; k < tile.path.length - 1; k++) {
                const start = tile.path[k];
                const end = tile.path[k + 1];

                const startX = start.col * this.tileWidth + this.tileWidth / 2;
                const startY = start.row * this.tileHeight + this.tileHeight;
                const endX = end.col * this.tileWidth + this.tileWidth / 2;
                const endY = end.row * this.tileHeight + this.tileHeight;

                for (let i = 0; i <= pointsPerSegment; i++) {
                    const x = startX + (endX - startX) * (i / pointsPerSegment);
                    const y = startY + (endY - startY) * (i / pointsPerSegment);
                    this.hoverPath.push({ x, y });
                }
            }
        }
    }

    animatePlayerMovement(avatar: string, desiredPath: { row: number; col: number }[], realPath: { row: number; col: number }[]) {
        const delay = 150;
        let index = 0;
        const isSlip = desiredPath.length !== realPath.length;

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
                this.rotateAvatar(avatar, realPath[realPath.length - 1].row, realPath[realPath.length - 1].col);
            } else {
                this.getAccessibleTiles.subscribe((response) => {
                    this.updateAccessibleTiles(response.accessibleTiles);
                });
            }
        };

        moveStep();
    }

    getTilePosition(index: number): { row: number; col: number } {
        const numCols = this.gridTiles[0].length;
        const row = Math.floor(index / numCols);
        const col = index % numCols;
        return { row, col };
    }

    rotateAvatar(avatar: string, row: number, col: number) {
        const tileElement = this.tileElements.toArray().find((el, index) => {
            const position = this.getTilePosition(index);
            return position.row === row && position.col === col;
        });

        if (tileElement) {
            const avatarImage = Array.from(tileElement.nativeElement.querySelectorAll('img') as NodeListOf<HTMLImageElement>).find((img) =>
                img.src.includes(this.playerAvatar),
            );

            if (avatarImage) {
                avatarImage.classList.add('rotate');

                setTimeout(() => {
                    avatarImage.classList.remove('rotate');
                }, PATH_ANIMATION_DELAY);
            }
        }
    }

    updateAvatarPosition(avatar: string, row: number, col: number) {
        this.gridTiles.forEach((gridrow) =>
            gridrow.forEach((cell) => {
                const avatarIndex = cell.images.indexOf(avatar);
                if (avatarIndex > -1) cell.images.splice(avatarIndex, 1); // Remove avatar if present
            }),
        );

        const tile = this.gridTiles[row][col];
        tile.images.push(avatar);
        this.cdr.detectChanges();
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
        this.gameGridService.handleTileClick(this.isActive, this.accessibleTiles, this.gridTiles, tile, row, col, event);
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
}
