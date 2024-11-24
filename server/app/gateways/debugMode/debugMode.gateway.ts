import { Injectable } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { TurnService } from '@app/services/turn/turn.service';
import { DebugModeService } from '@app/services/debugMode/debugMode.service';
import { EventsGateway } from '@app/gateways/events/events.gateway';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingInterval: 120000,
    pingTimeout: 600000,
})
@Injectable()
export class DebugModeGateway {
    @WebSocketServer()
    private server: Server;

    constructor(
        private readonly sessionsService: SessionsService,
        private readonly debugModeService: DebugModeService,
        private readonly changeGridService: ChangeGridService,
        private readonly turnService: TurnService,
        private readonly eventsGateaway: EventsGateway,
    ) {}

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
        void action;
        this.server.to(data.sessionCode).emit('debugModeToggled', { isDebugMode: session.isDebugMode });
        this.eventsGateaway.addEventToSession(data.sessionCode, `Le mode débogage a été ${action}.`, ['everyone']);
    }

    @SubscribeMessage('debugModeMovement')
    handleDebugModeMovement(client: Socket, data: { sessionCode: string; destination: { row: number; col: number } }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        const player = session.players.find((p) => p.socketId === client.id);
        if (!player || !this.turnService.isCurrentPlayerTurn(session, client)) return;
        if (session && player) {
            this.debugModeService.processDebugMovement(client, data.sessionCode, player, data.destination, this.server);
        } else {
            client.emit('debugMoveFailed', { reason: 'Invalid session or player' });
        }
    }
}
