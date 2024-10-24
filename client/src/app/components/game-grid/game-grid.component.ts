import { Component, OnInit } from '@angular/core';
import { GridService } from '@app/services/grid/grid.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-grid',
    templateUrl: './game-grid.component.html',
    styleUrls: ['./game-grid.component.scss'],
})
export class GameGridComponent implements OnInit {
    gridTiles: { images: string[]; isOccuped: boolean }[][];
    private subscriptions: Subscription = new Subscription();

    constructor(private gridService: GridService) {}

    ngOnInit() {
        const gridSubscription = this.gridService.gridTiles$.subscribe((gridTiles) => {
            this.gridTiles = gridTiles;
        });
        this.subscriptions.add(gridSubscription);
    }
}
