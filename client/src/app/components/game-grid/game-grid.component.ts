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

    gridTiles: { images: string[]; isOccuped: boolean }[][] = [];
    isPlayerTurn: boolean = false;

    constructor(private socketService: SocketService, private cdr: ChangeDetectorRef) {}

    ngOnInit() {
        const gridArrayChangeSubscription = this.socketService.getGridArrayChange$(this.sessionCode).subscribe(data => {
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
}
