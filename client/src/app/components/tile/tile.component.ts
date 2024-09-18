import { Component } from '@angular/core';

@Component({
    selector: 'app-tile',
    standalone: true,
    templateUrl: './tile.component.html',
    styleUrls: ['./tile.component.scss'],
})
export class TileComponent {
    selectedTool: string = 'base';
    isSelected: boolean = false;
    selectTool(tool: string): void {
        this.selectedTool = tool;
        this.isSelected = true;
    }

    deselectImage(event: Event) {
        this.isSelected = false;
    }
}
