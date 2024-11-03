import {
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
    ViewChildren,
    QueryList,
    AfterViewInit,
    ElementRef,
    HostListener,
} from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-grid',
    templateUrl: './game-grid.component.html',
    styleUrls: ['./game-grid.component.scss'],
})
export class GameGridComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() sessionCode: string;
    private subscriptions: Subscription = new Subscription();
    @Input() playerAvatar: string;

    gridTiles: { images: string[]; isOccuped: boolean }[][] = [];
    accessibleTiles: { position: { row: number; col: number }; path: { row: number; col: number }[] }[] = [];
    isPlayerTurn: boolean = false;
    hoverPath: { x: number; y: number }[] = [];
    tileHeight: number = 0;
    tileWidth: number = 0;

    @ViewChildren('tileContent') tileElements!: QueryList<ElementRef>;

    @HostListener('window:resize')
    onResize() {
        this.updateTileDimensions();
    }

    constructor(
        private socketService: SocketService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit() {
        const gridArrayChangeSubscription = this.socketService.getGridArrayChange$(this.sessionCode).subscribe((data) => {
            if (data) {
                this.updateGrid(data.grid);
            }
        });

        const accessibleTilesSubscription = this.socketService.getAccessibleTiles(this.sessionCode).subscribe((response) => {
            this.updateAccessibleTiles(response.accessibleTiles);
        });

        const playerMovementSubscription = this.socketService.onPlayerMovement().subscribe((movementData) => {
            this.animatePlayerMovement(movementData.avatar, movementData.desiredPath, movementData.realPath);
        });

        this.subscriptions.add(gridArrayChangeSubscription);
        this.subscriptions.add(accessibleTilesSubscription);
        this.subscriptions.add(playerMovementSubscription);
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
            const avatarImage = Array.from(tileElement.nativeElement.querySelectorAll('img') as NodeListOf<HTMLImageElement>).find(
                (img) => img.src.includes(this.playerAvatar)
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
}