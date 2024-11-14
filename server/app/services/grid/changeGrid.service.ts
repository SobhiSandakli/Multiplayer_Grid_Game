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
        const imageIndex = sourceTile.images.indexOf(movingImage);
        if (imageIndex !== -1) {
            sourceTile.images.splice(imageIndex, 1);
            targetTile.images.push(movingImage);
            return true;
        }

        return false;
    }

    removePlayerAvatar(grid: { images: string[]; isOccuped: boolean }[][], player: Player): void {
        const { avatar, position, initialPosition } = player;
        if (position && initialPosition) {
            const { row: avatarRow, col: avatarCol } = position;
            const { row: startRow, col: startCol } = initialPosition;
            const avatarTile = grid[avatarRow][avatarCol];
            const avatarIndex = avatarTile.images.indexOf(avatar);
            if (avatarIndex !== -1) {
                avatarTile.images.splice(avatarIndex, 1);
                avatarTile.isOccuped = avatarTile.images.length > 0;
            }
            const startingTile = grid[startRow][startCol];
            const startingPointIndex = startingTile.images.indexOf('assets/objects/started-points.png');
            if (startingPointIndex !== -1) {
                startingTile.images.splice(startingPointIndex, 1);
                startingTile.isOccuped = startingTile.images.length > 0;
            }
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
        const startingPoints = [];

        // Find starting points in the grid
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                if (grid[i][j].images.includes('assets/objects/started-points.png')) {
                    startingPoints.push({ x: i, y: j });
                }
            }
        }

        const shuffledPlayers = this.shuffle(players);

        // Place players on starting points
        for (let index = 0; index < startingPoints.length; index++) {
            const point = startingPoints[index];
            const cell = grid[point.x][point.y];

            if (index < shuffledPlayers.length) {
                const player = shuffledPlayers[index];
                const playerAvatar = player.avatar;

                if (!cell.images.includes(playerAvatar)) {
                    cell.images.push(playerAvatar);
                    player.position = { row: point.x, col: point.y };
                    player.initialPosition = { row: point.x, col: point.y };
                    cell.isOccuped = true;
                }
            } else {
                // Remove starting point image if no player is assigned to this cell
                cell.images = cell.images.filter((image) => {
                    if (image === 'assets/objects/started-points.png') {
                        cell.isOccuped = false;
                        return false;
                    }
                    return true;
                });
            }
        }

        return grid;
    }

    private shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
