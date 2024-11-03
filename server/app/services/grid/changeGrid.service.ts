import { Injectable } from '@nestjs/common';
import { Player } from '@app/interfaces/player/player.interface';
import { MovementService } from '@app/services/movement/movement.service';

@Injectable()
export class ChangeGridService {
    constructor(private readonly movementService: MovementService) {}

    changeGrid(grid: { images: string[]; isOccuped: boolean }[][], players: Player[]): { images: string[]; isOccuped: boolean }[][] {
        // Filter cells with "assets/objects/started-points.png"
        const startingPoints = [];
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                if (grid[i][j].images.includes('assets/objects/started-points.png')) {
                    startingPoints.push({ x: i, y: j });
                }
            }
        }

        // Shuffle players for random assignment
        const shuffledPlayers = this.shuffle(players);

        // Assign players to starting points
        for (let index = 0; index < startingPoints.length; index++) {
            const point = startingPoints[index];
            const cell = grid[point.x][point.y];

            // If there are more starting points than players, remove excess
            if (index < shuffledPlayers.length) {
                const player = shuffledPlayers[index];
                const playerAvatar = player.avatar;

                // Add player's avatar to the images array and update position
                if (!cell.images.includes(playerAvatar)) {
                    cell.images.push(playerAvatar);
                    player.position = { row: point.x, col: point.y };

                    // // Trigger updateAccessibility for the player's new position
                    // this.movementService.calculateAccessibleTiles(grid, player, player.attributes['speed'].currentValue);
                }
            } else {
                // Remove the "started-points" image if unoccupied
                cell.images = cell.images.filter((image) => {
                    if (image === 'assets/objects/started-points.png') {
                        cell.isOccuped = false;
                        return false; // Remove the image
                    }
                    return true; // Keep other images
                });
            }
        }

        return grid; // Return the modified grid with updated positions and accessibility
    }

    private shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

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
}