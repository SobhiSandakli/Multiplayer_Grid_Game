import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { CombatService } from '@app/services/combat/combat.service';
import { SessionsService } from '@app/services/sessions/sessions.service';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingInterval: 120000,
    pingTimeout: 600000,
})
@Injectable()
export class CombatGateway {
    @WebSocketServer()
    private server: Server;

    constructor(
        private readonly combatService: CombatService,
        private readonly sessionsService: SessionsService,
    ) {}

    @SubscribeMessage('startCombat')
    handleStartCombat(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionCode: string; avatar1: string; avatar2: string },
    ): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) return;

        const initiatingPlayer = session.players.find((player) => player.socketId === client.id);
        const opponentPlayer = session.players.find((player) => player.avatar === (data.avatar1 === initiatingPlayer.avatar ? data.avatar2 : data.avatar1));

        if (initiatingPlayer && opponentPlayer) {
            this.combatService.initiateCombat(data.sessionCode, initiatingPlayer, opponentPlayer, this.server);
        }
    }

    @SubscribeMessage('attack')
    handleAttack(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionCode: string; clientSocketId?: string },
    ): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) return;

        const clientSocketId = data.clientSocketId || client.id;
        const attacker = session.players.find((player) => player.socketId === clientSocketId);
        const opponent = session.combatData.combatants.find((combatant) => combatant.socketId !== clientSocketId);

        if (attacker && opponent) {
            this.combatService.executeAttack(data.sessionCode, attacker, opponent, this.server);
        }
    }

    @SubscribeMessage('evasion')
    handleEvasion(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) return;

        const player = session.players.find((p) => p.socketId === client.id);
        if (player) {
            this.combatService.attemptEvasion(data.sessionCode, player, this.server);
        }
    }
}
