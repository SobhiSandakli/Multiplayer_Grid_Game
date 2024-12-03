import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game-model.interface';
import { DragDropService } from '@app/services/drag-and-drop/drag-and-drop.service';
import { TuileValidateService } from '@app/services/validate-game/tuileValidate.service';
import { ExpectedPoints, GridSize, MINIMUM_TERRAIN_PERCENTAGE, MaxPlayers, ObjectsImages, TileImages } from 'src/constants/validate-constants';

@Injectable({
    providedIn: 'root',
})
export class GameValidateService {
    constructor(
        private tuileValidate: TuileValidateService,
        private dragAndDrop: DragDropService,
    ) {}

    isSurfaceAreaValid(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        const totalTiles = gridArray.flat().length;
        const grassCount = gridArray.flat().filter((cell) => this.hasImage(cell, TileImages.Grass)).length;
        const iceCount = gridArray.flat().filter((cell) => this.hasImage(cell, TileImages.Ice)).length;
        const waterCount = gridArray.flat().filter((cell) => this.hasImage(cell, TileImages.Water)).length;
        return (grassCount + iceCount + waterCount) / totalTiles > MINIMUM_TERRAIN_PERCENTAGE;
    }

    areAllTerrainTilesAccessible(gridArray: { images: string[]; isOccuped: boolean }[][]): { valid: boolean; errors: string[] } {
        const startPoint = this.findStartPoint(gridArray);
        if (!startPoint) return { valid: true, errors: [] };

        const visited = this.tuileValidate.performBFS(gridArray, startPoint, gridArray.length, gridArray[0].length);
        return this.tuileValidate.verifyAllTerrainTiles(gridArray, visited, gridArray.length, gridArray[0].length);
    }

    areStartPointsCorrect(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        const startPointCount = gridArray.flat().filter((cell) => this.hasImage(cell, ObjectsImages.StartPoint)).length;
        return startPointCount === this.getExpectedStartPoints(gridArray.length);
    }

    isFlagPlaced(gridArray: { images: string[]; isOccuped: boolean }[][], gameMode: string): boolean {
        if (gameMode === 'Capture the Flag') {
            return gridArray.flat().some((cell) => this.hasImage(cell, ObjectsImages.Flag));
        }
        return false;
    }
    gridMaxPlayers(game: Game): number {
        switch (game.size) {
            case '10x10':
                return MaxPlayers.SmallMaxPlayers;
            case '15x15':
                return MaxPlayers.MeduimMaxPlayers;
            case '20x20':
                return MaxPlayers.LargeMaxPlayers;
            default:
                return MaxPlayers.MeduimMaxPlayers;
        }
    }

    areTwoObjectsPlaced(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        let count = 0;
        const countMax: number = this.getExpectedStartPoints(gridArray.length);
        for (const object of this.dragAndDrop.objectsList) {
            if (object.name === 'Started Points' || object.name === 'Flag') {
                continue;
            } else if (object.count === 0 && object.name !== 'Random Items') {
                count++;
            } else if (object.name === 'Random Items') {
                count += countMax - object.count;
            }
        }
        return count >= 2;
    }
    private hasImage(cell: { images: string[] }, image: string): boolean {
        return cell.images && cell.images.includes(image);
    }

    private findStartPoint(gridArray: { images: string[]; isOccuped: boolean }[][]): [number, number] | null {
        for (let row = 0; row < gridArray.length; row++) {
            for (let col = 0; col < gridArray[row].length; col++) {
                if (this.hasImage(gridArray[row][col], ObjectsImages.StartPoint)) {
                    return [row, col];
                }
            }
        }
        return null;
    }

    private getExpectedStartPoints(gridSize: number): number {
        switch (gridSize) {
            case GridSize.Small:
                return ExpectedPoints.Small;
            case GridSize.Medium:
                return ExpectedPoints.Medium;
            case GridSize.Large:
                return ExpectedPoints.Large;
            default:
                return ExpectedPoints.Small;
        }
    }
}
