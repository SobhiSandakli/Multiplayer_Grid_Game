import { Injectable } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { TurnService } from '@app/services/turn/turn.service';
import { DebugModeService } from '@app/services/debugMode/debugMode.service';

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
            this.debugModeService.processDebugMovement(client, data.sessionCode, player, data.destination, this.server);
        } else {
            client.emit('debugMoveFailed', { reason: 'Invalid session or player' });
        }
    }
}
