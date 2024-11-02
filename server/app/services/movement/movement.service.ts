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
    
        // Initialize the path for the starting position
        paths[`${player.position.row},${player.position.col}`] = [{ ...player.position }];
    
        while (queue.length > 0) {
            const { row, col, cost } = queue.shift()!;
            // Get the current path to this tile
            const currentPath = paths[`${row},${col}`] || [];
    
            // Add to accessibleTiles if within movement cost
            if (cost <= maxMovement) {
                // Create a new entry for accessibleTiles, including the start position in the path
                accessibleTiles.push({ 
                    position: { row, col }, 
                    path: [...currentPath] // Create a copy of the current path
                });
            }
    
            // Explore neighboring tiles
            for (const { row: dRow, col: dCol } of [
                { row: -1, col: 0 }, { row: 1, col: 0 },
                { row: 0, col: -1 }, { row: 0, col: 1 }
            ]) {
                const newRow = row + dRow;
                const newCol = col + dCol;
    
                // Check if the new position is within bounds and valid for movement
                if (newRow >= 0 && newRow < grid.length && newCol >= 0 && newCol < grid[0].length) {
                    const newTile = grid[newRow][newCol];
    
                    if (this.isValidMove(newTile, grid, newRow, newCol)) {
                        const tileType = this.getTileType(newTile.images);
                        const movementCost = this.movementCosts[tileType] || 1;
                        const newCost = cost + movementCost;
    
                        if (newCost < costs[newRow][newCol]) {
                            costs[newRow][newCol] = newCost;
                            queue.push({ row: newRow, col: newCol, cost: newCost });
    
                            // Store the path to the new tile, including the starting position
                            paths[`${newRow},${newCol}`] = [...currentPath, { row: newRow, col: newCol }];
                        }
                    }
                }
            }
        }
    
        player.accessibleTiles = accessibleTiles;
    }
    
    

    private isValidMove(
        tile: { images: string[]; isOccuped: boolean },
        grid: { images: string[]; isOccuped: boolean }[][],
        row: number,
        col: number,
    ): boolean {
        // Prevent movement onto tiles with an avatar, wall, or closed door
        if (this.isWall(tile) || this.isClosedDoor(tile) || this.hasAvatar(tile)) {
            return false;
        }
    
        // Allow other tiles even if `isOccuped` is true, as it only represents non-avatar items
        return true;
    }

    private isWall(tile: { images: string[] }): boolean {
        return tile.images.some((image) => image.includes('assets/tiles/Wall.png'));
    }

    private isClosedDoor(tile: { images: string[] }): boolean {
        return tile.images.some((image) => image.includes('assets/tiles/Door-Closed.png'));
    }

    private isStartedPoint(tile: { images: string[] }): boolean {
        return tile.images.includes('assets/objects/started-points.png');
    }

    // Checks if a tile has any images that start with "assets/avatars"
    private hasAvatar(tile: { images: string[] }): boolean {
        return tile.images.some((image) => image.startsWith('assets/avatars'));
    }

    private getTileType(images: string[]): string {
        if (images.includes('assets/tiles/Ice.png')) return 'ice';
        if (images.includes('assets/tiles/Grass.png')) return 'base';
        if (images.includes('assets/tiles/Door-Open.png')) return 'doorOpen';
        if (images.includes('assets/tiles/Water.png')) return 'water';
        if (images.includes('assets/tiles/Wall.png')) return 'wall';
        if (images.includes('assets/objects/started-points.png')) return 'started-points';
        return 'base';
    }
}
