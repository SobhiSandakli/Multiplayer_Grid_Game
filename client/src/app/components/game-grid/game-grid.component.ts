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
    private sourceCoords: { row: number; col: number } | null = null; // Store source coordinates
    private movingImage: string | null = null; // Store the specific image being moved
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
            // S'abonner aux changements du tour
    // this.sessionService.currentPlayerSocketId$.subscribe((socketId: string) => {
    //     this.isPlayerTurn = socketId === this.socketService.getSocketId();
    //   });
  

        this.subscriptions.add(gridArrayChangeSubscription);
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    updateGrid(newGrid: { images: string[]; isOccuped: boolean }[][]) {
        this.gridTiles = newGrid;
        this.cdr.detectChanges();
    }

    onDragStart(event: DragEvent, rowIndex: number, colIndex: number, image: string): void {
        event.dataTransfer?.setData('text/plain', `${rowIndex},${colIndex}`);
        this.sourceCoords = { row: rowIndex, col: colIndex }; // Store source coordinates
        this.movingImage = image; // Store the specific image being moved
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault(); // Allow dropping by preventing the default behavior
    }

    onDrop(event: DragEvent, rowIndex: number, colIndex: number): void {
        event.preventDefault();
        if (this.sourceCoords && this.movingImage) {
            // const sourceTile = this.gridTiles[this.sourceCoords.row][this.sourceCoords.col];
            // const targetTile = this.gridTiles[rowIndex][colIndex];

            if (this.movingImage == this.playerAvatar) {
                this.socketService.movePlayer(this.sessionCode, this.sourceCoords, { row: rowIndex, col: colIndex }, this.movingImage);
            }
            this.sourceCoords = null;
            this.movingImage = null;
        }
    }
}
