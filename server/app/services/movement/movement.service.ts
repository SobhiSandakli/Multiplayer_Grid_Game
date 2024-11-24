/* eslint-disable max-lines */
import { Player } from '@app/interfaces/player/player.interface';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EVASION_DELAY, SLIP_PROBABILITY, DELAY_BEFORE_NEXT_TURN } from '@app/constants/session-gateway-constants';
import { AccessibleTile } from '@app/interfaces/player/accessible-tile.interface';
import { Position } from '@app/interfaces/player/position.interface';
import { Grid } from '@app/interfaces/session/grid.interface';
import { MovementContext, PathInterface } from '@app/interfaces/player/movement.interface';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { Session } from '@app/interfaces/session/session.interface';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { ObjectsImages, TERRAIN_TYPES, getObjectKeyByValue } from '@app/constants/objects-enums-constants';
import { EventsGateway } from '@app/gateways/events/events.gateway';

interface TileContext {
    paths: { [key: string]: Position[] };
    queue: { position: Position; cost: number }[];
    costs: number[][];
    accessibleTiles: AccessibleTile[];
    currentPath?: Position[]; // Optional current path for neighbors
}

@Injectable()
export class MovementService {
    movementCosts = {
        ice: 0,
        base: 1,
        doorOpen: 1,
        water: 2,
        wall: Infinity,
        closedDoor: Infinity,
    };

    constructor(
        private readonly changeGridService: ChangeGridService,
        @Inject(forwardRef(() => SessionsService))
        private readonly sessionsService: SessionsService,
        private readonly events: EventsGateway,
    ) {}

    getMovementCost(tile: { images: string[] }): number {
        const tileType = this.getTileType(tile.images);
        return this.movementCosts[tileType] || 1;
    }

    getTileEffect(tile: { images: string[] }): string {
        if (tile.images.includes('assets/tiles/Ice.png')) return 'Glissant';
        if (tile.images.includes('assets/tiles/Water.png')) return 'Lent';
        return 'Normal';
    }

    getTileType(images: string[]): string {
        if (images.includes('assets/tiles/Ice.png')) return 'ice';
        if (images.includes('assets/tiles/Grass.png')) return 'base';
        if (images.includes('assets/tiles/Door-Open.png')) return 'doorOpen';
        if (images.includes('assets/tiles/Water.png')) return 'water';
        if (images.includes('assets/tiles/Wall.png')) return 'wall';
        if (images.includes('assets/objects/started-points.png')) return 'started-points';
        return 'base';
    }
    calculateAccessibleTiles(grid: { images: string[]; isOccuped: boolean }[][], player: Player, maxMovement: number): void {
        const context = this.initializeTileContext(grid, player);

        while (context.queue.length > 0) {
            const item = context.queue.shift();
            if (item) {
                const { position, cost } = item;
                this.processTile(position, cost, maxMovement, context, grid);
            }
        }

        player.accessibleTiles = context.accessibleTiles;
    }

    calculateMovementCost(
        source: { row: number; col: number },
        destination: { row: number; col: number },
        player: Player,
        grid: { images: string[]; isOccuped: boolean }[][],
    ): number {
        const tilePath = player.accessibleTiles.find((tile) => tile.position.row === destination.row && tile.position.col === destination.col)?.path;

        if (!tilePath) {
            return;
        }
        const pathWithoutStartingTile = tilePath.slice(1);
        let totalMovementCost = 0;
        for (const position of pathWithoutStartingTile) {
            const tile = grid[position.row][position.col];
            const tileType = this.getTileType(tile.images);
            const movementCost = this.movementCosts[tileType];
            if (movementCost > 0) {
                totalMovementCost += movementCost;
            }
        }

        return totalMovementCost;
    }

    calculatePathWithSlips(
        desiredPath: { row: number; col: number }[],
        grid: Grid,
        isDebugMode: boolean,
    ): { realPath: { row: number; col: number }[]; slipOccurred: boolean } {
        if (isDebugMode) {
            return { realPath: desiredPath, slipOccurred: false };
        }
        let realPath = [...desiredPath];
        let slipOccurred = false;

        for (let i = 0; i < desiredPath.length; i++) {
            const tile = grid[desiredPath[i].row][desiredPath[i].col];
            const tileType = this.getTileType(tile.images);

            if (tileType === 'ice' && Math.random() < SLIP_PROBABILITY) {
                realPath = desiredPath.slice(0, i + 1);
                slipOccurred = true;
                break;
            }
        }

        return { realPath, slipOccurred };
    }

    getPathToDestination(player: Player, destination: { row: number; col: number }): { row: number; col: number }[] | null {
        const accessibleTile = player.accessibleTiles.find((tile) => tile.position.row === destination.row && tile.position.col === destination.col);

        return accessibleTile ? accessibleTile.path : null;
    }

