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
    @SubscribeMessage('toggleDebugMode')
    handleToggleDebugMode(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) return;

        if (session.organizerId !== client.id) {
            client.emit('error', { message: "Seul l'organisateur peut activer/désactiver le mode débogage." });
            return;
        }

        session.isDebugMode = !session.isDebugMode;
        const action = session.isDebugMode ? 'activé' : 'désactivé';
        this.server.to(data.sessionCode).emit('debugModeToggled', { isDebugMode: session.isDebugMode });

        this.server.to(data.sessionCode).emit('newEvent', {
            message: `Le mode débogage a été ${action} par l'organisateur.`,
        });
        console.log(`Debug mode ${action} for session ${data.sessionCode}`);
    }

    @SubscribeMessage('debugModeMovement')
    handleDebugModeMovement(client: Socket, data: { sessionCode: string; destination: { row: number; col: number } }): void {
        console.log(`Received debugModeMovement for session: ${data.sessionCode}, destination: (${data.destination.row}, ${data.destination.col})`);

        const session = this.sessionsService.getSession(data.sessionCode);
        const player = session.players.find((p) => p.socketId === client.id);
        if (!player || !this.turnService.isCurrentPlayerTurn(session, client)) return;
        if (session && player) {
            this.movementService.processDebugMovement(client, data.sessionCode, player, data.destination, this.server);
        } else {
            client.emit('debugMoveFailed', { reason: 'Invalid session or player' });
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

        this.movementService.handleItemDiscard(
            player,
            data.discardedItem as ObjectsImages,
            data.pickedUpItem as ObjectsImages,
            this.server,
            data.sessionCode,
        );
    }
}
