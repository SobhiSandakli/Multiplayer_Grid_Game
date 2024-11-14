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
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { GameService } from '@app/services/game/game.service';
import { Game } from '@app/model/schema/game.schema';


@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingInterval: 120000,
    pingTimeout: 600000,
})
@Injectable()
export class GameGateway {
    @WebSocketServer()
    private server: Server;

    constructor(
        private readonly sessionsService: SessionsService,
        private readonly changeGridService: ChangeGridService, // Injection du ChangeGridService
        private readonly gameService: GameService,
    ) {}

    @SubscribeMessage('startGame')
    async handleStartGame(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): Promise<void> {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            return;
        }
        this.sessionsService.calculateTurnOrder(session);
        try {
            const game = await this.gameService.getGameById(session.selectedGameID);
            const grid = game.grid;

            session.grid = this.changeGridService.changeGrid(grid, session.players);

            this.server.to(data.sessionCode).emit('gameStarted', {
                sessionCode: data.sessionCode,
            });
            this.server.to(data.sessionCode).emit('getGameInfo', { name: game.name, size: game.size });
            this.server.to(data.sessionCode).emit('gridArray', { sessionCode: data.sessionCode, grid: session.grid });
            this.sessionsService.startTurn(data.sessionCode, this.server);
        } catch (error) {
            return;
        }
    }

    @SubscribeMessage('getGridArray')
    handleGetGridArray(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            return;
        }
        client.emit('gridArray', { sessionCode: data.sessionCode, grid: session.grid });
    }
    @SubscribeMessage('joinGame')
    handleJoinGame(@ConnectedSocket() client: Socket, @MessageBody() data: { secretCode: string; game: Game }): void {
        const session = this.sessionsService.getSession(data.secretCode);
        if (!session) {
            client.emit('joinGameResponse', {
                success: false,
                message: 'Code invalide',
            });
            return;
        }
        if (this.sessionsService.isSessionFull(session)) {
            client.emit('joinGameResponse', {
                success: false,
                message: 'Le nombre maximum de joueurs est atteint.',
            });
            return;
        }
        if (session.locked) {
            client.emit('joinGameResponse', {
                success: false,
                message: 'La salle est verrouillée.',
            });
            return;
        }
        client.join(data.secretCode);
        client.join(JSON.stringify(data.game));
        client.emit('joinGameResponse', { success: true });
        client.emit('getGameInfo', { sessionCode: data.secretCode });
        this.server.to(data.secretCode).emit('playerListUpdate', { players: session.players });
    }
}
