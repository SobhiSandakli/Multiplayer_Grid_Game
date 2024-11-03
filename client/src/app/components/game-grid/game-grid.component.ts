import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChildren , QueryList,  AfterViewInit, ElementRef, HostListener} from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-grid',
    templateUrl: './game-grid.component.html',
    styleUrls: ['./game-grid.component.scss'],
})
export class GameGridComponent implements OnInit, OnDestroy ,AfterViewInit {
    @Input() sessionCode: string;
    private subscriptions: Subscription = new Subscription();
    @Input() playerAvatar: string;

    gridTiles: { images: string[]; isOccuped: boolean }[][] = [];
    accessibleTiles: { position: { row: number; col: number }; path: { row: number; col: number }[] }[] = [];
    isPlayerTurn: boolean = false;
    hoverPath: { x: number, y: number }[] = [];
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
        
        this.subscriptions.add(gridArrayChangeSubscription);
        this.subscriptions.add(accessibleTilesSubscription);
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
        const isAccessible = this.accessibleTiles.some(
            (tile) => tile.position.row === rowIndex && tile.position.col === colIndex
        );

        if (isAccessible) {
            const playerTile = this.accessibleTiles.find(tile => 
                tile.position.row === rowIndex && tile.position.col === colIndex
            );

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

        const tile = this.accessibleTiles.find(tile => tile.position.row === rowIndex && tile.position.col === colIndex);
    
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
    
                console.log(`Tile (${start.row},${start.col}) center: (${startX}, ${startY})`);
                console.log(`Tile (${end.row},${end.col}) center: (${endX}, ${endY}`);
    
                // Interpolate points between start and end
                for (let i = 0; i <= pointsPerSegment; i++) {
                    const x = startX + (endX - startX) * (i / pointsPerSegment);
                    const y = startY + (endY - startY) * (i / pointsPerSegment);
                    this.hoverPath.push({ x, y });
                }
            }
        }
    }
    
    
    

    clearPath(): void {
        this.hoverPath = [];
    }

    hasTopBorder(row: number, col: number): boolean {
        return this.accessibleTiles.some(tile => tile.position.row === row && tile.position.col === col) &&
               !this.accessibleTiles.some(tile => tile.position.row === row - 1 && tile.position.col === col);
    }

    hasRightBorder(row: number, col: number): boolean {
        return this.accessibleTiles.some(tile => tile.position.row === row && tile.position.col === col) &&
               !this.accessibleTiles.some(tile => tile.position.row === row && tile.position.col === col + 1);
    }

    hasBottomBorder(row: number, col: number): boolean {
        return this.accessibleTiles.some(tile => tile.position.row === row && tile.position.col === col) &&
               !this.accessibleTiles.some(tile => tile.position.row === row + 1 && tile.position.col === col);
    }

    hasLeftBorder(row: number, col: number): boolean {
        return this.accessibleTiles.some(tile => tile.position.row === row && tile.position.col === col) &&
               !this.accessibleTiles.some(tile => tile.position.row === row && tile.position.col === col - 1);
    }
}
