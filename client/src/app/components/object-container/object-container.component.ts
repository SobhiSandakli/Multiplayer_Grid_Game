import { Component, OnInit } from '@angular/core';
import { GridSize } from '../../classes/grid-size.enum';

@Component({
    selector: 'app-object-container',
    standalone: true,
    templateUrl: './object-container.component.html',
    styleUrls: ['./object-container.component.scss'],
})
export class ObjectContainerComponent implements OnInit {
    gridSize: GridSize = GridSize.Large; // for test
    displayedNumber: number;

    ngOnInit() {
        this.displayedNumber = this.getNumberByGridSize(this.gridSize);
    }

    getNumberByGridSize(size: GridSize): number {
        if (size === GridSize.Small) {
            return 2;
        } else if (size === GridSize.Medium) {
            return 4;
        } else if (size === GridSize.Large) {
            return 6;
        } else return 0;
    }
}
