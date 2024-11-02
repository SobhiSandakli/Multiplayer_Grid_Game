import { Injectable } from '@nestjs/common';
import { Player } from '@app/interfaces/player/player.interface';

@Injectable()
export class MovementService {
    private movementCosts = {
        ice: 0,
        base: 1,
        doorOpen: 1,
        water: 2,
    };

    calculateAccessibleTiles(
        grid: { images: string[]; isOccuped: boolean }[][],
        player: Player,
        maxMovement: number
    ): void {
        const accessibleTiles = [];
        const costs: number[][] = Array.from({ length: grid.length }, () => Array(grid[0].length).fill(Infinity));
        const paths: { [key: string]: { row: number; col: number }[] } = {};
        const queue: Array<{ row: number, col: number, cost: number }> = [{ ...player.position, cost: 0 }];

        costs[player.position.row][player.position.col] = 0;

        while (queue.length > 0) {
            const { row, col, cost } = queue.shift()!;

            // Add to accessibleTiles if within movement cost
            if (cost <= maxMovement) {
                accessibleTiles.push({ 
                    position: { row, col }, 
                    path: [...(paths[`${row},${col}`] || []), { row, col }] 
                });
            }

            // Explore neighboring tiles
            for (const { row: dRow, col: dCol } of [
                { row: -1, col: 0 }, { row: 1, col: 0 },
                { row: 0, col: -1 }, { row: 0, col: 1 }
            ]) {
                const newRow = row + dRow;
                const newCol = col + dCol;

                if (newRow >= 0 && newRow < grid.length && newCol >= 0 && newCol < grid[0].length && !grid[newRow][newCol].isOccuped) {
                    const tileType = this.getTileType(grid[newRow][newCol].images);
                    const movementCost = this.movementCosts[tileType] || 1;
                    const newCost = cost + movementCost;

                    if (newCost < costs[newRow][newCol]) {
                        costs[newRow][newCol] = newCost;
                        queue.push({ row: newRow, col: newCol, cost: newCost });
                        paths[`${newRow},${newCol}`] = [...(paths[`${row},${col}`] || []), { row: newRow, col: newCol }];
                    }
                }
            }
        }

        // Update player's accessible tiles
        console.log(JSON.stringify(accessibleTiles, null, 2));

        player.accessibleTiles = accessibleTiles;
    }

    private isValidMove(tile: { images: string[]; isOccuped: boolean }, grid: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        if (tile.isOccuped || this.isWall(tile) || this.isClosedDoor(tile)) {
            return false;
        }
        return true;
    }

    private isWall(tile: { images: string[] }): boolean {
        return tile.images.some(image => image.includes('assets/tiles/Wall.png'));
    }

    private isClosedDoor(tile: { images: string[] }): boolean {
        return tile.images.some(image => image.includes('assets/tiles/Door-Closed.png'));
    }

    private getTileType(images: string[]): string {
        if (images.includes('assets/tiles/Ice.png')) return 'ice';
        if (images.includes('assets/tiles/Grass.png')) return 'base';
        if (images.includes('assets/tiles/Door-Open.png')) return 'doorOpen';
        if (images.includes('assets/tiles/Water.png')) return 'water';
        return 'base';
    }
}
