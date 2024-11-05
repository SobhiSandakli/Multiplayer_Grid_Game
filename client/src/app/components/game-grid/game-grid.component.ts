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
import { GridService } from '@app/services/grid/grid.service';
import { SocketService } from '@app/services/socket/socket.service';
import { TileService } from '@app/services/tile/tile.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-grid',
    templateUrl: './game-grid.component.html',
    styleUrls: ['./game-grid.component.scss'],
})
export class GameGridComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
    @Input() sessionCode: string;
    private subscriptions: Subscription = new Subscription();
    @Input() playerAvatar: string;
    @Output() actionPerformed: EventEmitter<void> = new EventEmitter<void>();
    @Input() isActive: boolean = false;
    gridTiles: { images: string[]; isOccuped: boolean }[][] = [];
    accessibleTiles: { position: { row: number; col: number }; path: { row: number; col: number }[] }[] = [];
    isPlayerTurn: boolean = false;
    hoverPath: { x: number; y: number }[] = [];
    tileHeight: number = 0;
    tileWidth: number = 0;
    @Output() emitAvatarCombat: EventEmitter<string> = new EventEmitter<string>();
    isInfoActive: boolean = false;
    infoMessage: string = '';
    infoPosition = { x: 0, y: 0 };
    private infoTimeout: any;

    @ViewChildren('tileContent') tileElements!: QueryList<ElementRef>;

    @HostListener('window:resize')
    onResize() {
        this.updateTileDimensions();
    }

    constructor(
        private socketService: SocketService,
        private cdr: ChangeDetectorRef,
        private gridService: GridService,
        private tileService: TileService,
    ) {}

    ngOnInit() {
        const gridArrayChangeSubscription = this.socketService.getGridArrayChange$(this.sessionCode).subscribe((data) => {
            if (data) {
                this.updateGrid(data.grid);
            }
        });
        this.subscriptions.add(
            this.socketService.onDoorStateUpdated().subscribe((data) => {
                const { row, col, newState } = data;
                const tile = this.gridTiles[row][col];
                console.log('init', tile);
                const doorIndex = tile.images.findIndex((img) => img.includes('assets/tiles/Door.png'));
                const doorOpenIndex = tile.images.findIndex((img) => img.includes('assets/tiles/Door-Open.png'));

                if (doorIndex !== -1) {
                    console.log('doorIndex');
                    tile.images[doorIndex] = newState;
                    this.cdr.detectChanges();
                }

                if (doorOpenIndex !== -1) {
                    console.log('doorOpenIndex');
                    console.log(newState);
                    tile.images[doorOpenIndex] = newState;
                    this.cdr.detectChanges();
                }
            }),
        );
        this.socketService.getAccessibleTiles(this.sessionCode).subscribe((response) => {
            this.updateAccessibleTiles(response.accessibleTiles);
        });

        // Subscribe to player movement events
        const playerMovementSubscription = this.socketService.onPlayerMovement().subscribe((movementData) => {
            this.animatePlayerMovement(movementData.avatar, movementData.desiredPath, movementData.realPath);
        });

        this.subscriptions.add(gridArrayChangeSubscription);
        this.subscriptions.add(playerMovementSubscription);

        // Initial subscription to accessible tiles
        this.updateAccessibleTilesBasedOnActive();
    }

    ngOnChanges(changes: SimpleChanges) {
        // When `isActive` changes, update accessible tiles
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
        const accessibleTilesSubscription = this.socketService.getAccessibleTiles(this.sessionCode).subscribe((response) => {
            if (this.isActive) {
                console.log('isActive');
                this.clearPath(); // Clear hoverPath to remove dotted lines
                this.updateAccessibleTilesForCombat();
            } else {
                console.log('isNOTActive');
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
        console.log(this.accessibleTiles);

        this.cdr.detectChanges(); // Trigger Angular change detection to update the view
    }

    onTileClick(rowIndex: number, colIndex: number): void {
        const isAccessible = this.accessibleTiles.some((tile) => tile.position.row === rowIndex && tile.position.col === colIndex);

        if (isAccessible) {
            const playerTile = this.accessibleTiles.find((tile) => tile.position.row === rowIndex && tile.position.col === colIndex);

            if (playerTile) {
                const sourceCoords = this.accessibleTiles[0].position; // Assuming the first tile in accessibleTiles is the player's current position
                this.socketService.movePlayer(this.sessionCode, sourceCoords, { row: rowIndex, col: colIndex }, this.playerAvatar);
            }
        }
    }
    onRightClickTile(row: number, col: number, event: MouseEvent): void {
        event.preventDefault(); // Empêche le menu contextuel par défaut

        const tile = this.gridTiles[row][col];
        const lastImage = tile.images[tile.images.length - 1];

        // Définir la position de l'info selon le clic
        const x = event.clientX;
        const y = event.clientY;

        if (lastImage.includes('assets/avatars')) {
            // Émettre la requête d'info du joueur si c'est un avatar
            this.socketService.emitAvatarInfoRequest(this.sessionCode, lastImage);
            this.subscriptions.add(
                this.socketService.onAvatarInfo().subscribe((data) => {
                    const message = `Nom: ${data.name}, Avatar: ${data.avatar}`;
                    this.showInfo(message, x, y);
                }),
            );
        } else {
            // Émettre la requête d'info de la tuile si c'est une tuile normale
            this.socketService.emitTileInfoRequest(this.sessionCode, row, col);
            this.subscriptions.add(
                this.socketService.onTileInfo().subscribe((data) => {
                    const message = `Coût: ${data.cost}, Effet: ${data.effect}`;
                    this.showInfo(message, x, y);
                }),
            );
        }
    }

    showInfo(message: string, x: number, y: number) {
        // Annule tout timeout en cours
        clearTimeout(this.infoTimeout);

        // Définit le message, la position et active l'affichage
        this.infoMessage = message;
        this.infoPosition = { x, y };
        this.isInfoActive = true;
        this.cdr.detectChanges();

        // Définit un timeout pour masquer l'info après 2 secondes
        this.infoTimeout = setTimeout(() => {
            this.isInfoActive = false;
            this.cdr.detectChanges();
        }, 2000); // 2000 ms = 2 secondes
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
        this.updateTileDimensions(); // Ensure tile dimensions are up-to-date

        const tile = this.accessibleTiles.find((tile) => tile.position.row === rowIndex && tile.position.col === colIndex);

        if (tile) {
            const pointsPerSegment = 4; // Adjust based on desired spacing

            this.hoverPath = [];

            for (let k = 0; k < tile.path.length - 1; k++) {
                const start = tile.path[k];
                const end = tile.path[k + 1];

                // Calculate centers of start and end tiles
                const startX = start.col * this.tileWidth + this.tileWidth / 2;
                const startY = start.row * this.tileHeight + this.tileHeight;
                const endX = end.col * this.tileWidth + this.tileWidth / 2;
                const endY = end.row * this.tileHeight + this.tileHeight;

                // Interpolate points between start and end
                for (let i = 0; i <= pointsPerSegment; i++) {
                    const x = startX + (endX - startX) * (i / pointsPerSegment);
                    const y = startY + (endY - startY) * (i / pointsPerSegment);
                    this.hoverPath.push({ x, y });
                }
            }
        }
    }

    animatePlayerMovement(avatar: string, desiredPath: { row: number; col: number }[], realPath: { row: number; col: number }[]) {
        const delay = 150; // 150 ms per cell
        let index = 0;
        const isSlip = desiredPath.length !== realPath.length;

        this.hoverPath = [];
        this.accessibleTiles = [];
        this.cdr.detectChanges();

        const moveStep = () => {
            if (index < realPath.length) {
                const currentTile = realPath[index];

                // Update avatar position to the current tile
                this.updateAvatarPosition(avatar, currentTile.row, currentTile.col);

                index++;
                setTimeout(moveStep, delay); // Schedule the next step after the delay
            } else if (isSlip) {
                this.rotateAvatar(avatar, realPath[realPath.length - 1].row, realPath[realPath.length - 1].col);
            } else {
                this.socketService.getAccessibleTiles(this.sessionCode).subscribe((response) => {
                    this.updateAccessibleTiles(response.accessibleTiles);
                });
            }
        };

        moveStep(); // Start the movement
    }

    // Helper method to get the row and column position of a tile based on its index in the QueryList
    getTilePosition(index: number): { row: number; col: number } {
        const numCols = this.gridTiles[0].length;
        const row = Math.floor(index / numCols);
        const col = index % numCols;
        return { row, col };
    }

    rotateAvatar(avatar: string, row: number, col: number) {
        // Find the tile element based on row and col position
        const tileElement = this.tileElements.toArray().find((el, index) => {
            const position = this.getTilePosition(index);
            return position.row === row && position.col === col;
        });

        if (tileElement) {
            // Locate the avatar img element within this tile by matching the src attribute with playerAvatar
            const avatarImage = Array.from(tileElement.nativeElement.querySelectorAll('img') as NodeListOf<HTMLImageElement>).find((img) =>
                img.src.includes(this.playerAvatar),
            );

            if (avatarImage) {
                // Add the rotation class to animate the avatar
                avatarImage.classList.add('rotate');
                // Remove the class after the animation completes
                setTimeout(() => {
                    avatarImage.classList.remove('rotate');
                }, 1000); // Match the duration of the CSS animation
            }
        }
    }

    // Helper method to update the avatar position by manipulating the images array
    updateAvatarPosition(avatar: string, row: number, col: number) {
        // Clear the avatar's previous position in the grid
        this.gridTiles.forEach((row) =>
            row.forEach((cell) => {
                const avatarIndex = cell.images.indexOf(avatar);
                if (avatarIndex > -1) cell.images.splice(avatarIndex, 1); // Remove avatar if present
            }),
        );

        // Add the avatar to the current tile's images array
        const tile = this.gridTiles[row][col];
        tile.images.push(avatar); // Add avatar image to the current tile
        this.cdr.detectChanges(); // Trigger Angular change detection to update the view
    }

    clearPath(): void {
        this.hoverPath = [];
    }

    hasTopBorder(row: number, col: number): boolean {
        return (
            this.accessibleTiles.some((tile) => tile.position.row === row && tile.position.col === col) &&
            !this.accessibleTiles.some((tile) => tile.position.row === row - 1 && tile.position.col === col)
        );
    }

    hasRightBorder(row: number, col: number): boolean {
        return (
            this.accessibleTiles.some((tile) => tile.position.row === row && tile.position.col === col) &&
            !this.accessibleTiles.some((tile) => tile.position.row === row && tile.position.col === col + 1)
        );
    }

    hasBottomBorder(row: number, col: number): boolean {
        return (
            this.accessibleTiles.some((tile) => tile.position.row === row && tile.position.col === col) &&
            !this.accessibleTiles.some((tile) => tile.position.row === row + 1 && tile.position.col === col)
        );
    }

    hasLeftBorder(row: number, col: number): boolean {
        return (
            this.accessibleTiles.some((tile) => tile.position.row === row && tile.position.col === col) &&
            !this.accessibleTiles.some((tile) => tile.position.row === row && tile.position.col === col - 1)
        );
    }
    handleTileClick(tile: any, row: number, col: number, event: MouseEvent) {
        if (this.isActive) {
            const playerPosition = this.getPlayerPosition();
            const isAdjacent = this.isAdjacent(playerPosition, { row, col });
            if (isAdjacent) {
                console.log("entre das is adjacent")
                if (this.isAvatar(tile)) {
                    const opponentAvatar = tile.images.find((image: string) => image.startsWith('assets/avatar'));
                    if (opponentAvatar) {
                        this.startCombatWithOpponent(opponentAvatar);
                        this.actionPerformed.emit();
                    }
                } 
                else if (this.isDoor(tile) || this.isDoorOpen(tile)) {
                    console.log("entre dans toggleDoor")
                    this.toggleDoorState(row, col);
                    this.actionPerformed.emit();
                }
                this.isActive = false;
          }
        } else if (event.button === 0 && !tile.isOccuped) {
            this.onTileClick(row, col);
        }
    }
    toggleDoorState(row: number, col: number): void {
        const currentImage = this.gridService.getTileType(row, col);
        const doorImage = this.tileService.getTileImageSrc('door');
        const doorOpenImage = this.tileService.getTileImageSrc('doorOpen');
        const newState = currentImage === doorImage ? doorOpenImage : doorImage;
        this.gridService.replaceImageOnTile(row, col, newState);
        this.socketService.toggleDoorState(this.sessionCode, row, col, newState);
    }

    startCombatWithOpponent(opponentAvatar: string) {
        const sessionCode = this.sessionCode;
        const myAvatar = this.playerAvatar;

        console.log('Starting combat with opponent:', {
            sessionCode,
            myAvatar,
            opponentAvatar,
        });

        // Send the combat start event to the server
        this.socketService.emitStartCombat(sessionCode, myAvatar, opponentAvatar);
    }

    // activateActionMode() {
    //     this.actionMode = true;
    // }
    isAvatar(tile: any): boolean {
        return tile.images.some((image: string) => image.startsWith('assets/avatar'));
    }
    private isDoor(tile: { images: string[] }): boolean {
        return tile.images.some((image) => image.includes('assets/tiles/Door.png'));
    }
    private isDoorOpen(tile: { images: string[] }): boolean {
        return tile.images.some((image) => image.includes('assets/tiles/Door-Open.png'));
    }

    // startCombat(tile: any) {
    //     const avatar = tile.images.find((image: string) => image.startsWith('assets/avatar'));
    //     this.emitAvatarCombat.emit(avatar);
    //     console.log('combat commencer');
    // }

    getPlayerPosition(): { row: number; col: number } {
        for (let row = 0; row < this.gridTiles.length; row++) {
            for (let col = 0; col < this.gridTiles[row].length; col++) {
                if (this.gridTiles[row][col].images.includes(this.playerAvatar)) {
                    return { row, col };
                }
            }
        }
        return { row: -1, col: -1 };

    }

    isAdjacent(playerPosition: { row: number; col: number }, targetPosition: { row: number; col: number }): boolean {
        const rowDiff = Math.abs(playerPosition.row - targetPosition.row);
        const colDiff = Math.abs(playerPosition.col - targetPosition.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
}
