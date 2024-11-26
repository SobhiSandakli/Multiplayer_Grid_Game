import { EventsGateway } from '@app/gateways/events/events.gateway';
import { CharacterCreationData } from '@app/interfaces/character-creation-data/character-creation-data.interface';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingInterval: 120000,
    pingTimeout: 600000,
})
export class SessionsGateway {
    @WebSocketServer()
    private server: Server;

    constructor(
        private readonly sessionsService: SessionsService,
        private readonly eventsService: EventsGateway,
    ) {}

    @SubscribeMessage('toggleDoorState')
    handleToggleDoorState(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionCode: string; row: number; col: number; newState: string },
    ): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            return;
        }
        const tile = session.grid[data.row][data.col];
        const doorIndex = tile.images.findIndex((img) => img.includes('assets/tiles/Door.png'));
        const doorOpenIndex = tile.images.findIndex((img) => img.includes('assets/tiles/Door-Open.png'));

        if (doorIndex !== -1) {
            tile.images[doorIndex] = data.newState;
            this.server.to(data.sessionCode).emit('doorStateUpdated', {
                row: data.row,
                col: data.col,
                newState: data.newState,
            });
            this.eventsService.addEventToSession(data.sessionCode, 'Overture de la porte à la ligne ' + data.row + ' colonne ' + data.col, [
                'everyone',
            ]);
        }

        if (doorOpenIndex !== -1) {
            tile.images[doorOpenIndex] = data.newState;
            this.server.to(data.sessionCode).emit('doorStateUpdated', {
                row: data.row,
                col: data.col,
                newState: data.newState,
            });
            this.eventsService.addEventToSession(data.sessionCode, 'Fermeture de la porte à la ligne ' + data.row + ' colonne ' + data.col, [
                'everyone',
            ]);
        }
        this.server.to(data.sessionCode).emit('gridArray', { sessionCode: data.sessionCode, grid: session.grid });
    }

    @SubscribeMessage('createNewSession')
    handleCreateNewSession(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { maxPlayers: number; selectedGameID: string; mode: string },
    ): void {
        const sessionCode = this.sessionsService.createNewSession(client.id, data.maxPlayers, data.selectedGameID, data.mode);
        client.join(sessionCode);
        client.emit('sessionCreated', { sessionCode });
    }

    @SubscribeMessage('createCharacter')
    handleCreateCharacter(@ConnectedSocket() client: Socket, @MessageBody() data: CharacterCreationData): void {
        const { sessionCode, characterData } = data;

        const validationResult = this.sessionsService.validateCharacterCreation(sessionCode, characterData, this.server);

        if (validationResult.error) {
            return;
        }

        const { session, finalName, gameId } = validationResult;

        this.sessionsService.addPlayerToSession(session, client, finalName, characterData);
        client.join(sessionCode);

        client.emit('characterCreated', { name: finalName, sessionCode, gameId, attributes: characterData.attributes });
        this.server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    }

    @SubscribeMessage('getTakenAvatars')
    handleGetTakenAvatars(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (session) {
            const takenAvatars = this.sessionsService.getTakenAvatars(session);
            client.emit('takenAvatars', { takenAvatars, players: session.players });
        }
    }

    @SubscribeMessage('deleteSession')
    handleDeleteSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (session && session.organizerId === client.id) {
            this.sessionsService.terminateSession(data.sessionCode);
            this.server.to(data.sessionCode).emit('sessionDeleted', { message: "La session a été supprimée par l'organisateur." });
        }
    }

    @SubscribeMessage('leaveSession')
    handleLeaveSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);

        if (!session) {
            return;
        }

        if (!this.sessionsService.removePlayerFromSession(client.id, data.sessionCode, this.server)) {
            return;
        }

        client.leave(data.sessionCode);

        if (this.sessionsService.isOrganizer(session, client.id)) {
            this.sessionsService.terminateSession(data.sessionCode);
            this.server.to(data.sessionCode).emit('sessionDeleted', { message: "L'organisateur a quitté la session, elle est terminée." });
        } else {
            this.server.to(data.sessionCode).emit('playerListUpdate', { players: session.players });
            this.server.to(data.sessionCode).emit('gridArray', { sessionCode: data.sessionCode, grid: session.grid });
        }
    }

    @SubscribeMessage('excludePlayer')
    handleExcludePlayer(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string; playerSocketId: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);

        if (!session) {
            return;
        }

        this.sessionsService.removePlayerFromSession(data.playerSocketId, data.sessionCode, this.server);
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
            return;
        }

        this.sessionsService.toggleSessionLock(session, data.lock);
        this.server.to(data.sessionCode).emit('roomLocked', { locked: session.locked });
    }

    @SubscribeMessage('createVirtualPlayer')
    handleAddVirtualPlayer(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionCode: string; playerType: 'Aggressif' | 'Défensif' },
    ): void {
        try {
            const virtualPlayer = this.sessionsService.createVirtualPlayer(data.sessionCode, data.playerType);
            this.server.to(data.sessionCode).emit('playerListUpdate', { players: virtualPlayer.session.players });
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    handleDisconnect(client: Socket): void {
        for (const sessionCode in this.sessionsService['sessions']) {
            if (Object.prototype.hasOwnProperty.call(this.sessionsService['sessions'], sessionCode)) {
                const session = this.sessionsService.getSession(sessionCode);
                if (session && this.sessionsService.removePlayerFromSession(client.id, sessionCode, this.server)) {
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
