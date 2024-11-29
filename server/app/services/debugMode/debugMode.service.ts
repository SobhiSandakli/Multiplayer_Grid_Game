import { Player } from '@app/interfaces/player/player.interface';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GridCell } from '@app/interfaces/session/grid.interface';
import { MovementContext } from '@app/interfaces/player/movement.interface';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { ObjectsImages } from '@app/constants/objects-enums-constants';
import { MovementService } from '@app/services//movement/movement.service';

@Injectable()
export class DebugModeService {
    constructor(
        @Inject(forwardRef(() => SessionsService))
        private readonly sessionsService: SessionsService,
        private readonly movementService: MovementService,
    ) {}
    processDebugMovement(client: Socket, sessionCode: string, player: Player, destination: { row: number; col: number }, server: Server): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (!session) {
            client.emit('debugMoveFailed', { reason: 'Invalid session' });
            return;
        }

        const destinationTile = session.grid[destination.row][destination.col];

        if (this.isTileFree(destinationTile)) {
            const movementData = {
                sessionCode,
                source: player.position,
                destination,
                movingImage: player.avatar,
            };

            const movementContext: MovementContext = {
                client,
                player,
                session,
                movementData,
                path: { desiredPath: [player.position, destination], realPath: [player.position, destination] },
                slipOccurred: false,
                movementCost: 0,
                destination,
            };
            this.movementService['finalizeMovement'](movementContext, server);
        } else {
            server.to(client.id).emit('debugMoveFailed', { reason: 'Tile is not free' });
        }
    }
    private isTileFree(destinationTile: GridCell): boolean {
        const tile = this.movementService.getTileType(destinationTile.images);
        return destinationTile.images.every(
            (image) =>
                !image.startsWith('assets/avatars') &&
                !Object.values(ObjectsImages).includes(image as ObjectsImages) &&
                tile !== 'wall' &&
                tile !== 'door' &&
                tile !== 'doorOpen',
        );
    }
}
