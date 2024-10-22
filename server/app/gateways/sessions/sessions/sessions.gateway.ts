import { CharacterCreationData } from '@app/interfaces/character-creation-data/character-creation-data.interface';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class SessionsGateway {
    @WebSocketServer()
    private server: Server;

    constructor(private readonly sessionsService: SessionsService) {}

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

        const { session, finalName } = validationResult;

        this.sessionsService.addPlayerToSession(session, client, finalName, characterData);
        client.join(sessionCode);

        client.emit('characterCreated', { name: finalName, sessionCode });
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

        // Ajouter le joueur à la session si elle n'est ni verrouillée ni pleine
        client.join(data.secretCode);
        client.emit('joinGameResponse', { success: true });
        this.server.to(data.secretCode).emit('playerListUpdate', { players: session.players });
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
            this.server.to(data.sessionCode).emit('playerListUpdate', { players: session.players });
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
