import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { Server } from 'socket.io';
import { MovementService } from '@app/services/movement/movement.service';
import { CombatService } from '@app/services/combat/combat.service';
import { Player } from '@app/interfaces/player/player.interface';
import { Session } from '@app/interfaces/session/session.interface';
import { ObjectsImages, AGGRESSIVE_PLAYER_ITEM_PRIORITIES, DEFFENSIVE_PLAYER_ITEM_PRIORITIES } from '@app/constants/objects-enums-constants';
import { AccessibleTile } from '@app/interfaces/player/accessible-tile.interface';
import { Position } from '@app/interfaces/player/position.interface';
import { TurnService } from '@app/services/turn/turn.service';
import { TIME_TO_MOVE, TURN_DURATION } from '@app/constants/turn-constants';
import { CombatGateway } from '@app/gateways/combat/combat.gateway';
import { VP_COMBAT_MAX_TIME, VP_COMBAT_MIN_TIME } from '@app/constants/fight-constants';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';

@Injectable()
export class VirtualPlayerService {
    constructor(
        private readonly movementService: MovementService,
        @Inject(forwardRef(() => CombatService))
        private readonly combatService: CombatService,
        @Inject(forwardRef(() => TurnService))
        private readonly turnService: TurnService,
        private readonly combatGateway: CombatGateway,
        private readonly changeGridService: ChangeGridService,
    ) {}

    handleVirtualPlayerTurn(sessionCode: string, server: Server, sessions: { [key: string]: Session }, player: Player, session: Session): void {
        if (player.type === 'Aggressif') {
            this.handleAggressivePlayerTurn(sessionCode, server, player, session, sessions);
        } else if (player.type === 'Défensif') {
            this.handleDefensivePlayerTurn(sessionCode, server, player, session, sessions);
        }
    }

    private handleAggressivePlayerTurn(
        sessionCode: string,
        server: Server,
        player: Player,
        session: Session,
        sessions: { [key: string]: Session },
    ): void {
        this.movementService.calculateAccessibleTiles(session.grid, player, player.attributes['speed'].currentValue);

        // Priority 1: Combat with players in accessible tiles
        if (this.tryInitiateCombat(sessionCode, server, player, session)) {
            return;
        }

        // Priority 2: Collect items based on priority
        if (this.tryCollectItems(sessionCode, server, player, session)) {
            this.endVirtualTurnAfterDelay(sessionCode, server, sessions, player);
            return;
        }

        if (session.ctf && player.inventory.includes(ObjectsImages.Flag)) {
            if (this.tryMoveToInitialPosition(player, session, server, sessionCode)) {
                this.endVirtualTurnAfterDelay(sessionCode, server, sessions, player);
                return;
            }
            this.moveTheClosestToDestination(player, session, player.initialPosition, server, sessionCode);
            this.endVirtualTurnAfterDelay(sessionCode, server, sessions, player);
            return;
        }
        this.moveToClosestPlayerIfExists(player, session, server, sessionCode);
        this.endVirtualTurnAfterDelay(sessionCode, server, sessions, player);
    }

    private tryInitiateCombat(sessionCode: string, server: Server, player: Player, session: Session): boolean {
        const playersInAccessibleTiles = this.findPlayersInAccessibleTiles(player, session);
        if (playersInAccessibleTiles.length > 0) {
            const targetPlayer = playersInAccessibleTiles[0];
            const possiblePositions = this.getPossibleCombatPositions(player, targetPlayer, session);
            if (possiblePositions.length > 0) {
                const destination = possiblePositions[0];
                this.executeMovement(server, player, session, sessionCode, destination);
                this.scheduleCombat(sessionCode, player, targetPlayer, server);
                return true;
            }
        }
        return false;
    }

    private getPossibleCombatPositions(player: Player, targetPlayer: Player, session: Session): Position[] {
        const adjacentPositions = this.changeGridService.getAdjacentPositions(targetPlayer.position, session.grid);
        const accessibleAdjacentPositions = adjacentPositions.filter((pos) => this.movementService.isPositionAccessible(pos, session.grid));
        const playerAccessiblePositions = player.accessibleTiles.map((tile) => tile.position);

        return accessibleAdjacentPositions.filter((adjPos) =>
            playerAccessiblePositions.some((playerPos) => playerPos.row === adjPos.row && playerPos.col === adjPos.col),
        );
    }

    private scheduleCombat(sessionCode: string, player: Player, targetPlayer: Player, server: Server): void {
        const delay = (player.attributes['speed'].baseValue + 2) * TIME_TO_MOVE;
        setTimeout(() => {
            this.combatService.initiateCombat(sessionCode, player, targetPlayer, server);
        }, delay);

        const randomExecutionTime = Math.floor(Math.random() * VP_COMBAT_MAX_TIME) + VP_COMBAT_MIN_TIME; // Random time between 1000ms (1s) and 4000ms (4s)
        setTimeout(() => {
            this.combatGateway.handleAttack(null, { sessionCode, clientSocketId: player.socketId });
        }, randomExecutionTime);
    }

