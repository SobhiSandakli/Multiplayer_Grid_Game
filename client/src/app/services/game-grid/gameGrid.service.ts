import { EventEmitter, Injectable, Input, Output } from '@angular/core';
import { GridFacadeService } from '../facade/gridFacade.service';
import { GridService } from '../grid/grid.service';
import { TileService } from '../tile/tile.service';

@Injectable({ providedIn: 'root' })
export class GameGridService {
    @Input() sessionCode: string;
    @Input() playerAvatar: string;
    @Output() actionPerformed: EventEmitter<void> = new EventEmitter<void>();

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
    isAdjacent(playerPosition: { row: number; col: number }, targetPosition: { row: number; col: number }): boolean {
        const rowDiff = Math.abs(playerPosition.row - targetPosition.row);
        const colDiff = Math.abs(playerPosition.col - targetPosition.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    hasTopBorder(
        row: number,
        col: number,
        accessibleTiles: { position: { row: number; col: number }; path: { row: number; col: number }[] }[],
    ): boolean {
        return (
            accessibleTiles.some((tile) => tile.position.row === row && tile.position.col === col) &&
            !accessibleTiles.some((tile) => tile.position.row === row - 1 && tile.position.col === col)
        );
    }

    hasRightBorder(
        row: number,
        col: number,
        accessibleTiles: { position: { row: number; col: number }; path: { row: number; col: number }[] }[],
    ): boolean {
        return (
            accessibleTiles.some((tile) => tile.position.row === row && tile.position.col === col) &&
            !accessibleTiles.some((tile) => tile.position.row === row && tile.position.col === col + 1)
        );
    }

    hasBottomBorder(
        row: number,
        col: number,
        accessibleTiles: { position: { row: number; col: number }; path: { row: number; col: number }[] }[],
    ): boolean {
        return (
            accessibleTiles.some((tile) => tile.position.row === row && tile.position.col === col) &&
            !accessibleTiles.some((tile) => tile.position.row === row + 1 && tile.position.col === col)
        );
    }

    hasLeftBorder(
        row: number,
        col: number,
        accessibleTiles: { position: { row: number; col: number }; path: { row: number; col: number }[] }[],
    ): boolean {
        return (
            accessibleTiles.some((tile) => tile.position.row === row && tile.position.col === col) &&
            !accessibleTiles.some((tile) => tile.position.row === row && tile.position.col === col - 1)
        );
    }
    getPlayerPosition(gridTiles: { images: string[]; isOccuped: boolean }[][]): { row: number; col: number } {
        for (let row = 0; row < gridTiles.length; row++) {
            for (let col = 0; col < gridTiles[row].length; col++) {
                if (gridTiles[row][col].images.includes(this.playerAvatar)) {
                    return { row, col };
                }
            }
        }
        return { row: -1, col: -1 };
    }
    handleTileClick(
        isActive: boolean,
        accessibleTiles: { position: { row: number; col: number }; path: { row: number; col: number }[] }[],
        gridTiles: { images: string[]; isOccuped: boolean }[][],
        tile: { images: string[]; isOccuped: boolean },
        row: number,
        col: number,
        event: MouseEvent,
    ) {
        if (isActive) {
            const playerPosition = this.getPlayerPosition(gridTiles);
            const isAdjacent = this.isAdjacent(playerPosition, { row, col });
            if (isAdjacent) {
                if (this.isAvatar(tile)) {
                    const opponentAvatar = tile.images.find((image: string) => image.startsWith('assets/avatar'));
                    if (opponentAvatar) {
                        this.startCombatWithOpponent(opponentAvatar);
                        this.actionPerformed.emit();
                    }
                } else if (this.isDoor(tile) || this.isDoorOpen(tile)) {
                    this.toggleDoorState(row, col);
                    this.actionPerformed.emit();
                }
                isActive = false;
            }
        } else if (event.button === 0 && !tile.isOccuped) {
            this.onTileClick(row, col, accessibleTiles);
        }
    }
    onTileClick(
        rowIndex: number,
        colIndex: number,
        accessibleTiles: { position: { row: number; col: number }; path: { row: number; col: number }[] }[],
    ): void {
        const isAccessible = accessibleTiles.some((tile) => tile.position.row === rowIndex && tile.position.col === colIndex);

        if (isAccessible) {
            const playerTile = accessibleTiles.find((tile) => tile.position.row === rowIndex && tile.position.col === colIndex);

            if (playerTile) {
                const sourceCoords = accessibleTiles[0].position; // Assuming the first tile in accessibleTiles is the player's current position
                this.gridFacade.movePlayer(this.sessionCode, sourceCoords, { row: rowIndex, col: colIndex }, this.playerAvatar);
            }
        }
    }
    private isAvatar(tile: { images: string[]; isOccuped: boolean }): boolean {
        return tile.images.some((image: string) => image.startsWith('assets/avatar'));
    }
    private isDoor(tile: { images: string[] }): boolean {
        return tile.images.some((image) => image.includes('assets/tiles/Door.png'));
    }
    private isDoorOpen(tile: { images: string[] }): boolean {
        return tile.images.some((image) => image.includes('assets/tiles/Door-Open.png'));
    }
}
