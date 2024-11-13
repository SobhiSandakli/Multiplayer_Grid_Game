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
import { TurnService } from '@app/services/turn/turn.service';

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
        private readonly movementService: MovementService, 
        private readonly changeGridService: ChangeGridService, 
        private readonly turnService: TurnService, 
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
        if (!session) return;

        const player = session.players.find((p) => p.socketId === client.id);
        if (!player || !this.turnService.isCurrentPlayerTurn(session, client)) return;

        if (this.movementService.isDestinationAccessible(player, data.destination)) {
            this.processPlayerMovement(client, player, session, data);
        }
    }

    private processPlayerMovement(
        client: Socket,
        player: any,
        session: any,
        data: { sessionCode: string; source: { row: number; col: number }; destination: { row: number; col: number }; movingImage: string }
    ): void {
        const movementCost = this.movementService.calculateMovementCost(data.source, data.destination, player, session.grid);

        if (player.attributes['speed'].currentValue >= movementCost) {
            const desiredPath = this.movementService.getPathToDestination(player, data.destination);
            if (!desiredPath) return;

            const { realPath, slipOccurred } = this.movementService.calculatePathWithSlips(desiredPath, session.grid);
            this.finalizeMovement(client, player, session, data, realPath, slipOccurred, movementCost);
        }
    }

    private finalizeMovement(
        client: Socket,
        player: any,
        session: any,
        data: { sessionCode: string; source: { row: number; col: number }; destination: { row: number; col: number }; movingImage: string },
        realPath: Array<{ row: number; col: number }>,
        slipOccurred: boolean,
        movementCost: number
    ): void {
        const lastTile = realPath[realPath.length - 1];
        player.position = { row: lastTile.row, col: lastTile.col };
        const moved = this.changeGridService.moveImage(session.grid, data.source, lastTile, data.movingImage);

        if (!moved) return;

        player.attributes['speed'].currentValue -= movementCost;
        this.movementService.updatePlayerAttributesOnTile(player, session.grid[lastTile.row][lastTile.col]);

        if (slipOccurred) {
            setTimeout(() => {
                this.sessionsService.endTurn(data.sessionCode, this.server);
            }, EVASION_DELAY);
        }

        this.movementService.calculateAccessibleTiles(session.grid, player, player.attributes['speed'].currentValue);
        client.emit('accessibleTiles', { accessibleTiles: player.accessibleTiles });
        this.server.to(data.sessionCode).emit('playerMovement', {
            avatar: player.avatar,
            desiredPath: realPath,
            realPath,
        });
        this.server.to(data.sessionCode).emit('playerListUpdate', { players: session.players });
    }


}