    private tryCollectItems(sessionCode: string, server: Server, player: Player, session: Session): boolean {
        const itemPriorities = player.inventory.length === 0 ? AGGRESSIVE_PLAYER_ITEM_PRIORITIES.noItems : AGGRESSIVE_PLAYER_ITEM_PRIORITIES.hasItems;

        const accessibleItems = this.getAccessibleItems(player, session, itemPriorities);

        if (accessibleItems.length > 0) {
            const itemToPickUp = accessibleItems[0];
            const destination = itemToPickUp.tile.position;

            const discardedItem = this.determineItemToDiscard(player, itemPriorities, itemToPickUp.itemImage);

            if (player.inventory.length < 2 || discardedItem) {
                this.executeMovement(server, player, session, sessionCode, destination);

                if (discardedItem) {
                    this.movementService.handleItemDiscard(player, discardedItem, itemToPickUp.itemImage, server, sessionCode);
                } else {
                    this.movementService.handleItemPickup(player, session, destination, server, sessionCode);
                }
                return true;
            }
        }
        return false;
    }

    private determineItemToDiscard(player: Player, itemPriorities: ObjectsImages[], newItem: ObjectsImages): ObjectsImages | null {
        if (player.inventory.length >= 2) {
            const existingItemPriorities = player.inventory.map((item) => itemPriorities.indexOf(item));
            const worstItemPriority = Math.max(...existingItemPriorities);
            const worstItemIndex = existingItemPriorities.indexOf(worstItemPriority);
            const worstItem = player.inventory[worstItemIndex];
            const newItemPriority = itemPriorities.indexOf(newItem);
            if (newItemPriority < worstItemPriority) {
                return worstItem;
            }
        }
        return null;
    }

    private tryMoveToInitialPosition(player: Player, session: Session, server: Server, sessionCode: string): boolean {
        const pathToInitialPosition = this.getPathToDestination(player, session, player.initialPosition);
        if (pathToInitialPosition) {
            this.executeMovement(server, player, session, sessionCode, pathToInitialPosition);
            return true;
        }
        return false;
    }

    private getPathToDestination(player: Player, session: Session, destination: Position): Position | null {
        this.movementService.calculateAccessibleTiles(session.grid, player, player.attributes['speed'].currentValue);
        const path = this.movementService.getPathToDestination(player, destination);
        return path ? path[path.length - 1] : null;
    }

    private moveToClosestPlayerIfExists(player: Player, session: Session, server: Server, sessionCode: string): void {
        const closestPlayer = this.getClosestPlayer(session, player);
        if (closestPlayer) {
            this.moveTheClosestToDestination(player, session, closestPlayer.position, server, sessionCode);
        }
    }

    private findPlayersInAccessibleTiles(player: Player, session: Session): Player[] {
        const accessiblePlayers: Player[] = [];
        for (const tile of player.accessibleTiles) {
            const adjacentPositions = this.changeGridService.getAdjacentPositions(tile.position, session.grid);
            for (const position of adjacentPositions) {
                const playersOnAdjacentTile = session.players.filter(
                    (p) => p.position.row === position.row && p.position.col === position.col && p.name !== player.name,
                );

                if (playersOnAdjacentTile.length > 0) {
                    accessiblePlayers.push(...playersOnAdjacentTile);
                }
            }
        }

        const uniqueAccessiblePlayers = Array.from(new Set(accessiblePlayers));

        return uniqueAccessiblePlayers;
    }

    private getAccessibleItems(
        player: Player,
        session: Session,
        itemPriorities: ObjectsImages[],
    ): { tile: AccessibleTile; itemImage: ObjectsImages }[] {
        const accessibleTilesWithItems = this.filterAccessibleTilesWithItems(player, session);
        const accessibleItems = this.mapTilesToItems(accessibleTilesWithItems, session);
        this.sortItemsByPriority(accessibleItems, itemPriorities);

        if (player.inventory.length < 2) {
            return accessibleItems;
        } else {
            const betterItems = this.filterBetterItems(player, accessibleItems, itemPriorities);
            return betterItems;
        }
    }

    private filterAccessibleTilesWithItems(player: Player, session: Session): AccessibleTile[] {
        return player.accessibleTiles.filter((tile) => {
            const { row, col } = tile.position;
            const images = session.grid[row][col].images;
            return images.some((image) => image.startsWith('assets/objects') && image !== 'assets/objects/started-points.png');
        });
    }

    private mapTilesToItems(accessibleTilesWithItems: AccessibleTile[], session: Session): { tile: AccessibleTile; itemImage: ObjectsImages }[] {
        return accessibleTilesWithItems.map((tile) => {
            const { row, col } = tile.position;
            const images = session.grid[row][col].images;
            const itemImage = images.find(
                (image) => image.startsWith('assets/objects') && image !== 'assets/objects/started-points.png',
            ) as ObjectsImages;
            return { tile, itemImage };
        });
    }

