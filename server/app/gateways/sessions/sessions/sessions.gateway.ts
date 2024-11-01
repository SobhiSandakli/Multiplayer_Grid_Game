import { CharacterCreationData } from '@app/interfaces/character-creation-data/character-creation-data.interface';
import { GameService } from '@app/services/game/game.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})
export class SessionsGateway {
    @WebSocketServer()
    private server: Server;

    constructor(
        private readonly gameService: GameService,
        private readonly sessionsService: SessionsService,
    ) {}

    @SubscribeMessage('startGame')
    async handleStartGame(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): Promise<void> {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            client.emit('error', { message: 'Session introuvable.' });
            return;
        }

        try {
            const game = await this.gameService.getGameById(session.selectedGameID);
            const grid = game.grid;

            const changeGridService = new ChangeGridService();
            session.grid = changeGridService.changeGrid(grid, session.players);

            this.server.to(data.sessionCode).emit('gameStarted', {
                sessionCode: data.sessionCode,
            });

            this.server.to(data.sessionCode).emit('gridArray', { sessionCode: data.sessionCode, grid: session.grid });
        } catch (error) {
            client.emit('error', { message: 'Unable to retrieve game.' });
        }
    }

    @SubscribeMessage('createNewSession')
    handleCreateNewSession(@ConnectedSocket() client: Socket, @MessageBody() data: { maxPlayers: number; selectedGameID: string }): void {
        const sessionCode = this.sessionsService.createNewSession(client.id, data.maxPlayers, data.selectedGameID);
        client.join(sessionCode);
        client.emit('sessionCreated', { sessionCode });
    }

    @SubscribeMessage('createCharacter')
    handleCreateCharacter(@ConnectedSocket() client: Socket, @MessageBody() data: CharacterCreationData): void {
        const { sessionCode, characterData } = data;

        const validationResult = this.sessionsService.validateCharacterCreation(sessionCode, characterData, this.server);

        if (validationResult.error) {
            client.emit('error', { message: validationResult.error });
            return;
        }

        const { session, finalName, gameId } = validationResult;

        this.sessionsService.addPlayerToSession(session, client, finalName, characterData);
        client.join(sessionCode);

        client.emit('characterCreated', { name: finalName, sessionCode, gameId, attributes: characterData.attributes });
        this.server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    }

    @SubscribeMessage('joinGame')
    handleJoinGame(@ConnectedSocket() client: Socket, @MessageBody() data: { secretCode: string }): void {
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
        client.emit('joinGameResponse', { success: true });
        this.server.to(data.secretCode).emit('playerListUpdate', { players: session.players });
    }

    @SubscribeMessage('getGridArray')
    handleGetGridArray(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            client.emit('error', { message: 'Session introuvable.' });
            return;
        }

        // Emit the grid array back to the requesting client
        client.emit('gridArray', { sessionCode: data.sessionCode, grid: session.grid });
    }

    @SubscribeMessage('getTakenAvatars')
    handleGetTakenAvatars(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (session) {
            const takenAvatars = this.sessionsService.getTakenAvatars(session);
            client.emit('takenAvatars', { takenAvatars, players: session.players });
        } else {
            client.emit('error', { message: 'Session introuvable.' });
        }
    }

    @SubscribeMessage('deleteSession')
    handleDeleteSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (session && session.organizerId === client.id) {
            this.sessionsService.terminateSession(data.sessionCode);
            this.server.to(data.sessionCode).emit('sessionDeleted', { message: "La session a été supprimée par l'organisateur." });
        } else {
            client.emit('error', { message: 'Impossible de supprimer la session.' });
        }
    }

    // sessions.gateway.ts
@SubscribeMessage('leaveSession')
handleLeaveSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
  const session = this.sessionsService.getSession(data.sessionCode);

  if (!session) {
    client.emit('error', { message: 'Session introuvable.' });
    return;
  }

  if (!this.sessionsService.removePlayerFromSession(session, client.id)) {
    return;
  }

  client.leave(data.sessionCode);

  if (this.sessionsService.isOrganizer(session, client.id)) {
    this.sessionsService.terminateSession(data.sessionCode);
    this.server.to(data.sessionCode).emit('sessionDeleted', { message: "L'organisateur a quitté la session, elle est terminée." });
  } else {
    this.sessionsService.updateSessionGridForPlayerLeft(session, client.id);
    this.server.to(data.sessionCode).emit('playerListUpdate', { players: session.players });
    this.server.to(data.sessionCode).emit('gridArray', { sessionCode: data.sessionCode, grid: session.grid });
  }
}


    @SubscribeMessage('excludePlayer')
    handleExcludePlayer(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string; playerSocketId: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);

        if (!session) {
            client.emit('error', { message: 'Session introuvable.' });
            return;
        }

        this.sessionsService.removePlayerFromSession(session, data.playerSocketId);
        this.server.to(data.sessionCode).emit('playerListUpdate', { players: session.players });

        const excludedClient = this.server.sockets.sockets.get(data.playerSocketId);
        if (excludedClient) {
            excludedClient.leave(data.sessionCode);
            excludedClient.emit('excluded', { message: 'Vous avez été exclu de la session.' });
        }
    }

    @SubscribeMessage('toggleLock')
    handleToggleLock(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string; lock: boolean }): void {
        const session = this.sessionsService.getSession(data.sessionCode);

        if (!session) {
            client.emit('error', { message: 'Session introuvable.' });
            return;
        }

        this.sessionsService.toggleSessionLock(session, data.lock);
        this.server.to(data.sessionCode).emit('roomLocked', { locked: session.locked });
    }

    handleDisconnect(client: Socket): void {
        for (const sessionCode in this.sessionsService['sessions']) {
            if (Object.prototype.hasOwnProperty.call(this.sessionsService['sessions'], sessionCode)) {
                const session = this.sessionsService.getSession(sessionCode);
                if (session && this.sessionsService.removePlayerFromSession(session, client.id)) {
                    client.leave(sessionCode);

                    if (this.sessionsService.isOrganizer(session, client.id)) {
                        this.sessionsService.terminateSession(sessionCode);
                        this.server.to(sessionCode).emit('sessionDeleted', { message: "L'organisateur a quitté la session, elle est terminée." });
                    } else {
                        this.server.to(sessionCode).emit('playerListUpdate', { players: session.players });
                    }
                    break;
                }
            }
        }
    }
}
