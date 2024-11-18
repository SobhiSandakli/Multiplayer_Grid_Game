import { EventsGateway } from '@app/gateways/events/events.gateway';
import { Player } from '@app/interfaces/player/player.interface';
import { Session } from '@app/interfaces/session/session.interface';
import { ActionService } from '@app/services/action/action.service';
import { MovementService } from '@app/services/movement/movement.service';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TURN_DURATION, NEXT_TURN_NOTIFICATION_DELAY, THOUSAND, THREE_THOUSAND } from '@app/constants/turn-constants';
import { Position } from '@app/interfaces/player/position.interface';
import { AccessibleTile } from '@app/interfaces/player/accessible-tile.interface';

@Injectable()
export class TurnService {
    private isActionPossible: boolean = false;

    constructor(
        private readonly movementService: MovementService,
        private readonly eventsService: EventsGateway,
        private readonly actionService: ActionService,
    ) {}

    startTurn(sessionCode: string, server: Server, sessions: { [key: string]: Session }, startingPlayerSocketId?: string): void {
        const session = sessions[sessionCode];
        if (!session) return;
        if (session.combatData.combatants.length > 0) {
            server.to(sessionCode).emit('turnPaused', { message: 'Le tour est en pause pour le combat en cours.' });
            return;
        }
        if (startingPlayerSocketId) {
            session.turnData.currentTurnIndex = session.turnData.turnOrder.indexOf(startingPlayerSocketId);
        } else {
            this.advanceTurnIndex(session);
        }
        this.setCurrentPlayer(session);
        session.turnData.timeLeft = TURN_DURATION;

        const currentPlayer = this.getCurrentPlayer(session);

        if (currentPlayer.isVirtual) {
            console.log('Virtual player turn');
            this.resetPlayerSpeed(currentPlayer);
            this.calculateAccessibleTiles(session, currentPlayer);
            this.eventsService.addEventToSession(sessionCode, 'Le tour de ' + currentPlayer.name + ' commence.', ['everyone']);
            this.handleVirtualPlayerTurn(sessionCode, server, sessions, currentPlayer, session);
            return;
        }

        if (currentPlayer) {
            this.resetPlayerSpeed(currentPlayer);
            this.calculateAccessibleTiles(session, currentPlayer);

            this.isActionPossible = this.actionService.checkAvailableActions(currentPlayer, session.grid);
            if (this.isMovementRestricted(currentPlayer) && !this.isActionPossible) {
                this.handleNoMovement(sessionCode, server, sessions, currentPlayer);
                return;
            }
            this.eventsService.addEventToSession(sessionCode, 'Le tour de ' + currentPlayer.name + ' commence.', ['everyone']);
            this.notifyPlayerOfAccessibleTiles(server, sessionCode, currentPlayer);
            this.notifyOthersOfRestrictedTiles(server, session, currentPlayer);
            this.notifyAllPlayersOfNextTurn(server, sessionCode, session);

            setTimeout(() => {
                this.startTurnTimer(sessionCode, server, sessions, currentPlayer);
            }, THREE_THOUSAND);
        }
    }

    // turn.service.ts

    // turn.service.ts

