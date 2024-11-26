import { ObjectsImages, TERRAIN_TYPES, DOOR } from '@app/constants/objects-enums-constants';
import { Player } from '@app/interfaces/player/player.interface';
import { Position } from '@app/interfaces/player/position.interface';
import { Grid } from '@app/interfaces/session/grid.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChangeGridService {
    moveImage(
        grid: { images: string[]; isOccuped: boolean }[][],
        source: { row: number; col: number },
        destination: { row: number; col: number },
        movingImage: string,
    ): boolean {
        const sourceTile = grid[source.row][source.col];
        const targetTile = grid[destination.row][destination.col];

        if (this.removeImage(sourceTile, movingImage)) {
            this.addImage(targetTile, movingImage);
            return true;
        }

        return false;
    }

    removeObjectFromGrid(grid: { images: string[]; isOccuped: boolean }[][], row: number, col: number, object: ObjectsImages): void {
        const tile = grid[row][col];
        this.removeImage(tile, object);
        tile.isOccuped = tile.images.length > 0;
    }

    changeGrid(grid: { images: string[]; isOccuped: boolean }[][], players: Player[]): { images: string[]; isOccuped: boolean }[][] {
        const startingPoints = this.findStartingPoints(grid);
        const shuffledPlayers = this.shuffle(players);

        this.assignPlayersToStartingPoints(grid, startingPoints, shuffledPlayers);
        this.replaceRandomItemsWithUniqueItems(grid);

        return grid;
    }
    addImage(tile: { images: string[]; isOccuped: boolean }, image: string): void {
        tile.images.push(image);
        tile.isOccuped = true;
    }
    removePlayerAvatar(grid: { images: string[]; isOccuped: boolean }[][], player: Player): void {
        if (player.position && player.initialPosition) {
            this.removeAvatarFromPosition(grid, player.avatar, player.position);
            this.removeImageFromStartingTile(grid, player.initialPosition);
        }
    }

    countTotalTerrainTiles(grid: { images: string[]; isOccuped: boolean }[][]): number {
        let terrainTileCount = 0;

        for (const row of grid) {
            for (const tile of row) {
                if (tile.images.some((image) => TERRAIN_TYPES.includes(image))) {
                    terrainTileCount++;
                }
            }
        }

        return terrainTileCount;
    }
    countTotalDoors(grid: { images: string[]; isOccuped: boolean }[][]): number {
        let doorCount = 0;

        for (const row of grid) {
            for (const tile of row) {
                if (tile.images.includes(DOOR)) {
                    doorCount++;
                }
            }
        }

        return doorCount;
    }

    getAdjacentPositions(position: Position, grid: Grid): Position[] {
        const directions = [
            { row: -1, col: 0 }, // Up
            { row: 1, col: 0 }, // Down
            { row: 0, col: -1 }, // Left
            { row: 0, col: 1 }, // Right
        ];

        const adjacentPositions: Position[] = [];

        directions.forEach((dir) => {
            const newRow = position.row + dir.row;
            const newCol = position.col + dir.col;
            if (this.isInBounds({ row: newRow, col: newCol }, grid)) {
                adjacentPositions.push({ row: newRow, col: newCol });
            }
        });

        return adjacentPositions;
    }

    isInBounds(position: Position, grid: { images: string[]; isOccuped: boolean }[][]): boolean {
        return position.row >= 0 && position.row < grid.length && position.col >= 0 && position.col < grid[0].length;
    }

    private replaceRandomItemsWithUniqueItems(grid: { images: string[]; isOccuped: boolean }[][]): void {
        const availableItems = this.getAvailableRandomItems(grid);

        const randomItemPositions: { row: number; col: number }[] = [];
        grid.forEach((row, rowIndex) => {
            row.forEach((tile, colIndex) => {
                if (tile.images.includes(ObjectsImages.RandomItems)) {
                    randomItemPositions.push({ row: rowIndex, col: colIndex });
                }
            });
        });

        randomItemPositions.forEach((position, index) => {
            const tile = grid[position.row][position.col];
            if (index < availableItems.length) {
                const newItem = availableItems[index];
                this.removeImage(tile, ObjectsImages.RandomItems);
                this.addImage(tile, newItem);
            }
            tile.isOccuped = tile.images.length > 0;
        });
    }

    private getAvailableRandomItems(grid: { images: string[]; isOccuped: boolean }[][]): string[] {
        const itemsOnGrid = new Set<string>();
        grid.forEach((row) => {
            row.forEach((tile) => {
                tile.images.forEach((image) => {
                    if (image !== ObjectsImages.RandomItems) {
                        itemsOnGrid.add(image);
                    }
                });
            });
        });

        const availableItems = Object.values(ObjectsImages).filter((item) => item !== ObjectsImages.RandomItems && !itemsOnGrid.has(item));

        return availableItems;
    }

    private removeImage(tile: { images: string[]; isOccuped: boolean }, image: string): boolean {
        const index = tile.images.indexOf(image);
        if (index !== -1) {
            tile.images.splice(index, 1);
            tile.isOccuped = tile.images.length > 0;
            return true;
        }
        return false;
    }

    private removeAvatarFromPosition(
        grid: { images: string[]; isOccuped: boolean }[][],
        avatar: string,
        position: { row: number; col: number },
    ): void {
        const tile = grid[position.row][position.col];
        this.removeImage(tile, avatar);
    }

    private removeImageFromStartingTile(grid: { images: string[]; isOccuped: boolean }[][], startPosition: { row: number; col: number }): void {
        const tile = grid[startPosition.row][startPosition.col];
        this.removeImage(tile, 'assets/objects/started-points.png');
    }

    private findStartingPoints(grid: { images: string[]; isOccuped: boolean }[][]): { x: number; y: number }[] {
        const startingPoints = [];
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                if (grid[i][j].images.includes('assets/objects/started-points.png')) {
                    startingPoints.push({ x: i, y: j });
                }
            }
        }
        return startingPoints;
    }

    private assignPlayersToStartingPoints(
        grid: { images: string[]; isOccuped: boolean }[][],
        startingPoints: { x: number; y: number }[],
        players: Player[],
    ): void {
        startingPoints.forEach((point, index) => {
            const cell = grid[point.x][point.y];
            const player = players[index];
            if (player) {
                this.placePlayerOnCell(cell, player, point);
            } else {
                this.removeStartingPointImage(cell);
            }
        });
    }

    private placePlayerOnCell(cell: { images: string[]; isOccuped: boolean }, player: Player, point: { x: number; y: number }): void {
        if (!cell.images.includes(player.avatar)) {
            cell.images.push(player.avatar);
            player.position = { row: point.x, col: point.y };
            player.initialPosition = { row: point.x, col: point.y };
            cell.isOccuped = true;
        }
    }

    private removeStartingPointImage(cell: { images: string[]; isOccuped: boolean }): void {
        cell.images = cell.images.filter((image) => image !== 'assets/objects/started-points.png');
        cell.isOccuped = cell.images.length > 0;
    }

    private shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
