import { Player } from '@app/interfaces/player/player.interface';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EVASION_DELAY, SLIP_PROBABILITY } from '@app/constants/session-gateway-constants';
import { AccessibleTile } from '@app/interfaces/player/accessible-tile.interface';
import { Position } from '@app/interfaces/player/position.interface';
import { Grid } from '@app/interfaces/session/grid.interface';
import { MovementContext, PathInterface } from '@app/interfaces/player/movement.interface';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { Session } from '@app/interfaces/session/session.interface';
import { SessionsService } from '@app/services/sessions/sessions.service';
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
            throw new Error('Path to destination not found in accessible tiles.');
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
    ): { realPath: { row: number; col: number }[]; slipOccurred: boolean } {
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
        data: { sessionCode: string; source: { row: number; col: number }; destination: { row: number; col: number }; movingImage: string },
        server: Server,
    ): void {
        const movementCost = this.calculateMovementCost(data.source, data.destination, player, session.grid);

        if (player.attributes['speed'].currentValue >= movementCost) {
            const desiredPath = this.getPathToDestination(player, data.destination);
            if (!desiredPath) return;

            const { realPath, slipOccurred } = this.calculatePathWithSlips(desiredPath, session.grid);

            const movementContext: MovementContext = {
                client,
                player,
                session,
                movementData: data,
                path: { realPath, desiredPath },
                slipOccurred,
                movementCost,
                destination: realPath[realPath.length - 1],
            };

            this.finalizeMovement(movementContext, server);
        }
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
        const { player, session, movementData,path, slipOccurred, client } = context;
        const lastTile = path.realPath[path.realPath.length - 1];
        context.destination = lastTile; // Set destination in context

        if (this.updatePlayerPosition(context)) {
            this.handleSlip(movementData.sessionCode, slipOccurred, server);
            this.emitMovementUpdatesToClient(client, player);
            this.emitMovementUpdatesToOthers(movementData.sessionCode, session, player, path, server);
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

    private emitMovementUpdatesToOthers(
        sessionCode: string,
        session: Session,
        player: Player,
        path: PathInterface,
        server: Server,
    ): void {
        server.to(sessionCode).emit('playerMovement', {
            avatar: player.avatar,
            desiredPath: path.desiredPath,
            realPath: path.realPath,
        });
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    }
}
