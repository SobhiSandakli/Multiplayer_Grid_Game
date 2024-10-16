import { Injectable } from '@angular/core';
import { TileImages } from 'src/constants/validate-constants';
interface Offset {
    rowOffset: number;
    colOffset: number;
}
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
    private isPlacementCorrect(
        gridArray: { images: string[]; isOccuped: boolean }[][],
        row: number,
        col: number,
        offset1: Offset,
        offset2: Offset,
    ): boolean {
        return (
            this.isInBounds(gridArray, row + offset1.rowOffset, col + offset1.colOffset) &&
            this.isWall(gridArray, row + offset1.rowOffset, col + offset1.colOffset) &&
            this.isInBounds(gridArray, row + offset2.rowOffset, col + offset2.colOffset) &&
            this.isWall(gridArray, row + offset2.rowOffset, col + offset2.colOffset) &&
            this.isInBounds(gridArray, row, col) &&
            this.isTerrain(gridArray, row + offset1.rowOffset, col) &&
            this.isTerrain(gridArray, row + offset2.rowOffset, col)
        );
    }
    private isHorizontalPlacementCorrect(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        return this.isPlacementCorrect(gridArray, row, col, { rowOffset: 0, colOffset: -1 }, { rowOffset: 0, colOffset: 1 });
    }

    private isVerticalPlacementCorrect(gridArray: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        return this.isPlacementCorrect(gridArray, row, col, { rowOffset: -1, colOffset: 0 }, { rowOffset: 1, colOffset: 0 });
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
