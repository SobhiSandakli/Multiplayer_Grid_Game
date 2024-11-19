import { Player } from '@app/interfaces/player/player.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ActionService {
    checkAvailableActions(player: Player, grid: { images: string[]; isOccuped: boolean }[][]): boolean {
        const positionsToCheck = [
            { row: player.position.row - 1, col: player.position.col },
            { row: player.position.row + 1, col: player.position.col },
            { row: player.position.row, col: player.position.col - 1 },
            { row: player.position.row, col: player.position.col + 1 },
        ];

        return positionsToCheck.some((position) => {
            if (position.row >= 0 && position.row < grid.length && position.col >= 0 && position.col < grid[0].length) {
                const tile = grid[position.row][position.col];
                return this.isDoor(tile) || this.hasOtherPlayer(tile, player);
            }
            return false;
        });
    }

    private isDoor(tile: { images: string[]; isOccuped: boolean }): boolean {
        const hasDoor = tile.images.some((image) => image.includes('Door-Open.png') || image.includes('Door-Closed.png'));
        return hasDoor;
    }

    private hasOtherPlayer(tile: { images: string[]; isOccuped: boolean }, player: Player): boolean {
        return tile.images.some((image) => {
            const isAvatarImage = image.startsWith('assets/avatars');
            const isOtherPlayer = image !== player.avatar;
            if (isAvatarImage && isOtherPlayer) {
                return true;
            }
            return false;
        });
    }
}
