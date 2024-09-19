import { Component } from '@angular/core';

@Component({
    selector: 'app-tile',
    standalone: true,
    templateUrl: './tile.component.html',
    styleUrls: ['./tile.component.scss'],
})
export class TileComponent {
    selectedTool: string = 'base';

    selectTool(tool: string): void {
        this.selectedTool = tool;
    }
}
