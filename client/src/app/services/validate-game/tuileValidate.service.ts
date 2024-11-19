import { Injectable } from '@angular/core';
import { TileImages } from 'src/constants/validate-constants';

@Injectable({
    providedIn: 'root',
})
export class TuileValidateService {
    verifyAllTerrainTiles(
        gridArray: { images: string[]; isOccuped: boolean }[][],
        visited: boolean[][],
        rows: number,
        cols: number,
    ): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (this.isTerrainTile(gridArray, row, col) && !this.isTileVisited(visited, row, col)) {
                    this.logInaccessibleTile(row, col, errors);
                }
            }
        }
        return { valid: errors.length === 0, errors };
    }

    areDoorsCorrectlyPlaced(gridArray: { images: string[]; isOccuped: boolean }[][]): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        for (let row = 0; row < gridArray.length; row++) {
            for (let col = 0; col < gridArray[row].length; col++) {
                const cell = gridArray[row][col];
                if (this.isDoor(cell)) {
                    if (!this.isDoorPlacementCorrect(gridArray, row, col)) {
                        this.logDoorPlacementError(row, col, errors);
                    }
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }

    isBlockingTile(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        const blockingImages = [TileImages.Door, TileImages.Wall] as string[];
        const cell = gridArray[row][col];
        return cell && cell.images && cell.images.some((img) => blockingImages.includes(img));
    }
    isInBounds(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        const inBounds = row >= 0 && row < gridArray.length && col >= 0 && col < gridArray[row].length;
        return inBounds;
    }

    performBFS(gridArray: { images: string[]; isOccuped: boolean }[][], startPoint: [number, number], rows: number, cols: number): boolean[][] {
        const queue: [number, number][] = [startPoint];
        const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
        visited[startPoint[0]][startPoint[1]] = true;

        while (queue.length) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const [currentRow, currentCol] = queue.shift()!;

            this.getNeighbors(currentRow, currentCol).forEach(([neighborRow, neighborCol]) => {
                if (this.canVisit(gridArray, visited, neighborRow, neighborCol)) {
                    visited[neighborRow][neighborCol] = true;
                    queue.push([neighborRow, neighborCol]);
                }
            });
        }

        return visited;
    }

    private getNeighbors(row: number, col: number): [number, number][] {
        return [
            [row - 1, col],
            [row + 1, col],
            [row, col - 1],
            [row, col + 1],
        ];
    }

    private canVisit(gridArray: { images: string[]; isOccuped: boolean }[][], visited: boolean[][], row: number, col: number): boolean {
        return this.isInBounds(gridArray, row, col) && !this.isBlockingTile(gridArray, row, col) && !visited[row][col];
    }

    private isDoor(cell: { images: string[]; isOccuped: boolean }): boolean {
        return cell && cell.images && (cell.images.includes(TileImages.Door) || cell.images.includes(TileImages.OpenDoor));
    }

    private isDoorPlacementCorrect(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        const isHorizontalCorrect = this.isHorizontalPlacementCorrect(gridArray, row, col);
        const isVerticalCorrect = this.isVerticalPlacementCorrect(gridArray, row, col);
        return isHorizontalCorrect || isVerticalCorrect;
    }

    private isWall(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        return this.isInBounds(gridArray, row, col) && gridArray[row][col].images.includes(TileImages.Wall);
    }

    private isTerrain(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        if (row >= 0 && row < gridArray.length && col >= 0 && col < gridArray[row].length) {
            const cell = gridArray[row][col];
            const terrainImages = [TileImages.Grass, TileImages.Ice, TileImages.Water] as string[];
            return cell && cell.images && cell.images.some((img) => terrainImages.includes(img));
        }
        return false;
    }
    private isPlacementCorrect(horizontalCheck: boolean, verticalCheck: boolean): boolean {
        return horizontalCheck && verticalCheck;
    }

    private isHorizontalWallCheck(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        return (
            this.isInBounds(gridArray, row, col - 1) &&
            this.isWall(gridArray, row, col - 1) &&
            this.isInBounds(gridArray, row, col + 1) &&
            this.isWall(gridArray, row, col + 1)
        );
    }

    private isHorizontalTerrainCheck(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        return (
            this.isInBounds(gridArray, row, col - 1) &&
            this.isTerrain(gridArray, row, col - 1) &&
            this.isInBounds(gridArray, row, col + 1) &&
            this.isTerrain(gridArray, row, col + 1)
        );
    }

    private isVerticalWallCheck(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        return (
            this.isInBounds(gridArray, row - 1, col) &&
            this.isWall(gridArray, row - 1, col) &&
            this.isInBounds(gridArray, row + 1, col) &&
            this.isWall(gridArray, row + 1, col)
        );
    }

    private isVerticalTerrainCheck(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        return (
            this.isInBounds(gridArray, row - 1, col) &&
            this.isTerrain(gridArray, row - 1, col) &&
            this.isInBounds(gridArray, row + 1, col) &&
            this.isTerrain(gridArray, row + 1, col)
        );
    }

    private isHorizontalPlacementCorrect(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        const wallsHorizontallyTerrainsVertically =
            this.isHorizontalWallCheck(gridArray, row, col) && this.isVerticalTerrainCheck(gridArray, row, col);

        const terrainsHorizontallyWallsVertically =
            this.isHorizontalTerrainCheck(gridArray, row, col) && this.isVerticalWallCheck(gridArray, row, col);

        return (
            this.isPlacementCorrect(wallsHorizontallyTerrainsVertically, true) || this.isPlacementCorrect(terrainsHorizontallyWallsVertically, true)
        );
    }

    private isVerticalPlacementCorrect(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        const wallsHorizontallyTerrainsVertically =
            this.isHorizontalWallCheck(gridArray, row, col) && this.isVerticalTerrainCheck(gridArray, row, col);

        const terrainsHorizontallyWallsVertically =
            this.isHorizontalTerrainCheck(gridArray, row, col) && this.isVerticalWallCheck(gridArray, row, col);

        return (
            this.isPlacementCorrect(wallsHorizontallyTerrainsVertically, true) || this.isPlacementCorrect(terrainsHorizontallyWallsVertically, true)
        );
    }

    private isTileVisited(visited: boolean[][], row: number, col: number): boolean {
        return visited[row][col];
    }
    private isTerrainTile(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        return this.isTerrain(gridArray, row, col);
    }
    private logInaccessibleTile(row: number, col: number, errors: string[]): void {
        const error = `La tuile à la ligne: ${row + 1}, col: ${col + 1} est inaccessible.`;
        errors.push(error);
    }
    private logDoorPlacementError(row: number, col: number, errors: string[]): void {
        const error = `La porte à la ligne: ${row + 1}, col: ${col + 1} n'est pas bien placée.`;
        errors.push(error);
    }
}
