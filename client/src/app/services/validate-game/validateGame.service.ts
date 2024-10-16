import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoggerService } from '@app/services/LoggerService';
import { TuileValidateService } from '@app/services/validate-game/tuileValidate.service';
import {
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
export class ValidateGameService {
    constructor(
        private loggerService: LoggerService,
        private snackBar: MatSnackBar,
        private tuileValidate: TuileValidateService,
    ) {}

    openSnackBar(message: string, action: string = 'OK') {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: ['custom-snackbar'],
        });
    }

    handleValidationFailure(errorMessage: string) {
        // this.loggerService.error(errorMessage);
        this.openSnackBar(errorMessage);
    }

    validateAll(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        const surfaceAreaValid = this.isSurfaceAreaValid(gridArray);
        const accessibilityResult = this.areAllTerrainTilesAccessible(gridArray);
        const doorPlacementResult = this.tuileValidate.areDoorsCorrectlyPlaced(gridArray);
        const startPointsValid = this.areStartPointsCorrect(gridArray);

        const allValid = surfaceAreaValid && accessibilityResult.valid && doorPlacementResult.valid && startPointsValid;

        if (!allValid) {
            let errorMessage = 'Échec de la validation du jeu.\n';

            if (!surfaceAreaValid) errorMessage += '• Surface de terrain insuffisante.\n';
            if (!accessibilityResult.valid) {
                errorMessage += '• Tuile(s) inaccessibles:\n';
                accessibilityResult.errors.forEach((error) => {
                    errorMessage += '  - ' + error + '\n';
                });
            }
            if (!doorPlacementResult.valid) {
                errorMessage += '• Problèmes de placement des portes:\n';
                doorPlacementResult.errors.forEach((error) => {
                    errorMessage += '  - ' + error + '\n';
                });
            }
            if (!startPointsValid) errorMessage += '• Nombre incorrect de points de départ.\n';

            this.handleValidationFailure(errorMessage);
        } else {
            // this.loggerService.log('Validation du jeu réussie. Toutes les vérifications ont été passées.');
            this.openSnackBar('Validation du jeu réussie. Toutes les vérifications ont été passées.');
        }

        return allValid;
    }

    isSurfaceAreaValid(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        let terrainCount = 0;
        let totalTiles = 0;
        const minimumTerrainPercentage = 0.5;

        for (const row of gridArray) {
            for (const cell of row) {
                totalTiles++;
                if (cell.images && cell.images.includes('assets/tiles/Grass.png')) {
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

        const visited = this.performBFS(gridArray, startPoint, rows, cols);
        return this.tuileValidate.verifyAllTerrainTiles(gridArray, visited, rows, cols);
    }

    areStartPointsCorrect(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        let startPointCount = 0;
        for (const row of gridArray) {
            for (const cell of row) {
                if (cell.images && cell.images.includes('assets/objects/started-points.png')) {
                    startPointCount++;
                }
            }
        }

        const expectedCount = this.getExpectedStartPoints(gridArray.length);
        const isValid = startPointCount === expectedCount;
        if (!isValid) {
            this.loggerService.error(
                `La validation des points de départ a échoué : ${expectedCount} points de départ attendus, mais ${startPointCount} trouvés.`,
            );
        }
        return isValid;
    }

    findStartPoint(gridArray: { images: string[]; isOccuped: boolean }[][], rows: number, cols: number): [number, number] | null {
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (gridArray[row][col].images && gridArray[row][col].images.includes('assets/objects/started-points.png')) {
                    return [row, col];
                }
            }
        }
        return null;
    }

    performBFS(gridArray: { images: string[]; isOccuped: boolean }[][], startPoint: [number, number], rows: number, cols: number): boolean[][] {
        const queue: [number, number][] = [startPoint];
        const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
        visited[startPoint[0]][startPoint[1]] = true;

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) {
                break;
            }

            const [currentRow, currentCol] = current;
            const neighbors: [number, number][] = [
                [currentRow - 1, currentCol],
                [currentRow + 1, currentCol],
                [currentRow, currentCol - 1],
                [currentRow, currentCol + 1],
            ];

            for (const [neighborRow, neighborCol] of neighbors) {
                if (this.tuileValidate.isInBounds(gridArray, neighborRow, neighborCol)) {
                    if (!this.tuileValidate.isBlockingTile(gridArray, neighborRow, neighborCol) && !visited[neighborRow][neighborCol]) {
                        visited[neighborRow][neighborCol] = true;
                        queue.push([neighborRow, neighborCol]);
                    }
                }
            }
        }
        return visited;
    }

    getExpectedStartPoints(gridSize: number): number {
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
