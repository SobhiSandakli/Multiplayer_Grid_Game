import { Player } from '@app/interfaces/player/player.interface';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EVASION_DELAY, SLIP_PROBABILITY } from '@app/constants/session-gateway-constants';
import { AccessibleTile } from '@app/interfaces/player/accessible-tile.interface';
import { Position } from '@app/interfaces/player/position.interface';
import { Grid, GridCell } from '@app/interfaces/session/grid.interface';
import { MovementContext, PathInterface } from '@app/interfaces/player/movement.interface';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { Session } from '@app/interfaces/session/session.interface';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { ObjectsImages } from '@app/constants/objects-enums-constants';

@Injectable()
export class DebugModeService {
    constructor(
        private readonly changeGridService: ChangeGridService,
        @Inject(forwardRef(() => SessionsService))
        private readonly sessionsService: SessionsService,
    ) {}
    processDebugMovement(client: Socket, sessionCode: string, player: Player, destination: { row: number; col: number }, server: Server): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (!session) {
            client.emit('debugMoveFailed', { reason: 'Invalid session' });
            return;
        }

        const destinationTile = session.grid[destination.row][destination.col];

        if (this.isTileFree(destinationTile)) {
            this.changeGridService.moveImage(session.grid, player.position, destination, player.avatar);
            player.position = destination;
            server.to(sessionCode).emit('gridArray', { sessionCode, grid: session.grid });
            server.to(client.id).emit('accessibleTiles', { accessibleTiles: player.accessibleTiles });
        } else {
            server.to(client.id).emit('debugMoveFailed', { reason: 'Tile is not free' });
        }
    }
    private isTileFree(destinationTile: GridCell): boolean {
        return destinationTile.images.every(
            (image) =>
                !image.startsWith('assets/avatars') && // No avatar present
                !Object.values(ObjectsImages).includes(image as ObjectsImages), // No object present
        );
    }
}