    processPlayerMovement(
        client: Socket,
        player: Player,
        session: Session,
        data: {
            sessionCode: string;
            source: { row: number; col: number };
            destination: { row: number; col: number };
            movingImage: string;
        },
        server: Server,
    ): void {
        const isDebugMode = session.isDebugMode;
        const initialMovementCost = this.calculateMovementCost(data.source, data.destination, player, session.grid);

        if (player.attributes['speed'].currentValue >= initialMovementCost) {
            const desiredPath = this.getPathToDestination(player, data.destination);
            if (!desiredPath) return;

            const { realPath, slipOccurred } = this.calculatePathWithSlips(desiredPath, session.grid, isDebugMode);
            const { adjustedPath, itemFound } = this.checkForItemsAlongPath(realPath, session.grid);

            const movementCost = this.calculateMovementCostFromPath(adjustedPath.slice(1), session.grid);
            if (player.attributes['speed'].currentValue < movementCost) {
                return;
            }

            let adjustedSlipOccurred = slipOccurred;
            if (itemFound) {
                adjustedSlipOccurred = false;
            }

            const movementContext: MovementContext = {
                client,
                player,
                session,
                movementData: data,
                path: { desiredPath, realPath: adjustedPath },
                slipOccurred: isDebugMode ? false : adjustedSlipOccurred,
                movementCost,
                destination: adjustedPath[adjustedPath.length - 1],
            };

            this.finalizeMovement(movementContext, server);
            if (itemFound) {
                this.handleItemPickup(player, session, movementContext.destination, server, data.sessionCode);
            }
        }
    }

    calculateMovementCostFromPath(path: Position[], grid: Grid): number {
        let totalMovementCost = 0;
        for (const position of path) {
            const tile = grid[position.row][position.col];
            const tileType = this.getTileType(tile.images);
            const movementCost = this.movementCosts[tileType];
            if (movementCost > 0) {
                totalMovementCost += movementCost;
            }
        }
        return totalMovementCost;
    }

    isDestinationAccessible(player: Player, destination: { row: number; col: number }): boolean {
        return player.accessibleTiles.some((tile) => tile.position.row === destination.row && tile.position.col === destination.col);
    }

    updatePlayerAttributesOnTile(player: Player, tile: { images: string[]; isOccuped: boolean }): void {
        const tileType = this.getTileType(tile.images);

        if (tileType === 'ice') {
            player.attributes['attack'].currentValue = player.attributes['attack'].baseValue - 2;
            player.attributes['defence'].currentValue = player.attributes['defence'].baseValue - 2;
        } else {
            player.attributes['attack'].currentValue = player.attributes['attack'].baseValue;
            player.attributes['defence'].currentValue = player.attributes['defence'].baseValue;
        }
    }
    handleItemDiscard(player: Player, discardedItem: ObjectsImages, pickedUpItem: ObjectsImages, server: Server, sessionCode: string): void {
        const session = this.sessionsService.getSession(sessionCode);
        const position = player.position;
        const discardedItemKey = getObjectKeyByValue(discardedItem);
        const pickedUpItemKey = getObjectKeyByValue(pickedUpItem);
        player.inventory = player.inventory.filter((item) => item !== discardedItem);
        player.inventory.push(pickedUpItem);
        this.updateUniqueItems(player, pickedUpItem, session);
        this.changeGridService.addImage(session.grid[position.row][position.col], discardedItem);
        this.changeGridService.removeObjectFromGrid(session.grid, position.row, position.col, pickedUpItem);
        server.to(sessionCode).emit('gridArray', { sessionCode, grid: session.grid });
        server.to(player.socketId).emit('updateInventory', { inventory: player.inventory });
        this.events.addEventToSession(sessionCode, `${player.name} a jeté un ${discardedItemKey} et a ramassé un ${pickedUpItemKey}`, ['everyone']);
    }

    calculatePathMovementCost(path: Position[], grid: Grid): number {
        let totalCost = 0;
        for (const position of path.slice(1)) {
            // Exclude starting position
            const tile = grid[position.row][position.col];
            const tileType = this.getTileType(tile.images);
            const movementCost = this.movementCosts[tileType] ?? 1; // Default to 1 if undefined
            totalCost += movementCost;
        }
        return totalCost;
    }

    isPositionAccessible(position: Position, grid: Grid): boolean {
        const tile = grid[position.row][position.col];
        return !this.isWall(tile) && !this.isClosedDoor(tile) && !this.hasAvatar(tile);
    }

