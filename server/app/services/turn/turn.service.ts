import { ObjectsImages } from '@app/constants/objects-enums-constants';
import { NEXT_TURN_NOTIFICATION_DELAY, THOUSAND, THREE_THOUSAND, TURN_DURATION } from '@app/constants/turn-constants';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { AccessibleTile } from '@app/interfaces/player/accessible-tile.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { Position } from '@app/interfaces/player/position.interface';
import { Session } from '@app/interfaces/session/session.interface';
import { ActionService } from '@app/services/action/action.service';
import { CombatService } from '@app/services/combat/combat.service';
import { MovementService } from '@app/services/movement/movement.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class TurnService {
    private isActionPossible: boolean = false;

    constructor(
        private readonly movementService: MovementService,
        private readonly eventsService: EventsGateway,
        private readonly actionService: ActionService,
        @Inject(forwardRef(() => CombatService))
        private readonly combatService: CombatService,
    ) {}

    startTurn(sessionCode: string, server: Server, sessions: { [key: string]: Session }, startingPlayerSocketId?: string): void {
        const session = sessions[sessionCode];
        session.statistics.totalTurns++;
        if (!session) return;

        // Clear any existing timer before starting the new turn
        this.clearTurnTimer(session);

        if (this.isCombatActive(session, server, sessionCode)) return;

        setTimeout(() => {
            this.setTurnData(session, startingPlayerSocketId);

            const currentPlayer = this.getCurrentPlayer(session);
            if (!currentPlayer) return;

            this.resetPlayerSpeed(currentPlayer);
            this.calculateAccessibleTiles(session, currentPlayer);
            this.notifyOthersOfRestrictedTiles(server, session, currentPlayer);
            this.notifyAllPlayersOfNextTurn(server, sessionCode, session);
            this.eventsService.addEventToSession(sessionCode, `Le tour de ${currentPlayer.name} commence.`, ['everyone']);

            if (currentPlayer.isVirtual) {
                this.initiateVirtualPlayerTurn(sessionCode, server, sessions, currentPlayer, session);
            } else {
                this.initiateRealPlayerTurn(sessionCode, server, sessions, currentPlayer, session);
            }
        }, THREE_THOUSAND);
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

    calculateTurnOrder(session: Session): void {
        const players = this.getSortedPlayersBySpeed(session.players);
        const groupedBySpeed = this.groupPlayersBySpeed(players);
        const sortedPlayers = this.createTurnOrderFromGroups(groupedBySpeed);

        session.turnData.turnOrder = sortedPlayers.map((player) => player.socketId);
        session.turnData.currentTurnIndex = -1;
    }

    private isCombatActive(session: Session, server: Server, sessionCode: string): boolean {
        if (session.combatData.combatants.length > 0) {
            server.to(sessionCode).emit('turnPaused', { message: 'Le tour est en pause pour le combat en cours.' });
            return true;
        }
        return false;
    }

    private setTurnData(session: Session, startingPlayerSocketId?: string): void {
        if (startingPlayerSocketId) {
            session.turnData.currentTurnIndex = session.turnData.turnOrder.indexOf(startingPlayerSocketId);
        } else {
            this.advanceTurnIndex(session);
        }
        this.setCurrentPlayer(session);
        session.turnData.timeLeft = TURN_DURATION;
    }

    private initiateRealPlayerTurn(
        sessionCode: string,
        server: Server,
        sessions: { [key: string]: Session },
        currentPlayer: Player,
        session: Session,
    ): void {
        this.isActionPossible = this.actionService.checkAvailableActions(currentPlayer, session.grid);

        if (this.isMovementRestricted(currentPlayer) && !this.isActionPossible) {
            this.handleNoMovement(sessionCode, server, sessions, currentPlayer);
            return;
        }

        this.notifyPlayerOfAccessibleTiles(server, sessionCode, currentPlayer);

        this.startTurnTimer(sessionCode, server, sessions, currentPlayer);
    }

    private initiateVirtualPlayerTurn(
        sessionCode: string,
        server: Server,
        sessions: { [key: string]: Session },
        currentPlayer: Player,
        session: Session,
    ): void {
        this.eventsService.addEventToSession(sessionCode, `Le tour de ${currentPlayer.name} commence.`, ['everyone']);
        this.startVirtualPlayerTimer(sessionCode, server, sessions, currentPlayer, session);
    }

    private startVirtualPlayerTimer(
        sessionCode: string,
        server: Server,
        sessions: { [key: string]: Session },
        currentPlayer: Player,
        session: Session,
    ): void {
        this.clearTurnTimer(session); // Ensure no timer is running

        const turnDuration = TURN_DURATION;
        session.turnData.timeLeft = turnDuration;

        const randomExecutionTime = turnDuration - Math.floor(Math.random() * 10);
        server.to(sessionCode).emit('turnStarted', {
            playerSocketId: session.turnData.currentPlayerSocketId,
        });
        this.sendTimeLeft(sessionCode, server, sessions);

        session.turnData.turnTimer = setInterval(() => {
            session.turnData.timeLeft--;
            this.sendTimeLeft(sessionCode, server, sessions);
            if (session.turnData.timeLeft === randomExecutionTime) {
                this.handleVirtualPlayerTurn(sessionCode, server, sessions, currentPlayer, session);
            }

            if (session.turnData.timeLeft <= 0) {
                this.clearTurnTimer(session);
                this.endTurn(sessionCode, server, sessions);
            }
        }, THOUSAND);
    }

    private startTurnTimer(sessionCode: string, server: Server, sessions: { [key: string]: Session }, currentPlayer: Player): void {
        const session = sessions[sessionCode];
        if (!session) return;

        this.clearTurnTimer(session); // Ensure no timer is running

        session.turnData.timeLeft = TURN_DURATION;

        server.to(sessionCode).emit('turnStarted', {
            playerSocketId: session.turnData.currentPlayerSocketId,
        });
        this.sendTimeLeft(sessionCode, server, sessions);
        session.turnData.turnTimer = setInterval(() => {
            session.turnData.timeLeft--;

            this.calculateAccessibleTiles(session, currentPlayer);
            this.isActionPossible = this.actionService.checkAvailableActions(currentPlayer, session.grid);

            if (this.isMovementRestricted(currentPlayer) && !this.isActionPossible) {
                this.clearTurnTimer(session);
                server.to(sessionCode).emit('noMovementPossible', { playerName: currentPlayer.name });
                this.endTurn(sessionCode, server, sessions);
                return;
            }

            if (session.turnData.timeLeft <= 0) {
                this.clearTurnTimer(session);
                this.endTurn(sessionCode, server, sessions);
            } else {
                this.sendTimeLeft(sessionCode, server, sessions);
            }
        }, THOUSAND);
    }

    private handleVirtualPlayerTurn(
        sessionCode: string,
        server: Server,
        sessions: { [key: string]: Session },
        player: Player,
        session: Session,
    ): void {
        if (player.type === 'Aggressif') {
            this.handleAggressivePlayerTurn(sessionCode, server, player, session);
        } else if (player.type === 'Défensif') {
            this.handleDefensivePlayerTurn(sessionCode, server, player, session);
        }

        this.endVirtualTurnAfterDelay(sessionCode, server, sessions);
    }

    private handleAggressivePlayerTurn(sessionCode: string, server: Server, player: Player, session: Session): void {
        this.movementService.calculateAccessibleTiles(session.grid, player, player.attributes['speed'].currentValue);

        // Prioritize combat
        const targetPlayers = this.findPlayerInAccessibleTiles(player, session);
        if (targetPlayers.length > 0) {
            const targetPlayer = targetPlayers[0];
            let adjacentPositions = this.movementService.getAdjacentPositions(targetPlayer.position, session.grid);
            const accessibleAdjacentPositions = adjacentPositions.filter((pos) => this.movementService.isPositionAccessible(pos, session.grid));
            const playerAccessiblePositions = player.accessibleTiles.map((tile) => tile.position);
            const possiblePositions = accessibleAdjacentPositions.filter((adjPos) =>
                playerAccessiblePositions.some((playerPos) => playerPos.row === adjPos.row && playerPos.col === adjPos.col),
            );

            if (possiblePositions.length > 0) {
                const destination = possiblePositions[0];
                this.executeMovement(server, player, session, sessionCode, destination);
                this.combatService.initiateCombat(sessionCode, player, targetPlayer, server);
                return;
            }
        }

        if (player.inventory.length < 2) {
            // Define the images of priority items (Wheel and Sword)
            const priorityItemImages = [ObjectsImages.Wheel, ObjectsImages.Sword];

            // Identify accessible tiles with items
            const accessibleTilesWithItems = player.accessibleTiles.filter((tile) => {
                const { row, col } = tile.position;
                const images = session.grid[row][col].images;
                return images.some((image) => image.startsWith('assets/objects') && image !== 'assets/objects/started-points.png');
            });

            // Map accessible tiles to their corresponding items
            const accessibleItems = accessibleTilesWithItems.map((tile) => {
                const { row, col } = tile.position;
                const images = session.grid[row][col].images;
                const itemImage = images.find(
                    (image) => image.startsWith('assets/objects') && image !== 'assets/objects/started-points.png',
                ) as ObjectsImages;
                return { tile, itemImage };
            });

            // Filter priority items (Wheel and Sword)
            const priorityItems = accessibleItems.filter(({ itemImage }) => priorityItemImages.includes(itemImage));

            let itemToPickUp;

            if (priorityItems.length > 0) {
                // Prioritize picking up Wheel or Sword
                itemToPickUp = priorityItems[0];
            } else if (accessibleItems.length > 0) {
                // If no priority items, pick any available item
                itemToPickUp = accessibleItems[0];
            }

            if (itemToPickUp) {
                const destination = itemToPickUp.tile.position;
                // Move the virtual player to the item's position
                this.executeMovement(server, player, session, sessionCode, destination);

                // Handle item pickup logic
                this.movementService.handleItemPickup(player, session, destination, server, sessionCode);

                return; // End the turn after picking up the item
            }
        }

        // Move toward the closest player
        const closestPlayer = this.getClosestPlayer(session, player);
        if (!closestPlayer) return;

        let adjacentPositions = this.movementService.getAdjacentPositions(closestPlayer.position, session.grid);
        const accessiblePositions = adjacentPositions.filter((pos) => this.movementService.isPositionAccessible(pos, session.grid));

        const bestPath = this.getBestPathToAdjacentPosition(player, session, accessiblePositions);
        if (!bestPath) return;

        this.executeMovement(server, player, session, sessionCode, bestPath);
    }

    private moveTowardsTargetPlayer(sessionCode: string, server: Server, player: Player, session: Session, targetPlayer: Player): void {
        // Recalculate accessible tiles with infinite movement to find the path
        this.movementService.calculateAccessibleTiles(session.grid, player, Infinity);

        const path = this.movementService.getPathToDestination(player, targetPlayer.position);
        if (!path || path.length <= 1) return; // Cannot reach or already at the target

        // Limit path to player's movement range
        const movementRange = player.attributes['speed'].currentValue;
        const stepsToMove = Math.min(movementRange, path.length - 1);
        const destination = path[stepsToMove];

        // Recalculate accessible tiles with actual movement range
        this.movementService.calculateAccessibleTiles(session.grid, player, movementRange);

        this.executeMovement(server, player, session, sessionCode, destination);
    }

    private findPlayerInAccessibleTiles(player: Player, session: Session): Player[] {
        const accessiblePlayers: Player[] = [];

        for (const tile of player.accessibleTiles) {
            const adjacentPositions = this.movementService.getAdjacentPositions(tile.position, session.grid);
            for (const position of adjacentPositions) {
                const playersOnAdjacentTile = session.players.filter(
                    (p) => p.position.row === position.row && p.position.col === position.col && p.name !== player.name, // Exclude the current player
                );

                if (playersOnAdjacentTile.length > 0) {
                    accessiblePlayers.push(...playersOnAdjacentTile);
                }
            }
        }

        const uniqueAccessiblePlayers = Array.from(new Set(accessiblePlayers));

        return uniqueAccessiblePlayers;
    }

    private handleDefensivePlayerTurn(sessionCode: string, server: Server, player: Player, session: Session): void {
        const randomTile = this.getRandomAccessibleTile(player.accessibleTiles);
        if (!randomTile) return;

        this.executeMovement(server, player, session, sessionCode, randomTile.position);
    }

    private getBestPathToAdjacentPosition(player: Player, session: Session, accessiblePositions: Position[]): Position | null {
        const paths = accessiblePositions
            .map((pos) => {
                this.movementService.calculateAccessibleTiles(session.grid, player, Infinity);
                const path = this.movementService.getPathToDestination(player, pos);
                this.movementService.calculateAccessibleTiles(session.grid, player, player.attributes['speed'].currentValue);
                if (path) {
                    const movementCost = this.movementService.calculatePathMovementCost(path, session.grid);
                    return { path, movementCost };
                }
                return null;
            })
            .filter((item) => item !== null);

        if (paths.length === 0) return null;

        paths.sort((a, b) => a.movementCost - b.movementCost);
        return paths[0]?.path?.[Math.min(player.attributes['speed'].currentValue, paths[0].path.length - 1)] || null;
    }

    private executeMovement(server: Server, player: Player, session: Session, sessionCode: string, destination: Position): void {
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

    private endVirtualTurnAfterDelay(sessionCode: string, server: Server, sessions: { [key: string]: Session }): void {
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

    private notifyPlayerListUpdate(server: Server, sessionCode: string, session: Session): void {
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    }

    private notifyTurnEnded(server: Server, sessionCode: string, session: Session): void {
        server.to(sessionCode).emit('turnEnded', {
            playerSocketId: session.turnData.currentPlayerSocketId,
        });
    }

    private clearTurnTimer(session: Session): void {
        if (session.turnData.turnTimer) {
            clearInterval(session.turnData.turnTimer);
            session.turnData.turnTimer = null;
        }
    }
}
