import { Player } from '@app/interfaces/player/player.interface';
import { Injectable } from '@nestjs/common';
import { ObjectsImages } from '@app/constants/objects-enums-constants';

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

    removePlayerAvatar(grid: { images: string[]; isOccuped: boolean }[][], player: Player): void {
        if (player.position && player.initialPosition) {
            this.removeAvatarFromPosition(grid, player.avatar, player.position);
            this.removeImageFromStartingTile(grid, player.initialPosition);
        }
    }

    removeObjectFromGrid(
        grid: { images: string[]; isOccuped: boolean }[][],
        row: number,
        col: number,
        object: ObjectsImages,
    ): void {
        const tile = grid[row][col];
        const objectIndex = tile.images.indexOf(object);
        
        if (objectIndex !== -1) {
            // Supprime l'objet de la case
            tile.images.splice(objectIndex, 1);
            // Met à jour l'état d'occupation de la case
            tile.isOccuped = tile.images.length > 0;
        }
    }

    changeGrid(grid: { images: string[]; isOccuped: boolean }[][], players: Player[]): { images: string[]; isOccuped: boolean }[][] {
        const startingPoints = this.findStartingPoints(grid);
        const shuffledPlayers = this.shuffle(players);

        this.assignPlayersToStartingPoints(grid, startingPoints, shuffledPlayers);

        return grid;
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

    private addImage(tile: { images: string[]; isOccuped: boolean }, image: string): void {
        tile.images.push(image);
        tile.isOccuped = true;
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
