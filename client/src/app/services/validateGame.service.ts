import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoggerService } from './LoggerService';

@Injectable({
    providedIn: 'root',
})
export class ValidateGameService {
    private readonly gridSize10 = 10;
    private readonly gridSize15 = 15;
    private readonly gridSize20 = 20;
    private readonly expectedStartPoints10 = 2;
    private readonly expectedStartPoints15 = 4;
    private readonly expectedStartPoints20 = 6;

    constructor(
        private loggerService: LoggerService,
        private snackBar: MatSnackBar,
    ) {} // MatSnackBar injected here

    // Method to display snackbar
    openSnackBar(message: string, action: string = 'OK') {
        this.snackBar.open(message, action, {
            duration: 5000, // Adjusted duration for demonstration
            panelClass: ['custom-snackbar'], // Apply the custom class
        });
    }

    // Method to handle validation failure
    handleValidationFailure(errorMessage: string) {
        this.loggerService.error(errorMessage);
        this.openSnackBar(errorMessage); // Replacing window.alert with snackbar
    }

    validateAll(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        const surfaceAreaValid = this.isSurfaceAreaValid(gridArray);
        const accessibilityResult = this.areAllTerrainTilesAccessible(gridArray);
        const doorPlacementResult = this.areDoorsCorrectlyPlaced(gridArray);
        const startPointsValid = this.areStartPointsCorrect(gridArray);

        const allValid = surfaceAreaValid && accessibilityResult.valid && doorPlacementResult.valid && startPointsValid;

        if (!allValid) {
            let errorMessage = 'Échec de la validation du jeu.\n'; // Start a new line for clarity

            if (!surfaceAreaValid) errorMessage += '• Surface de terrain insuffisante.\n'; // Using bullet points
            if (!accessibilityResult.valid) {
                // Make sure each error is prefixed with a bullet
                errorMessage += '• Tuile(s) inaccessibles:\n';
                accessibilityResult.errors.forEach((error) => {
                    errorMessage += '  - ' + error + '\n'; // Ensure each error has a bullet
                });
            }
            if (!doorPlacementResult.valid) {
                errorMessage += '• Problèmes de placement des portes:\n';
                doorPlacementResult.errors.forEach((error) => {
                    errorMessage += '  - ' + error + '\n'; // Nested bullet for sub-items
                });
            }
            if (!startPointsValid) errorMessage += '• Nombre incorrect de points de départ.\n';

            this.handleValidationFailure(errorMessage);
        } else {
            this.loggerService.log('Validation du jeu réussie. Toutes les vérifications ont été passées.');
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

    // Verify if all terrain tiles are accessible using BFS from the starting point
    areAllTerrainTilesAccessible(gridArray: { images: string[]; isOccuped: boolean }[][]): { valid: boolean; errors: string[] } {
        const rows = gridArray.length;
        const cols = gridArray[0].length;

        const startPoint = this.findStartPoint(gridArray, rows, cols);
        if (!startPoint) {
            // Return early without an error if no start point is found
            return { valid: true, errors: [] };
        }

        const visited = this.performBFS(gridArray, startPoint, rows, cols);
        return this.verifyAllTerrainTiles(gridArray, visited, rows, cols);
    }

    // Check if the correct number of start points are present
    areStartPointsCorrect(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        let startPointCount = 0;
        for (const row of gridArray) {
            for (const cell of row) {
                if (cell.images && cell.images.includes('../../../assets/objects/started-points.png')) {
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
                if (gridArray[row][col].images && gridArray[row][col].images.includes('../../../assets/objects/started-points.png')) {
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
                if (this.isInBounds(gridArray, neighborRow, neighborCol)) {
                    if (!this.isBlockingTile(gridArray, neighborRow, neighborCol) && !visited[neighborRow][neighborCol]) {
                        visited[neighborRow][neighborCol] = true;
                        queue.push([neighborRow, neighborCol]);
                    }
                }
            }
        }
        return visited;
    }

    verifyAllTerrainTiles(
        gridArray: { images: string[]; isOccuped: boolean }[][],
        visited: boolean[][],
        rows: number,
        cols: number,
    ): { valid: boolean; errors: string[] } {
        const errors = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (this.isTerrain(gridArray, row, col) && !visited[row][col]) {
                    const error = `La tuile de terrain à la ligne : ${row + 1}, col: ${col + 1} n'est pas accessible.`;
                    errors.push(error);
                    this.loggerService.error(error);
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }

    areDoorsCorrectlyPlaced(gridArray: { images: string[]; isOccuped: boolean }[][]): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        for (let row = 0; row < gridArray.length; row++) {
            for (let col = 0; col < gridArray[row].length; col++) {
                const cell = gridArray[row][col];
                if (this.isDoor(cell)) {
                    if (!this.isDoorPlacementCorrect(gridArray, row, col)) {
                        const error = `La porte à la ligne: ${row + 1}, col: ${col + 1} n'est pas bien placée.`;
                        errors.push(error);
                    }
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }

    isDoor(cell: { images: string[]; isOccuped: boolean }): boolean {
        return cell && cell.images && (cell.images.includes('assets/tiles/Door.png') || cell.images.includes('assets/tiles/DoorOpen.png'));
    }

    isBlockingTile(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        const blockingImages = ['assets/tiles/Door.png', 'assets/tiles/Wall.png'];
        const cell = gridArray[row][col];
        return cell && cell.images && cell.images.some((img) => blockingImages.includes(img));
    }

    isDoorPlacementCorrect(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        const isHorizontalCorrect = this.isHorizontalPlacementCorrect(gridArray, row, col);
        const isVerticalCorrect = this.isVerticalPlacementCorrect(gridArray, row, col);

        return isHorizontalCorrect || isVerticalCorrect;
    }

    isHorizontalPlacementCorrect(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        return (
            col > 0 &&
            this.isWall(gridArray, row, col - 1) &&
            col < gridArray[row].length - 1 &&
            this.isWall(gridArray, row, col + 1) &&
            row > 0 &&
            this.isTerrain(gridArray, row - 1, col) &&
            row < gridArray.length - 1 &&
            this.isTerrain(gridArray, row + 1, col)
        );
    }

    isVerticalPlacementCorrect(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        return (
            row > 0 &&
            this.isWall(gridArray, row - 1, col) &&
            row < gridArray.length - 1 &&
            this.isWall(gridArray, row + 1, col) &&
            col > 0 &&
            this.isTerrain(gridArray, row, col - 1) &&
            col < gridArray[row].length - 1 &&
            this.isTerrain(gridArray, row, col + 1)
        );
    }

    isWall(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        return this.isInBounds(gridArray, row, col) && gridArray[row][col].images.includes('assets/tiles/Wall.png');
    }

    isTerrain(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        if (row >= 0 && row < gridArray.length && col >= 0 && col < gridArray[row].length) {
            const cell = gridArray[row][col];
            // Define an array of terrain types to check
            const terrainImages = ['assets/tiles/Grass.png', 'assets/tiles/Ice.png', 'assets/tiles/Water.png'];
            // Check if any of the terrain types exist in the cell's images
            return cell && cell.images && cell.images.some((img) => terrainImages.includes(img));
        }
        return false;
    }

    isInBounds(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        const inBounds = row >= 0 && row < gridArray.length && col >= 0 && col < gridArray[row].length;
        return inBounds;
    }

    getExpectedStartPoints(gridSize: number): number {
        switch (gridSize) {
            case this.gridSize10:
                return this.expectedStartPoints10;
            case this.gridSize15:
                return this.expectedStartPoints15;
            case this.gridSize20:
                return this.expectedStartPoints20;
            default:
                return this.expectedStartPoints10; // Default case if needed
        }
    }
}
