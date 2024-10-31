import { Injectable } from '@nestjs/common';
import { Player } from '@app/interfaces/player/player.interface';

@Injectable()
export class ChangeGridService {
    changeGrid(grid: { images: string[]; isOccuped: boolean }[][], players: Player[]): void {
        // Filter cells with "assets/started-points.png" and not occupied
        const startingPoints = [];
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                if (
                    grid[i][j].images.includes('assets/objects/started-points.png')
                ) {
                    startingPoints.push({ x: i, y: j });
                }
            }
        }

        // Shuffle players for random assignment
        const shuffledPlayers = this.shuffle(players);

        // Add player avatars to starting points
        for (let index = 0; index < startingPoints.length; index++) {
            const point = startingPoints[index];
            const cell = grid[point.x][point.y];

            // Add player avatar if available
            if (index < shuffledPlayers.length) {
                const playerAvatar = shuffledPlayers[index].avatar;
                // Add the player's avatar to the images if not already present
                if (!cell.images.includes(playerAvatar)) {
                    cell.images.push(playerAvatar);
                }
            } else {
                // Remove excess starting points if there are no more avatars
                cell.images = cell.images.filter(image => {
                    if (image === 'assets/objects/started-points.png') {
                        // Set isOccuped to false when removing starting point
                        cell.isOccuped = false;
                        return false; // Remove the image
                    }
                    return true; // Keep the other images
                });
            }
        }

        // // Log the modified grid to the console
        // console.log(JSON.stringify(grid, null, 2));
    }

    private shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
