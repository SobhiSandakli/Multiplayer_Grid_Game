import { CharacterCreationData } from '@app/interfaces/character-creation-data/character-creation-data.interface';
import { Game } from '@app/model/schema/game.schema';
import { CombatTurnService } from '@app/services/combat-turn/combat-turn.service';
import { FightService } from '@app/services/fight/fight.service';
import { GameService } from '@app/services/game/game.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { MovementService } from '@app/services/movement/movement.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingInterval: 120000, // Ping every 2 minutes
    pingTimeout: 600000,  // Disconnect if no response within 10 minutes
})
export class SessionsGateway {
    @WebSocketServer()
    private server: Server;

    constructor(
        private readonly gameService: GameService,
        private readonly sessionsService: SessionsService,
        private readonly changeGridService: ChangeGridService,
        private readonly movementService: MovementService,
        private readonly fightService: FightService,
        private readonly combatTurnService: CombatTurnService,
    ) {}
    @SubscribeMessage('toggleDoorState')
handleToggleDoorState(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionCode: string; row: number; col: number; newState: string }
): void {
    const session = this.sessionsService.getSession(data.sessionCode);
    if (!session) {
        client.emit('error', { message: 'Session introuvable.' });
        return;
    }
    const tile = session.grid[data.row][data.col];
    const doorIndex = tile.images.findIndex((img) => img.includes('assets/tiles/Door.png'));

    if (doorIndex !== -1) {
        tile.images[doorIndex] = data.newState;
        this.server.to(data.sessionCode).emit('doorStateUpdated', {
            row: data.row,
            col: data.col,
            newState: data.newState,
        });
    }
}

    @SubscribeMessage('startGame')
    async handleStartGame(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): Promise<void> {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            client.emit('error', { message: 'Session introuvable.' });
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
            client.emit('error', { message: 'Unable to retrieve game.' });
        }
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
        if (!session) {
            client.emit('error', { message: 'Session not found.' });
            return;
        }

        const player = session.players.find((p) => p.socketId === client.id);
        if (!player) {
            client.emit('error', { message: 'Player not found.' });
            return;
        }

        if (session.currentPlayerSocketId !== client.id) {
            client.emit('error', { message: "It's not your turn." });
            return;
        }

        const isAccessible = player.accessibleTiles.some((tile) => {
            return tile.position.row === data.destination.row && tile.position.col === data.destination.col;
        });

        if (isAccessible) {
            const movementCost = this.movementService.calculateMovementCost(data.source, data.destination, player, session.grid);

            if (player.attributes['speed'].currentValue >= movementCost) {
                let desiredPath = this.movementService.getPathToDestination(player, data.destination);
                if (!desiredPath) {
                    client.emit('error', { message: 'Path not found.' });
                    return;
                }
                let realPath = [...desiredPath];
                let slipOccurred = false;

                for (let i = 0; i < desiredPath.length; i++) {
                    const tile = session.grid[desiredPath[i].row][desiredPath[i].col];
                    const tileType = this.movementService.getTileType(tile.images);

                    if (tileType === 'ice' && Math.random() < 0.1) {
                        // 10% chance of slipping
                        realPath = desiredPath.slice(0, i + 1); // Shorten realPath to the slip point
                        slipOccurred = true;
                        break;
                    }
                }

                const lastTile = realPath[realPath.length - 1];
                player.position = { row: lastTile.row, col: lastTile.col };
                const moved = this.changeGridService.moveImage(session.grid, data.source, lastTile, data.movingImage);

                if (!moved) {
                    client.emit('error', { message: 'Move failed: Target tile is occupied or image not found.' });
                    return;
                }

                player.attributes['speed'].currentValue -= movementCost;
                // Check if last tile is ice
                const lastTileType = this.movementService.getTileType(session.grid[lastTile.row][lastTile.col].images);
                if (lastTileType === 'ice') {
                    // Apply penalty on ice tile
                    player.attributes['attack'].currentValue =  player.attributes['attack'].baseValue - 2;
                    player.attributes['defence'].currentValue = player.attributes['defence'].baseValue - 2;
                } else {
                    // Reset attributes to base values if not on ice
                    player.attributes['attack'].currentValue = player.attributes['attack'].baseValue;
                    player.attributes['defence'].currentValue = player.attributes['defence'].baseValue;
                }


                if (slipOccurred) {
                    setTimeout(() => {
                        this.sessionsService.endTurn(data.sessionCode, this.server);
                    }, 500);
                }
                this.movementService.calculateAccessibleTiles(session.grid, player, player.attributes['speed'].currentValue);
                client.emit('accessibleTiles', { accessibleTiles: player.accessibleTiles });
                this.server.to(data.sessionCode).emit('playerMovement', {
                    avatar: player.avatar,
                    desiredPath,
                    realPath,
                });
                this.server.to(data.sessionCode).emit('playerListUpdate', { players: session.players });
            } else {
                client.emit('error', { message: 'Move failed: Target tile is occupied or image not found.' });
            }
        } else {
            client.emit('error', { message: 'Move failed: Insufficient speed for this move.' });
        }
    }

    @SubscribeMessage('getAccessibleTiles')
    handleGetAccessibleTiles(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            client.emit('error', { message: 'Session introuvable.' });
            return;
        }

        const player = session.players.find((p) => p.socketId === client.id);
        if (!player) {
            client.emit('error', { message: 'Player not found.' });
            return;
        }
        // Vérifier si c'est le tour du joueur
        if (session.currentPlayerSocketId !== client.id) {
            client.emit('error', { message: "Ce n'est pas votre tour." });
            return;
        }

        // Envoyer les cases accessibles au joueur actif
        client.emit('accessibleTiles', { accessibleTiles: player.accessibleTiles });
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

    @SubscribeMessage('getGridArray')
    handleGetGridArray(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            client.emit('error', { message: 'Session introuvable.' });
            return;
        }
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
    @SubscribeMessage('endTurn')
    handleEndTurn(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) return;

        if (session.currentPlayerSocketId === client.id) {
            this.sessionsService.endTurn(data.sessionCode, this.server);
        }
    }

    @SubscribeMessage('tileInfoRequest')
    async handleTileInfoRequest(client: Socket, data: { sessionCode: string; row: number; col: number }): Promise<void> {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            client.emit('error', { message: 'Session not found' });
            return;
        }

        const tile = session.grid[data.row][data.col];
        const tileInfo = {
            cost: this.movementService.getMovementCost(tile),
            effect: this.movementService.getTileEffect(tile),
        };

        client.emit('tileInfo', tileInfo);
    }

    @SubscribeMessage('avatarInfoRequest')
    async handleAvatarInfoRequest(client: Socket, data: { sessionCode: string; avatar: string }): Promise<void> {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            client.emit('error', { message: 'Session not found' });
            return;
        }

        const player = session.players.find((p) => p.avatar === data.avatar);
        if (player) {
            const avatarInfo = { name: player.name, avatar: player.avatar };
            client.emit('avatarInfo', avatarInfo);
        } else {
            client.emit('error', { message: 'Avatar not found' });
        }
    }

    @SubscribeMessage('startCombat')
    async handleStartCombat(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionCode: string; avatar1: string; avatar2: string },
    ): Promise<void> {
        const { sessionCode, avatar1, avatar2 } = data;
        const session = this.sessionsService.getSession(sessionCode);

        if (!session) {
            client.emit('error', { message: 'Session not found.' });
            return;
        }

        const initiatingPlayer = session.players.find((player) => player.socketId === client.id);
        const opponentPlayer = session.players.find((player) => player.avatar === (avatar1 === initiatingPlayer.avatar ? avatar2 : avatar1));

        if (!initiatingPlayer || !opponentPlayer) {
            client.emit('error', { message: 'One or both players not found.' });
            return;
        }

        session.combat = [initiatingPlayer, opponentPlayer];
        const firstAttacker = this.fightService.determineFirstAttacker(initiatingPlayer, opponentPlayer);

        client.to(initiatingPlayer.socketId).emit('combatStarted', {
            opponentAvatar: opponentPlayer.avatar,
            opponentName: opponentPlayer.name,
            opponentAttributes: opponentPlayer.attributes,
            startsFirst: firstAttacker.socketId === initiatingPlayer.socketId,
        });

        client.to(opponentPlayer.socketId).emit('combatStarted', {
            opponentAvatar: initiatingPlayer.avatar,
            opponentName: initiatingPlayer.name,
            opponentAttributes: initiatingPlayer.attributes,
            startsFirst: firstAttacker.socketId === opponentPlayer.socketId,
        });

        session.players
            .filter((player) => player.socketId !== initiatingPlayer.socketId && player.socketId !== opponentPlayer.socketId)
            .forEach((player) => {
                this.server.to(player.socketId).emit('combatNotification', {
                    player1: { avatar: initiatingPlayer.avatar, name: initiatingPlayer.name },
                    player2: { avatar: opponentPlayer.avatar, name: opponentPlayer.name },
                    combat: true,
                });
            });
    
                    // Start combat turns
        this.combatTurnService.startCombat(sessionCode, this.server, session);
    }

    @SubscribeMessage('endCombat')
    handleEndCombat(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            client.emit('error', { message: 'Session not found.' });
            return;
        }

        this.combatTurnService.endCombat(data.sessionCode, this.server, session);
    }

    @SubscribeMessage('attack')
    handleAttack(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const { sessionCode } = data;
        const session = this.sessionsService.getSession(sessionCode);

        if (!session) {
            client.emit('error', { message: 'Session not found.' });
            return;
        }

        const attacker = session.players.find((player) => player.socketId === client.id);
        const opponent = session.combat.find((combatant) => combatant.socketId !== attacker.socketId);

        if (!attacker || !opponent) {
            client.emit('error', { message: 'Attacker or opponent not found.' });
            return;
        }

        const { attackRoll, defenceRoll, success } = this.fightService.calculateAttack(attacker, opponent);

        if (success) {
            opponent.attributes['life'].currentValue -= 1;
            if (opponent.attributes['life'].currentValue <= 0) {
                attacker.attributes['combatWon'].currentValue += 1;
                this.server.to(opponent.socketId).emit('defeated', { message: 'Vous avez été vaincu.' });
                this.server.to(attacker.socketId).emit('opponentDefeated', { message: 'Vous avez vaincu votre adversaire.' });
                session.combat = [];
                session.players
                    .filter((player) => player.socketId !== attacker.socketId && player.socketId !== opponent.socketId)
                    .forEach((player) => {
                        this.server.to(player.socketId).emit('combatNotification', {
                            player1: {},
                            player2: {},
                            combat: false,
                        });
                    });
            }
        }

        client.emit('attackResult', { attackRoll, defenceRoll, success: success });
        this.server.to(opponent.socketId).emit('attackResult', { attackRoll, defenceRoll, success: success });
    }

    @SubscribeMessage('evasion')
    handleEvasion(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const { sessionCode } = data;
        const session = this.sessionsService.getSession(sessionCode);

        if (!session) {
            client.emit('error', { message: 'Session not found.' });
            return;
        }

        const player = session.players.find((p) => p.socketId === client.id);
        if (!player) {
            client.emit('error', { message: 'Player not found.' });
            return;
        }

        const evasionSuccess = this.fightService.calculateEvasion(player);

        client.emit('evasionResult', { success: evasionSuccess });

        if (evasionSuccess) {
            const opponent = session.combat.find((combatant) => combatant.socketId !== client.id);
            if (opponent) {
                this.server.to(opponent.socketId).emit('opponentEvaded', { playerName: player.name });
                session.combat = [];
                session.players
                    .filter((player) => player.socketId !== client.id && player.socketId !== opponent.socketId)
                    .forEach((player) => {
                        this.server.to(player.socketId).emit('combatNotification', {
                            player1: {},
                            player2: {},
                            combat: false,
                        });
                    });
            }
        }
    }
}