    private handleVirtualPlayerTurn(
        sessionCode: string,
        server: Server,
        sessions: { [key: string]: Session },
        player: Player,
        session: Session,
    ): void {
        if (player.type === 'Aggressif') {
            const closestPlayer = this.getClosestPlayer(session, player);
            if (closestPlayer) {
                // Get adjacent positions around the closest player
                const adjacentPositions = this.movementService.getAdjacentPositions(closestPlayer.position, session.grid);
                const accessiblePositions = adjacentPositions.filter((pos) => this.movementService.isPositionAccessible(pos, session.grid));

                const paths = accessiblePositions
                    .map((pos) => {
                        // Calculate path to each accessible adjacent position
                        this.movementService.calculateAccessibleTiles(session.grid, player, Infinity);
                        const path = this.movementService.getPathToDestination(player, pos);
                        // Reset accessible tiles with actual movement range
                        this.movementService.calculateAccessibleTiles(session.grid, player, player.attributes['speed'].currentValue);
                        if (path) {
                            const movementCost = this.movementService.calculatePathMovementCost(path, session.grid);
                            return { path, movementCost };
                        }
                        return null;
                    })
                    .filter((item) => item !== null);

                if (paths.length > 0) {
                    // Choose the path with the lowest movement cost
                    paths.sort((a, b) => a.movementCost - b.movementCost);
                    const chosenPath = paths[0];

                    // Determine how far the player can move along the path
                    const movementRange = player.attributes['speed'].currentValue;
                    const stepsToMove = Math.min(movementRange, chosenPath.path.length - 1);
                    const destination = chosenPath.path[stepsToMove];

                    // For virtual players, client socket is undefined
                    this.movementService.processPlayerMovement(
                        undefined, // No client socket
                        player,
                        session,
                        {
                            sessionCode,
                            source: player.position,
                            destination,
                            movingImage: player.avatar,
                        },
                        server,
                    );
                }
            }
        } else if (player.type === 'Défensif') {
            // Existing logic for defensive players...
        }

        // End turn after movement
        setTimeout(() => {
            this.endTurn(sessionCode, server, sessions);
        }, TURN_DURATION);
    }

    private getClosestPlayer(session: Session, virtualPlayer: Player): Player | null {
        let closestPlayer: Player | null = null;
        let minDistance = Infinity;

        session.players.forEach((player) => {
            if (player.socketId !== virtualPlayer.socketId) {
                const distance = this.calculateDistance(virtualPlayer.position, player.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPlayer = player;
                }
            }
        });

        return closestPlayer;
    }

    private calculateDistance(pos1: Position, pos2: Position): number {
        return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
    }

    private getRandomAccessibleTile(accessibleTiles: AccessibleTile[]): AccessibleTile | null {
        if (accessibleTiles.length === 0) return null;
        return accessibleTiles[Math.floor(Math.random() * accessibleTiles.length)];
    }

    isCurrentPlayerTurn(session: Session, client: Socket): boolean {
        return session.turnData.currentPlayerSocketId === client.id;
    }

    endTurn(sessionCode: string, server: Server, sessions: { [key: string]: Session }): void {
        const session = sessions[sessionCode];
        if (!session) return;

        this.clearTurnTimer(session);

        this.notifyPlayerListUpdate(server, sessionCode, session);
        this.notifyTurnEnded(server, sessionCode, session);

        if (session.combatData.combatants.length <= 0) {
            this.startTurn(sessionCode, server, sessions);
        }
    }

    sendTimeLeft(sessionCode: string, server: Server, sessions: { [key: string]: Session }): void {
        const session = sessions[sessionCode];
        if (!session) return;

        server.to(sessionCode).emit('timeLeft', {
            timeLeft: session.turnData.timeLeft,
            playerSocketId: session.turnData.currentPlayerSocketId,
        });
    }

    clearTurnTimer(session: Session): void {
        if (session.turnData.turnTimer) {
            clearInterval(session.turnData.turnTimer);
            session.turnData.turnTimer = null;
        }
    }

    calculateTurnOrder(session: Session): void {
        const players = this.getSortedPlayersBySpeed(session.players);
        const groupedBySpeed = this.groupPlayersBySpeed(players);
        const sortedPlayers = this.createTurnOrderFromGroups(groupedBySpeed);

        session.turnData.turnOrder = sortedPlayers.map((player) => player.socketId);
        session.turnData.currentTurnIndex = -1;
    }

    private getSortedPlayersBySpeed(players: Player[]): Player[] {
        return players.slice().sort((a, b) => b.attributes.speed.currentValue - a.attributes.speed.currentValue);
    }

    private groupPlayersBySpeed(players: Player[]): { [key: number]: Player[] } {
        const groupedBySpeed: { [key: number]: Player[] } = {};
        players.forEach((player) => {
            const speed = player.attributes.speed.currentValue;
            if (!groupedBySpeed[speed]) {
                groupedBySpeed[speed] = [];
            }
            groupedBySpeed[speed].push(player);
        });
        return groupedBySpeed;
    }

