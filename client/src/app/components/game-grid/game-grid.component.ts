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

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }
    gridTiles: { images: string[]; isOccuped: boolean }[][] = [[{ images: ['assets/tiles/Grass.png'], isOccuped: false }]];
    private subscriptions: Subscription = new Subscription();

    constructor(
        private socketService: SocketService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit() {
        // const gridSubscription = this.gridService.gridTiles$.subscribe((gridTiles) => {
        //     this.gridTiles = gridTiles;
        // });
        // this.subscriptions.add(gridSubscription);
        //const vari = this.sessionCode;
        //console.log('app-grid', parseInt(vari));
        // const test = (data: { sessionCode: string; grid: { images: string[]; isOccuped: boolean }[][] }) => {
        //     console.log('game', parseInt(data.sessionCode));
        //     console.log(parseInt(data.sessionCode.trim()) === parseInt(vari));
        //     console.log(this);
        //     console.log(this.sessionCode.trim());
        //     console.log(parseInt(data.sessionCode.trim()));

        //     if (parseInt(data.sessionCode.trim()) == parseInt(this.sessionCode.trim())) {
        //         this.gridTiles = data.grid;
        //         console.log(this.gridTiles);
        //     }
        // };
        // test.bind(this);
        this.socketService.onGameStarted().subscribe((data) => {
            //if (parseInt(data.sessionCode.trim()) == parseInt(vari.trim())) {
            //this.gridTiles = data.grid;
            console.log(this.gridTiles);

            this.updateGrid(data.grid);
            console.log('apres update', this.gridTiles);
        });
    }

    updateGrid(newGrid: any[][]) {
        setTimeout(() => {
            console.log('newgrid', newGrid);
            //this.gridTiles = []; // Réinitialiser le tableau

            // Ajouter les nouvelles tuiles
            this.gridTiles = newGrid.map((row) => [...row]);
            // this.gridTiles = [...newGrid];

            // this.gridTiles = [...newGrid];
            // Utiliser ChangeDetectorRef pour s'assurer que Angular détecte les changements
            this.cdr.detectChanges();
            //this.cdr.markForCheck();
        }, 0);
    }

    trackByIndex(index: number, item: any): number {
        return index;
    }
}
