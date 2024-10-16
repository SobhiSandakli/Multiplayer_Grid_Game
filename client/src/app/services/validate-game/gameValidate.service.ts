import { Injectable } from '@angular/core';
import { TuileValidateService } from '@app/services/validate-game/tuileValidate.service';
import {
    TileImages,
    ObjectsImages,
    gridSize10,
    gridSize15,
    gridSize20,
    expectedStartPoints10,
    expectedStartPoints15,
    expectedStartPoints20,
} from 'src/constants/validate-constants';

@Injectable({
    providedIn: 'root',
})
export class GameValidateService {
    constructor(private tuileValidate: TuileValidateService) {}

    isSurfaceAreaValid(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        let terrainCount = 0;
        let totalTiles = 0;
        const minimumTerrainPercentage = 0.5;

        for (const row of gridArray) {
            for (const cell of row) {
                totalTiles++;
                if (cell.images && cell.images.includes(TileImages.Grass)) {
                    terrainCount++;
                }
            }
        }
        const isValid = terrainCount / totalTiles > minimumTerrainPercentage;
        return isValid;
    }

    areAllTerrainTilesAccessible(gridArray: { images: string[]; isOccuped: boolean }[][]): { valid: boolean; errors: string[] } {
        const rows = gridArray.length;
        const cols = gridArray[0].length;
        const startPoint = this.findStartPoint(gridArray, rows, cols);

        if (!startPoint) {
            return { valid: true, errors: [] };
        }

        const visited = this.tuileValidate.performBFS(gridArray, startPoint, rows, cols);
        return this.tuileValidate.verifyAllTerrainTiles(gridArray, visited, rows, cols);
    }

    areStartPointsCorrect(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        let startPointCount = 0;
        for (const row of gridArray) {
            for (const cell of row) {
                if (cell.images && cell.images.includes(ObjectsImages.StartPoint)) {
                    startPointCount++;
                }
            }
        }

        const expectedCount = this.getExpectedStartPoints(gridArray.length);
        const isValid = startPointCount === expectedCount;
        return isValid;
    }

    private findStartPoint(gridArray: { images: string[]; isOccuped: boolean }[][], rows: number, cols: number): [number, number] | null {
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (gridArray[row][col].images && gridArray[row][col].images.includes(ObjectsImages.StartPoint)) {
                    return [row, col];
                }
            }
        }
        return null;
    }

    private getExpectedStartPoints(gridSize: number): number {
        switch (gridSize) {
            case gridSize10:
                return expectedStartPoints10;
            case gridSize15:
                return expectedStartPoints15;
            case gridSize20:
                return expectedStartPoints20;
            default:
                return expectedStartPoints10;
        }
    }
}
