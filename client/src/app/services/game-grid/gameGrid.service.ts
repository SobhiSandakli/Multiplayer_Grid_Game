import { Injectable, Input } from '@angular/core';
import { GridFacadeService } from '../facade/gridFacade.service';
import { GridService } from '../grid/grid.service';
import { TileService } from '../tile/tile.service';

@Injectable({ providedIn: 'root' })
export class GameGridService {
    @Input() sessionCode: string;
    @Input() playerAvatar: string;
    gridTiles: { images: string[]; isOccuped: boolean }[][] = [];
    constructor(
        private gridFacade: GridFacadeService,
        private gridService: GridService,
        private tileService: TileService,
    ) {}
    setSessionCode(sessionCode: string): void {
        this.sessionCode = sessionCode;
    }
    setPlayerAvatar(playerAvatar: string): void {
        this.playerAvatar = playerAvatar;
    }
    toggleDoorState(row: number, col: number): void {
        const currentImage = this.gridService.getTileType(row, col);
        const doorImage = this.tileService.getTileImageSrc('door');
        const doorOpenImage = this.tileService.getTileImageSrc('doorOpen');
        const newState = currentImage === doorImage ? doorOpenImage : doorImage;
        this.gridService.replaceImageOnTile(row, col, newState);
        this.gridFacade.toggleDoorState(this.sessionCode, row, col, newState);
    }
    startCombatWithOpponent(opponentAvatar: string) {
        const sessionCode = this.sessionCode;
        const myAvatar = this.playerAvatar;
        this.gridFacade.emitStartCombat(sessionCode, myAvatar, opponentAvatar);
    }
    
    
}