    getAdjacentPositions(position: Position, grid: Grid): Position[] {
        const directions = [
            { row: -1, col: 0 }, // Up
            { row: 1, col: 0 }, // Down
            { row: 0, col: -1 }, // Left
            { row: 0, col: 1 }, // Right
        ];

        const adjacentPositions: Position[] = [];

        directions.forEach((dir) => {
            const newRow = position.row + dir.row;
            const newCol = position.col + dir.col;
            if (this.isInBounds({ row: newRow, col: newCol }, grid)) {
                adjacentPositions.push({ row: newRow, col: newCol });
            }
        });

        return adjacentPositions;
    }

    handleItemPickup(player: Player, session: Session, position: Position, server: Server, sessionCode: string): void {
        const tile = session.grid[position.row][position.col];
        const itemImage = tile.images.find((image) => Object.values(ObjectsImages).includes(image as ObjectsImages)) as ObjectsImages | undefined;
        if (itemImage) {
            if (player.inventory.length < 2) {
                player.inventory.push(itemImage);
                this.updateUniqueItems(player, itemImage, session);
                this.changeGridService.removeObjectFromGrid(session.grid, position.row, position.col, itemImage);
                server.to(player.socketId).emit('itemPickedUp', { item: itemImage });
                const pickedUpItemKey = getObjectKeyByValue(itemImage);
                this.events.addEventToSession(sessionCode, `${player.name} a ramassé un ${pickedUpItemKey}`, ['everyone']);
            } else {
                const allItems = [...player.inventory, itemImage];
                server.to(player.socketId).emit('inventoryFull', { items: allItems });
            }
            server.to(sessionCode).emit('gridArray', { sessionCode, grid: session.grid });
        }
    }

    private processTile(
        position: Position,
        cost: number,
        maxMovement: number,
        context: TileContext,
        grid: { images: string[]; isOccuped: boolean }[][],
    ) {
        context.currentPath = context.paths[`${position.row},${position.col}`] || [];
        if (cost <= maxMovement) {
            context.accessibleTiles.push({
                position,
                path: [...context.currentPath],
            });
        }

        for (const delta of this.getAdjacentTiles()) {
            this.processNeighbor(position, delta, cost, context, grid);
        }
    }

    private processNeighbor(
        position: Position,
        delta: Position,
        cost: number,
        context: TileContext,
        grid: { images: string[]; isOccuped: boolean }[][],
    ) {
        const newPosition: Position = {
            row: position.row + delta.row,
            col: position.col + delta.col,
        };

        if (this.isInBounds(newPosition, grid) && this.isValidMove(grid[newPosition.row][newPosition.col])) {
            const movementCost = this.movementCosts[this.getTileType(grid[newPosition.row][newPosition.col].images)] || 1;
            const newCost = cost + movementCost;

            if (newCost < context.costs[newPosition.row][newPosition.col]) {
                context.costs[newPosition.row][newPosition.col] = newCost;
                const currentPath = context.currentPath ?? []; // Default to an empty array if undefined
                context.queue.push({ position: newPosition, cost: newCost });
                context.paths[`${newPosition.row},${newPosition.col}`] = [...currentPath, newPosition];
            }
        }
    }

