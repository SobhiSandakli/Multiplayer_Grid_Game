import { Injectable } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { GameService } from '@app/services/game/game.service';
import { Game } from '@app/model/schema/game.schema';
import { MovementService } from '@app/services/movement/movement.service';
import { TERRAIN_TYPES, DOOR_TYPES, getObjectKeyByValue, objectsProperties } from '@app/constants/objects-enums-constants';
import { TILES_LIST } from '@app/constants/tiles-constants';

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
        private readonly changeGridService: ChangeGridService,
        private readonly movementService: MovementService,
        private readonly gameService: GameService,
    ) {}

    @SubscribeMessage('startGame')
    async handleStartGame(@ConnectedSocket() _client: Socket, @MessageBody() data: { sessionCode: string }): Promise<void> {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            return;
        }
        this.sessionsService.calculateTurnOrder(session, data.sessionCode, this.server);
        try {
            const game = await this.gameService.getGameById(session.selectedGameID);
            const grid = game.grid;

            session.grid = this.changeGridService.changeGrid(grid, session.players);

            this.server.to(data.sessionCode).emit('gameStarted', {
                sessionCode: data.sessionCode,
            });
            this.server.to(data.sessionCode).emit('getGameInfo', { name: game.name, size: game.size });
            this.server.to(data.sessionCode).emit('gridArray', { sessionCode: data.sessionCode, grid: session.grid });
            session.statistics.totalTerrainTiles = this.changeGridService.countElements(session.grid, TERRAIN_TYPES);
            session.statistics.totalDoors = this.changeGridService.countElements(session.grid, DOOR_TYPES);
            session.statistics.startTime = new Date();
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

    @SubscribeMessage('avatarInfoRequest')
    async handleAvatarInfoRequest(client: Socket, data: { sessionCode: string; avatar: string }): Promise<void> {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            return;
        }

        const player = session.players.find((p) => p.avatar === data.avatar);
        if (player) {
            const avatarInfo = { name: player.name, avatar: player.avatar };
            client.emit('avatarInfo', avatarInfo);
        }
    }
    @SubscribeMessage('tileInfoRequest')
    async handleTileInfoRequest(client: Socket, data: { sessionCode: string; row: number; col: number }): Promise<void> {
        const session = this.sessionsService.getSession(data.sessionCode);
        if (!session) {
            return;
        }

        const tile = session.grid[data.row][data.col];
        const tileType = this.movementService.getTileType(tile.images);
        const tileDetails = TILES_LIST.find((t) => t.name === tileType);

        let objectInfo = null;
        for (const image of tile.images) {
            const objectKey = getObjectKeyByValue(image);
            if (objectKey) {
                const objectProps = objectsProperties[objectKey.toLowerCase()];
                if (objectProps) {
                    const effectSummary = this.getObjectEffectSummary(objectKey, objectProps);
                    objectInfo = {
                        name: objectKey,
                        effectSummary,
                    };
                    break;
                }
            }
        }

        const tileInfo = {
            type: tileType,
            label: tileDetails?.label || 'Tuile inconnue',
            alt: tileDetails?.alt || '',
            cost: this.movementService.getMovementCost(tile),
            effect: this.movementService.getTileEffect(tile),
            objectInfo,
        };

        client.emit('tileInfo', tileInfo);
    }
    private getObjectEffectSummary(objectKey: string, _objectProps: string): string {
        void _objectProps;
        switch (objectKey.toLowerCase()) {
            case 'shield':
                return '+2 en défense';
            case 'potion':
                return '+2 en vie, -1 en attaque';
            case 'wheel':
                return '+2 en rapidité sur le gazon';
            case 'sword':
                return "+2 en attaque si c'est le seul objet que tu as";
            case 'flag':
                return 'Apporte le à ton point de départ pour gagner';
            case 'flyingshoe':
                return '0% de chance de tomber sur la glace';
            default:
                return "Pas d'effet";
        }
    }
}
