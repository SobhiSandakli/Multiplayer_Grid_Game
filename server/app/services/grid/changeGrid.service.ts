import { Injectable } from '@nestjs/common';
import { Player } from '@app/interfaces/player/player.interface';
@Injectable()
export class ChangeGridService {
    changeGrid(grid: { images: string[]; isOccuped: boolean }[][], players: Player[]): { images: string[]; isOccuped: boolean }[][] {
        // Filter cells with "assets/objects/started-points.png" and not occupied
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
                    
                    // Update player's position
                    shuffledPlayers[index].position = { row: point.x, col: point.y };
                }
            } else {
                // Remove excess starting points if there are no more avatars
                cell.images = cell.images.filter((image) => {
                    if (image === 'assets/objects/started-points.png') {
                        // Set isOccuped to false when removing starting point
                        cell.isOccuped = false;
                        return false; // Remove the image
                    }
                    return true; // Keep the other images
                });
            }
        }
    
        return grid; // Return the modified grid
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