    private getAdjacentTiles(): Position[] {
        return [
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 },
        ];
    }

    private initializeTileContext(grid: { images: string[]; isOccuped: boolean }[][], player: Player): TileContext {
        const costs: number[][] = Array.from({ length: grid.length }, () => Array(grid[0].length).fill(Infinity));
        const paths: { [key: string]: Position[] } = {};
        const queue: { position: Position; cost: number }[] = [{ position: player.position, cost: 0 }];
        const accessibleTiles: AccessibleTile[] = [];

        costs[player.position.row][player.position.col] = 0;
        paths[`${player.position.row},${player.position.col}`] = [player.position];
        return { costs, paths, queue, accessibleTiles };
    }

    private isInBounds(position: Position, grid: { images: string[]; isOccuped: boolean }[][]): boolean {
        return position.row >= 0 && position.row < grid.length && position.col >= 0 && position.col < grid[0].length;
    }

    private isValidMove(tile: { images: string[]; isOccuped: boolean }): boolean {
        return !this.isWall(tile) && !this.isClosedDoor(tile) && !this.hasAvatar(tile);
    }

    private isWall(tile: { images: string[] }): boolean {
        return tile.images.some((image) => image.includes('assets/tiles/Wall.png'));
    }

    private isClosedDoor(tile: { images: string[] }): boolean {
        return tile.images.some((image) => image.includes('assets/tiles/Door.png'));
    }

    private hasAvatar(tile: { images: string[] }): boolean {
        return tile.images.some((image) => image.startsWith('assets/avatars'));
    }

    private finalizeMovement(context: MovementContext, server: Server): void {
        const { player, movementData, path, slipOccurred, client, session } = context;
        const lastTile = path.realPath[path.realPath.length - 1];
        context.destination = lastTile; // Set destination in context

        if (this.updatePlayerPosition(context)) {
            this.recordTilesVisited(player, path.realPath, session.grid, session);
            this.handleSlip(movementData.sessionCode, slipOccurred, server);
            if (client) {
                this.emitMovementUpdatesToClient(client, player);
            }
            this.emitMovementUpdatesToOthers(movementData.sessionCode, player, path, server, slipOccurred);
            this.checkCaptureTheFlagWinCondition(player, session, server, movementData.sessionCode);
        }
    }

    private checkCaptureTheFlagWinCondition(player: Player, session: Session, server: Server, sessionCode: string): void {
        if (session.ctf === true) {
            const hasFlag = player.inventory.includes(ObjectsImages.Flag);
            const isAtStartingPosition = player.position.row === player.initialPosition.row && player.position.col === player.initialPosition.col;
            for (const sessionPlayer of session.players) {
                sessionPlayer.statistics.uniqueItemsArray = Array.from(sessionPlayer.statistics.uniqueItems);
                sessionPlayer.statistics.tilesVisitedArray = Array.from(sessionPlayer.statistics.tilesVisited);
            }
            session.statistics.visitedTerrainsArray = Array.from(session.statistics.visitedTerrains);
            session.statistics.uniqueFlagHoldersArray = Array.from(session.statistics.uniqueFlagHolders);
            session.statistics.manipulatedDoorsArray = Array.from(session.statistics.manipulatedDoors);
            session.players.push(...session.abandonedPlayers)

            if (hasFlag && isAtStartingPosition) {
                server.to(sessionCode).emit('gameEnded', { winner: player.name, players: session.players, sessionStatistics: session.statistics });
                setTimeout(() => this.sessionsService.terminateSession(sessionCode), DELAY_BEFORE_NEXT_TURN);
                return;
            }
        }
    }

    private updatePlayerPosition(context: MovementContext): boolean {
        const { player, session, movementData, destination, movementCost } = context;

        player.position = { row: destination.row, col: destination.col };
        const moved = this.changeGridService.moveImage(session.grid, movementData.source, destination, movementData.movingImage);

        if (moved) {
            player.attributes['speed'].currentValue -= movementCost;
            this.updatePlayerAttributesOnTile(player, session.grid[destination.row][destination.col]);
            this.calculateAccessibleTiles(session.grid, player, player.attributes['speed'].currentValue);
        }

        return moved;
    }

    private handleSlip(sessionCode: string, slipOccurred: boolean, server: Server): void {
        if (slipOccurred) {
            setTimeout(() => {
                this.sessionsService.endTurn(sessionCode, server);
            }, EVASION_DELAY);
        }
    }

    private emitMovementUpdatesToClient(client: Socket, player: Player): void {
        client.emit('accessibleTiles', { accessibleTiles: player.accessibleTiles });
    }
    private emitMovementUpdatesToOthers(sessionCode: string, player: Player, path: PathInterface, server: Server, slipOccurred: boolean): void {
        const session = this.sessionsService.getSession(sessionCode);
        server.to(sessionCode).emit('playerMovement', {
            avatar: player.avatar,
            desiredPath: path.desiredPath,
            realPath: path.realPath,
            slipOccurred,
        });
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    }

    private containsItem(tile: { images: string[] }): boolean {
        return tile.images.some((image) => Object.values(ObjectsImages).includes(image as ObjectsImages));
    }

    private checkForItemsAlongPath(path: Position[], grid: Grid): { adjustedPath: Position[]; itemFound: boolean } {
        for (let i = 1; i < path.length; i++) {
            const position = path[i];
            const tile = grid[position.row][position.col];
            if (this.containsItem(tile)) {
                return { adjustedPath: path.slice(0, i + 1), itemFound: true };
            }
        }
        return { adjustedPath: path, itemFound: false };
    }

    private updateUniqueItems(player: Player, item: string, session: Session): void {
        player.statistics.uniqueItems.add(item);
        if (item === ObjectsImages.Flag) {
            session.statistics.uniqueFlagHolders.add(player.name);
        }
    }
    private recordTilesVisited(player: Player, path: { row: number; col: number }[], grid: Grid, session: Session): void {
        for (const position of path) {
            const tile = grid[position.row][position.col];
            const tileType = tile.images.find((image) => TERRAIN_TYPES.includes(image));
            if (tileType) {
                player.statistics.tilesVisited.add(`${position.row},${position.col}`);
                session.statistics.visitedTerrains.add(`${position.row},${position.col}`);
            }
        }
    }
}
