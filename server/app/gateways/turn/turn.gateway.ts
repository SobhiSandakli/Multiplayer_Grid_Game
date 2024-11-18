import { Injectable } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { MovementService } from '@app/services/movement/movement.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { TurnService } from '@app/services/turn/turn.service';
import { ObjectsImages } from '@app/constants/objects-enums-constants';

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
            this.movementService.processPlayerMovement(client, player, session, data, this.server);
        }
    }
    @SubscribeMessage('discardItem')
handleDiscardItem(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
        sessionCode: string;
        discardedItem: ObjectsImages;
        pickedUpItem: ObjectsImages;
    },
): void {
    const session = this.sessionsService.getSession(data.sessionCode);
    if (!session) return;

    const player = session.players.find((p) => p.socketId === client.id);
    if (!player) return;

    const position = player.position;
    this.movementService.handleItemDiscard(
        player,
        session,
        position,
        data.discardedItem as ObjectsImages,
        data.pickedUpItem as ObjectsImages,
        this.server,
        data.sessionCode,
    );
}

}
