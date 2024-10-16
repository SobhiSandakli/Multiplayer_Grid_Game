import { Injectable } from '@angular/core';
import { TuileValidateService } from '@app/services/validate-game/tuileValidate.service';
import { TileImages, ObjectsImages, GridSize, ExpectedPoints, MINIMUM_TERRAIN_PERCENTAGE } from 'src/constants/validate-constants';

@Injectable({
    providedIn: 'root',
})
export class GameValidateService {
    constructor(private tuileValidate: TuileValidateService) {}

    isSurfaceAreaValid(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        const totalTiles = gridArray.flat().length;
        const terrainCount = gridArray.flat().filter((cell) => this.hasImage(cell, TileImages.Grass)).length;
        return terrainCount / totalTiles > MINIMUM_TERRAIN_PERCENTAGE;
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
