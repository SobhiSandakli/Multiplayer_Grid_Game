import { Injectable } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { MovementService } from '@app/services/movement/movement.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { EVASION_DELAY, SLIP_PROBABILITY } from '@app/constants/session-gateway-constants';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingInterval: 120000,
    pingTimeout: 600000,
})
@Injectable()
export class TurnGateway {
    @WebSocketServer()
    private server: Server;

    constructor(
        private readonly sessionsService: SessionsService,
        private readonly movementService: MovementService, // Injection du MovementService
        private readonly changeGridService: ChangeGridService, // Injection du ChangeGridService
    ) {}

    @SubscribeMessage('endTurn')
    handleEndTurn(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) return;

        if (session.turnData.currentPlayerSocketId === client.id) {
            this.sessionsService.endTurn(data.sessionCode, this.server);
        }
    }

    @SubscribeMessage('getAccessibleTiles')
    handleGetAccessibleTiles(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            return;
        }

        const player = session.players.find((p) => p.socketId === client.id);
        if (!player) {
            return;
        }

        if (session.turnData.currentPlayerSocketId !== client.id) {
            return;
        }

        client.emit('accessibleTiles', { accessibleTiles: player.accessibleTiles });
    }

    @SubscribeMessage('movePlayer')
    handleMovePlayer(
        @ConnectedSocket() client: Socket,
        @MessageBody()
        data: {
            sessionCode: string;
            source: { row: number; col: number };
            destination: { row: number; col: number };
            movingImage: string;
        },
    ): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            return;
        }

        const player = session.players.find((p) => p.socketId === client.id);
        if (!player) {
            return;
        }

        if (session.turnData.currentPlayerSocketId !== client.id) {
            return;
        }

        const isAccessible = player.accessibleTiles.some((tile) => {
            return tile.position.row === data.destination.row && tile.position.col === data.destination.col;
        });

        if (isAccessible) {
            const movementCost = this.movementService.calculateMovementCost(data.source, data.destination, player, session.grid);

            if (player.attributes['speed'].currentValue >= movementCost) {
                const desiredPath = this.movementService.getPathToDestination(player, data.destination);
                if (!desiredPath) {
                    return;
                }
                let realPath = [...desiredPath];
                let slipOccurred = false;

                for (let i = 0; i < desiredPath.length; i++) {
                    const tile = session.grid[desiredPath[i].row][desiredPath[i].col];
                    const tileType = this.movementService.getTileType(tile.images);

                    if (tileType === 'ice' && Math.random() < SLIP_PROBABILITY) {
                        realPath = desiredPath.slice(0, i + 1);
                        slipOccurred = true;
                        break;
                    }
                }

                const lastTile = realPath[realPath.length - 1];
                player.position = { row: lastTile.row, col: lastTile.col };
                const moved = this.changeGridService.moveImage(session.grid, data.source, lastTile, data.movingImage);

                if (!moved) {
                    return;
                }

                player.attributes['speed'].currentValue -= movementCost;

                const lastTileType = this.movementService.getTileType(session.grid[lastTile.row][lastTile.col].images);
                if (lastTileType === 'ice') {
                    player.attributes['attack'].currentValue = player.attributes['attack'].baseValue - 2;
                    player.attributes['defence'].currentValue = player.attributes['defence'].baseValue - 2;
                } else {
                    player.attributes['attack'].currentValue = player.attributes['attack'].baseValue;
                    player.attributes['defence'].currentValue = player.attributes['defence'].baseValue;
                }

                if (slipOccurred) {
                    setTimeout(() => {
                        this.sessionsService.endTurn(data.sessionCode, this.server);
                    }, EVASION_DELAY);
                }
                this.movementService.calculateAccessibleTiles(session.grid, player, player.attributes['speed'].currentValue);
                client.emit('accessibleTiles', { accessibleTiles: player.accessibleTiles });
                this.server.to(data.sessionCode).emit('playerMovement', {
                    avatar: player.avatar,
                    desiredPath,
                    realPath,
                });
                this.server.to(data.sessionCode).emit('playerListUpdate', { players: session.players });
            }
        }
    }
}
