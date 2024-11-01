import { Injectable } from '@nestjs/common';

@Injectable()
export class MovementService {
    private movementCosts = {
        ice: 0,
        base: 1,
        doorOpen: 1,
        water: 2,
    };

    canMove(grid: { images: string[]; isOccuped: boolean }[][], source: { row: number; col: number }, destination: { row: number; col: number }, speed: number): boolean {
        const cost = this.calculateMovementCost(grid, source, destination);
        return cost <= speed;
    }

    private calculateMovementCost(grid: { images: string[]; isOccuped: boolean }[][], source: { row: number; col: number }, destination: { row: number; col: number }): number {
        const rows = grid.length;
        const cols = grid[0].length;
        const costs: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
        const priorityQueue: Array<{ cost: number, pos: { row: number, col: number } }> = [];

        costs[source.row][source.col] = 0;
        priorityQueue.push({ cost: 0, pos: source });

        const directions = [
            { row: -1, col: 0 }, // up
            { row: 1, col: 0 },  // down
            { row: 0, col: -1 }, // left
            { row: 0, col: 1 },  // right
        ];

        while (priorityQueue.length > 0) {
            priorityQueue.sort((a, b) => a.cost - b.cost); // Sort by cost
            const current = priorityQueue.shift();
            if (!current) break;

            const { row, col } = current.pos;

            // If we've reached the destination, return the cost
            if (row === destination.row && col === destination.col) {
                return costs[row][col];
            }

            for (const direction of directions) {
                const newRow = row + direction.row;
                const newCol = col + direction.col;

                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                    const tile = grid[newRow][newCol];
                    
                    // Check if the tile is a valid move
                    if (this.isValidMove(tile, grid, newRow, newCol)) {
                        const tileType = this.getTileType(tile.images);
                        const moveCost = this.movementCosts[tileType];

                        const newCost = costs[row][col] + moveCost;

                        if (newCost < costs[newRow][newCol]) {
                            costs[newRow][newCol] = newCost;
                            priorityQueue.push({ cost: newCost, pos: { row: newRow, col: newCol } });
                        }
                    }
                }
            }
        }

        // If destination is not reachable, return Infinity
        return Infinity;
    }

    private isValidMove(tile: { images: string[]; isOccuped: boolean }, grid: { images: string[]; isOccuped: boolean }[][], row: number, col: number): boolean {
        // Check if the tile is occupied by a player
        if (tile.isOccuped) {
            return false;
        }

        // Check for walls or closed doors
        if (this.isWall(tile) || this.isClosedDoor(tile)) {
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
        return 'base'; // Default tile type
    }
}
