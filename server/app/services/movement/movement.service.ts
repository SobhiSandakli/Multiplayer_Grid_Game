import { Player } from '@app/interfaces/player/player.interface';
import { Injectable } from '@nestjs/common';
import { SLIP_PROBABILITY } from '@app/constants/session-gateway-constants';

@Injectable()
export class MovementService {
    private movementCosts = {
        ice: 0,
        base: 1,
        doorOpen: 1,
        water: 2,
        wall: Infinity,
        closedDoor: Infinity,
    };
    getMovementCost(tile: { images: string[] }): number {
        const tileType = this.getTileType(tile.images);
        return this.movementCosts[tileType] || 1;
    }
    getTileEffect(tile: { images: string[] }): string {
        if (tile.images.includes('assets/tiles/Ice.png')) return 'Glissant';
        if (tile.images.includes('assets/tiles/Water.png')) return 'Lent';
        return 'Normal';
    }

    getTileType(images: string[]): string {
        if (images.includes('assets/tiles/Ice.png')) return 'ice';
        if (images.includes('assets/tiles/Grass.png')) return 'base';
        if (images.includes('assets/tiles/Door-Open.png')) return 'doorOpen';
        if (images.includes('assets/tiles/Water.png')) return 'water';
        if (images.includes('assets/tiles/Wall.png')) return 'wall';
        if (images.includes('assets/objects/started-points.png')) return 'started-points';
        return 'base';
    }
    calculateAccessibleTiles(grid: { images: string[]; isOccuped: boolean }[][], player: Player, maxMovement: number): void {
        const accessibleTiles = [];
        const { costs, paths, queue } = this.initializeStructures(grid, player);

        while (queue.length > 0) {
            const { row, col, cost } = queue.shift()!;
            const currentPath = paths[`${row},${col}`] || [];

            if (cost <= maxMovement) {
                accessibleTiles.push({
                    position: { row, col },
                    path: [...currentPath],
                });
            }

            for (const { row: dRow, col: dCol } of [
                { row: -1, col: 0 },
                { row: 1, col: 0 },
                { row: 0, col: -1 },
                { row: 0, col: 1 },
            ]) {
                const newRow = row + dRow;
                const newCol = col + dCol;

                if (newRow >= 0 && newRow < grid.length && newCol >= 0 && newCol < grid[0].length) {
                    const newTile = grid[newRow][newCol];

                    if (this.isValidMove(newTile, grid, newRow, newCol)) {
                        const tileType = this.getTileType(newTile.images);
                        const movementCost = this.movementCosts[tileType] || 1;
                        const newCost = cost + movementCost;

                        if (newCost < costs[newRow][newCol]) {
                            costs[newRow][newCol] = newCost;
                            queue.push({ row: newRow, col: newCol, cost: newCost });
                            paths[`${newRow},${newCol}`] = [...currentPath, { row: newRow, col: newCol }];
                        }
                    }
                }
            }
        }

        player.accessibleTiles = accessibleTiles;
    }

    private initializeStructures(grid: { images: string[]; isOccuped: boolean }[][], player: Player) {
        const costs: number[][] = Array.from({ length: grid.length }, () => Array(grid[0].length).fill(Infinity));
        const paths: { [key: string]: { row: number; col: number }[] } = {};
        const queue: { row: number; col: number; cost: number }[] = [{ ...player.position, cost: 0 }];

        costs[player.position.row][player.position.col] = 0;
        paths[`${player.position.row},${player.position.col}`] = [{ ...player.position }];
        return { costs, paths, queue };
    }

    calculateMovementCost(
        source: { row: number; col: number },
        destination: { row: number; col: number },
        player: Player,
        grid: { images: string[]; isOccuped: boolean }[][],
    ): number {
        const tilePath = player.accessibleTiles.find((tile) => tile.position.row === destination.row && tile.position.col === destination.col)?.path;

        if (!tilePath) {
            throw new Error('Path to destination not found in accessible tiles.');
        }
        const pathWithoutStartingTile = tilePath.slice(1);
        let totalMovementCost = 0;
        for (const position of pathWithoutStartingTile) {
            const tile = grid[position.row][position.col];
            const tileType = this.getTileType(tile.images);
            const movementCost = this.movementCosts[tileType];
            if (movementCost > 0) {
                totalMovementCost += movementCost;
            }
        }

        return totalMovementCost;
    }

    calculatePathWithSlips(
        desiredPath: Array<{ row: number; col: number }>,
        grid: any,
    ): { realPath: Array<{ row: number; col: number }>; slipOccurred: boolean } {
        let realPath = [...desiredPath];
        let slipOccurred = false;

        for (let i = 0; i < desiredPath.length; i++) {
            const tile = grid[desiredPath[i].row][desiredPath[i].col];
            const tileType = this.getTileType(tile.images);

            if (tileType === 'ice' && Math.random() < SLIP_PROBABILITY) {
                realPath = desiredPath.slice(0, i + 1);
                slipOccurred = true;
                break;
            }
        }

        return { realPath, slipOccurred };
    }

    getPathToDestination(player: Player, destination: { row: number; col: number }): { row: number; col: number }[] | null {
        const accessibleTile = player.accessibleTiles.find((tile) => tile.position.row === destination.row && tile.position.col === destination.col);

        return accessibleTile ? accessibleTile.path : null;
    }

    isDestinationAccessible(player: any, destination: { row: number; col: number }): boolean {
        return player.accessibleTiles.some((tile) => tile.position.row === destination.row && tile.position.col === destination.col);
    }

    updatePlayerAttributesOnTile(player: any, tile: any): void {
        const tileType = this.getTileType(tile.images);

        if (tileType === 'ice') {
            player.attributes['attack'].currentValue = player.attributes['attack'].baseValue - 2;
            player.attributes['defence'].currentValue = player.attributes['defence'].baseValue - 2;
        } else {
            player.attributes['attack'].currentValue = player.attributes['attack'].baseValue;
            player.attributes['defence'].currentValue = player.attributes['defence'].baseValue;
        }
    }

    private isValidMove(
        tile: { images: string[]; isOccuped: boolean },
        grid: { images: string[]; isOccuped: boolean }[][],
        row: number,
        col: number,
    ): boolean {
        return !this.isWall(tile) && !this.isClosedDoor(tile) && !this.hasAvatar(tile);
    }

    private isWall(tile: { images: string[] }): boolean {
        return tile.images.some((image) => image.includes('assets/tiles/Wall.png'));
    }

    private isClosedDoor(tile: { images: string[] }): boolean {
        return tile.images.some((image) => image.includes('assets/tiles/Door.png'));
    }

    private hasAvatar(tile: { images: string[] }): boolean {
        return tile.images.some((image) => image.startsWith('assets/avatars'));
    }
}
