import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-grid',
    templateUrl: './game-grid.component.html',
    styleUrls: ['./game-grid.component.scss'],
})
export class GameGridComponent implements OnInit, OnDestroy {
    @Input() sessionCode: string;
    private subscriptions: Subscription = new Subscription();
    @Input() playerAvatar: string;

    gridTiles: { images: string[]; isOccuped: boolean }[][] = [];
    accessibleTiles: { position: { row: number; col: number }; path: { row: number; col: number }[] }[] = [];

    private sourceCoords: { row: number; col: number } | null = null;
    private movingImage: string | null = null;
    isPlayerTurn: boolean = false;

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

        // Subscribe to accessible tiles updates
        const accessibleTilesSubscription = this.socketService.getAccessibleTiles(this.sessionCode).subscribe((response) => {
            this.updateAccessibleTiles(response.accessibleTiles);
        });

        this.subscriptions.add(gridArrayChangeSubscription);
        this.subscriptions.add(accessibleTilesSubscription);
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

    onDragStart(event: DragEvent, rowIndex: number, colIndex: number, image: string): void {
        event.dataTransfer?.setData('text/plain', `${rowIndex},${colIndex}`);
        this.sourceCoords = { row: rowIndex, col: colIndex };
        this.movingImage = image;
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    onDrop(event: DragEvent, rowIndex: number, colIndex: number): void {
        event.preventDefault();
        if (this.sourceCoords && this.movingImage) {
            if (this.movingImage == this.playerAvatar) {
                this.socketService.movePlayer(this.sessionCode, this.sourceCoords, { row: rowIndex, col: colIndex }, this.movingImage);
            }
            this.sourceCoords = null;
            this.movingImage = null;
        }
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