    private sortItemsByPriority(accessibleItems: { tile: AccessibleTile; itemImage: ObjectsImages }[], itemPriorities: ObjectsImages[]): void {
        accessibleItems.sort((a, b) => {
            const priorityA = itemPriorities.indexOf(a.itemImage);
            const priorityB = itemPriorities.indexOf(b.itemImage);
            return priorityA - priorityB;
        });
    }

    private filterBetterItems(
        player: Player,
        accessibleItems: { tile: AccessibleTile; itemImage: ObjectsImages }[],
        itemPriorities: ObjectsImages[],
    ): { tile: AccessibleTile; itemImage: ObjectsImages }[] {
        const existingItemPriorities = player.inventory.map((item) => itemPriorities.indexOf(item));
        const worstExistingPriority = Math.max(...existingItemPriorities);

        const betterItems = accessibleItems.filter(({ itemImage }) => {
            const itemPriority = itemPriorities.indexOf(itemImage);
            return itemPriority < worstExistingPriority;
        });

        return betterItems;
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

    private moveTheClosestToDestination(player: Player, session: Session, destination: Position, server: Server, sessionCode: string): void {
        const adjacentPositions = this.changeGridService.getAdjacentPositions(destination, session.grid);
        const accessiblePositions = adjacentPositions.filter((pos) => this.movementService.isPositionAccessible(pos, session.grid));
        const bestPath = this.getBestPathToAdjacentPosition(player, session, accessiblePositions);
        if (!bestPath) return;
        this.executeMovement(server, player, session, sessionCode, bestPath);
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
            .filter((item): item is { path: Position[]; movementCost: number } => item !== null);

        if (paths.length === 0) return null;

        paths.sort((a, b) => a.movementCost - b.movementCost);
        return paths[0].path[Math.min(player.attributes['speed'].currentValue, paths[0].path.length - 1)] || null;
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

    private endVirtualTurnAfterDelay(sessionCode: string, server: Server, sessions: { [key: string]: Session }, player: Player): void {
        const session = sessions[sessionCode];
        if (!session) {
            return;
        }
        setTimeout(() => {
            if (!this.isPlayerInCombat(player, session)) {
                this.turnService.endTurn(sessionCode, server, sessions);
            }
        }, TURN_DURATION);
    }

    private isPlayerInCombat(player: Player, session: Session): boolean {
        // Check if the player is in an active combat session
        return session.combatData.combatants.some((combatant) => combatant.name === player.name);
    }

    private handleDefensivePlayerTurn(
        sessionCode: string,
        server: Server,
        player: Player,
        session: Session,
        sessions: { [key: string]: Session },
    ): void {
        this.movementService.calculateAccessibleTiles(session.grid, player, player.attributes['speed'].currentValue);

        // Priority 1: Collect items based on priority
        if (this.tryCollectDefensiveItems(sessionCode, server, player, session)) {
            this.endVirtualTurnAfterDelay(sessionCode, server, sessions, player);
            return;
        }

        // If the player has a flag in CTF mode, prioritize returning to their initial position
        if (session.ctf && player.inventory.includes(ObjectsImages.Flag)) {
            // Try moving towards the initial position, otherwise move toward the closest player
            if (this.tryMoveToInitialPosition(player, session, server, sessionCode)) {
                this.endVirtualTurnAfterDelay(sessionCode, server, sessions, player);
                return;
            }
            this.moveTheClosestToDestination(player, session, player.initialPosition, server, sessionCode);
            this.endVirtualTurnAfterDelay(sessionCode, server, sessions, player);
            return;
        }

        // Priority 2: Combat with players in accessible tiles
        if (this.tryInitiateCombat(sessionCode, server, player, session)) {
            return;
        }

        this.moveToClosestPlayerIfExists(player, session, server, sessionCode);
        this.endVirtualTurnAfterDelay(sessionCode, server, sessions, player);
    }

    private tryCollectDefensiveItems(sessionCode: string, server: Server, player: Player, session: Session): boolean {
        const itemPriorities = DEFFENSIVE_PLAYER_ITEM_PRIORITIES;

        const accessibleItems = this.getAccessibleItems(player, session, itemPriorities);

        if (accessibleItems.length > 0) {
            const itemToPickUp = accessibleItems[0];
            const destination = itemToPickUp.tile.position;

            const discardedItem = this.determineItemToDiscard(player, itemPriorities, itemToPickUp.itemImage);

            if (player.inventory.length < 2 || discardedItem) {
                this.executeMovement(server, player, session, sessionCode, destination);

                if (discardedItem) {
                    this.movementService.handleItemDiscard(player, discardedItem, itemToPickUp.itemImage, server, sessionCode);
                } else {
                    this.movementService.handleItemPickup(player, session, destination, server, sessionCode);
                }
                return true;
            }
        }

        return false;
    }
}