    private createTurnOrderFromGroups(groupedBySpeed: { [key: number]: Player[] }): Player[] {
        const sortedPlayers: Player[] = [];
        Object.keys(groupedBySpeed)
            .sort((a, b) => parseInt(b, 10) - parseInt(a, 10))
            .forEach((speed) => {
                const group = groupedBySpeed[parseInt(speed, 10)];
                this.shuffle(group);
                sortedPlayers.push(...group);
            });
        return sortedPlayers;
    }

    private shuffle(array: Player[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    private advanceTurnIndex(session: Session): void {
        session.turnData.currentTurnIndex = (session.turnData.currentTurnIndex + 1) % session.turnData.turnOrder.length;
    }

    private setCurrentPlayer(session: Session): void {
        session.turnData.currentPlayerSocketId = session.turnData.turnOrder[session.turnData.currentTurnIndex];
    }

    private getCurrentPlayer(session: Session): Player | undefined {
        return session.players.find((p) => p.socketId === session.turnData.currentPlayerSocketId);
    }

    private resetPlayerSpeed(player: Player): void {
        player.attributes['speed'].currentValue = player.attributes['speed'].baseValue;
    }

    private calculateAccessibleTiles(session: Session, player: Player): void {
        this.movementService.calculateAccessibleTiles(session.grid, player, player.attributes['speed'].currentValue);
    }

    private isMovementRestricted(player: Player): boolean {
        return player.accessibleTiles.length <= 1;
    }

    private handleNoMovement(sessionCode: string, server: Server, sessions: { [key: string]: Session }, player: Player): void {
        server.to(sessionCode).emit('noMovementPossible', { playerName: player.name });
        setTimeout(() => {
            this.endTurn(sessionCode, server, sessions);
        }, THREE_THOUSAND);
    }

    private notifyPlayerOfAccessibleTiles(server: Server, sessionCode: string, player: Player): void {
        server.to(player.socketId).emit('accessibleTiles', { accessibleTiles: player.accessibleTiles });
    }

    private notifyOthersOfRestrictedTiles(server: Server, session: Session, currentPlayer: Player): void {
        session.players
            .filter((player) => player.socketId !== currentPlayer.socketId)
            .forEach((player) => {
                server.to(player.socketId).emit('accessibleTiles', { accessibleTiles: [] });
            });
    }

    private notifyAllPlayersOfNextTurn(server: Server, sessionCode: string, session: Session): void {
        server.to(sessionCode).emit('nextTurnNotification', {
            playerSocketId: session.turnData.currentPlayerSocketId,
            inSeconds: NEXT_TURN_NOTIFICATION_DELAY,
        });
    }

    private startTurnTimer(sessionCode: string, server: Server, sessions: { [key: string]: Session }, currentPlayer: Player): void {
        const session = sessions[sessionCode];
        if (!session) return;
        if (!session.turnData.currentPlayerSocketId) return;
        server.to(sessionCode).emit('turnStarted', {
            playerSocketId: session.turnData.currentPlayerSocketId,
        });
        this.sendTimeLeft(sessionCode, server, sessions);

        session.turnData.turnTimer = setInterval(() => {
            session.turnData.timeLeft--;

            this.calculateAccessibleTiles(session, currentPlayer);
            this.isActionPossible = this.actionService.checkAvailableActions(currentPlayer, session.grid);
            if (this.isMovementRestricted(currentPlayer) && !this.isActionPossible) {
                server.to(sessionCode).emit('noMovementPossible', { playerName: currentPlayer.name });
                this.endTurn(sessionCode, server, sessions);
                return;
            }

            if (session.turnData.timeLeft <= 0) {
                this.endTurn(sessionCode, server, sessions);
            } else {
                this.sendTimeLeft(sessionCode, server, sessions);
            }
        }, THOUSAND);
    }

    private notifyPlayerListUpdate(server: Server, sessionCode: string, session: Session): void {
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    }

    private notifyTurnEnded(server: Server, sessionCode: string, session: Session): void {
        server.to(sessionCode).emit('turnEnded', {
            playerSocketId: session.turnData.currentPlayerSocketId,
        });
    }
}
