/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-lines */
import { DOOR_TYPES, TERRAIN_TYPES } from '@app/constants/objects-enums-constants';
import { TILES_LIST } from '@app/constants/tiles-constants';
import { Game } from '@app/model/schema/game.schema';
import { GameService } from '@app/services/game/game.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { MovementService } from '@app/services/movement/movement.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { GameGateway } from './game.gateway';

describe('GameGateway', () => {
    let gateway: GameGateway;
    let sessionsService: SessionsService;
    let changeGridService: ChangeGridService;
    let movementService: MovementService;
    let gameService: GameService;
    let server: Server;
    let clientSocket: Socket;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameGateway,
                {
                    provide: SessionsService,
                    useValue: {
                        getSession: jest.fn(),
                        calculateTurnOrder: jest.fn(),
                        startTurn: jest.fn(),
                        isSessionFull: jest.fn(),
                    },
                },
                {
                    provide: ChangeGridService,
                    useValue: {
                        changeGrid: jest.fn(),
                        countElements: jest.fn(),
                    },
                },
                {
                    provide: MovementService,
                    useValue: {
                        getMovementCost: jest.fn(),
                        getTileEffect: jest.fn(),
                        getTileType: jest.fn(),
                    },
                },
                {
                    provide: GameService,
                    useValue: {
                        getGameById: jest.fn(),
                    },
                },
            ],
        }).compile();

        gateway = module.get<GameGateway>(GameGateway);
        sessionsService = module.get<SessionsService>(SessionsService);
        changeGridService = module.get<ChangeGridService>(ChangeGridService);
        movementService = module.get<MovementService>(MovementService);
        gameService = module.get<GameService>(GameService);

        server = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            sockets: {
                sockets: new Map<string, Socket>(),
            },
        } as unknown as Server;

        (gateway as any).server = server;

        clientSocket = {
            id: 'client-socket-id',
            join: jest.fn(),
            leave: jest.fn(),
            emit: jest.fn(),
            rooms: new Set(['client-socket-id']), 
        } as unknown as Socket;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('handleStartGame', () => {
        it('should not start the game if the session does not exist', async () => {
            const sessionCode = 'invalidSession';

            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            await gateway.handleStartGame(clientSocket, { sessionCode });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            expect(sessionsService.calculateTurnOrder).not.toHaveBeenCalled();
            expect(gameService.getGameById).not.toHaveBeenCalled();
            expect(changeGridService.changeGrid).not.toHaveBeenCalled();
            expect(server.to).not.toHaveBeenCalled();
            expect(server.emit).not.toHaveBeenCalled();
            expect(sessionsService.startTurn).not.toHaveBeenCalled();
        });

        it('should handle errors gracefully if getGameById fails', async () => {
            const sessionCode = 'session2';
            const selectedGameID = 'game456';

            const session = {
                selectedGameID,
                grid: [],
                players: [],
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            (gameService.getGameById as jest.Mock).mockRejectedValue(new Error('Game not found'));

            await gateway.handleStartGame(clientSocket, { sessionCode });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            expect(sessionsService.calculateTurnOrder).toHaveBeenCalledWith(session, sessionCode, server);

            expect(gameService.getGameById).toHaveBeenCalledWith(selectedGameID);

            expect(server.to).not.toHaveBeenCalled();
            expect(server.emit).not.toHaveBeenCalled();

            expect(sessionsService.startTurn).not.toHaveBeenCalled();
        });
    });

    describe('handleGetGridArray', () => {
        it('should emit the grid array to the client', () => {
            const sessionCode = 'session3';
            const grid = [
                [
                    { images: ['image1.png'], isOccuped: false },
                    { images: ['image2.png'], isOccuped: true },
                ],
            ];
            const session = {
                grid,
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleGetGridArray(clientSocket, { sessionCode });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            expect(clientSocket.emit).toHaveBeenCalledWith('gridArray', { sessionCode, grid });
        });

        it('should do nothing if the session does not exist', () => {
            const sessionCode = 'invalidSession';

            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            gateway.handleGetGridArray(clientSocket, { sessionCode });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            expect(clientSocket.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleJoinGame', () => {
        it('should allow a client to join a game successfully', () => {
            const secretCode = 'secret123';
            const game: Game = {
                name: 'Awesome Game',
                size: '8x8',
                mode: 'Strategy',
                description: 'An awesome strategy game',
                grid: [
                    [
                        { images: ['tile1.png'], isOccuped: false },
                        { images: ['tile2.png'], isOccuped: true },
                    ],
                ],
                image: 'game-image.png',
                date: new Date(),
                visibility: true,
                _id: 'game789',
            };

            const session = {
                selectedGameID: game._id,
                players: [],
                locked: false,
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            (sessionsService.isSessionFull as jest.Mock).mockReturnValue(false);

            gateway.handleJoinGame(clientSocket, { secretCode, game });

            expect(sessionsService.getSession).toHaveBeenCalledWith(secretCode);

            expect(sessionsService.isSessionFull).toHaveBeenCalledWith(session);

            expect(clientSocket.join).toHaveBeenCalledWith(secretCode);
            expect(clientSocket.join).toHaveBeenCalledWith(JSON.stringify(game));

            expect(clientSocket.emit).toHaveBeenCalledWith('joinGameResponse', { success: true });

            expect(clientSocket.emit).toHaveBeenCalledWith('getGameInfo', { sessionCode: secretCode });

            expect(server.to).toHaveBeenCalledWith(secretCode);
            expect(server.emit).toHaveBeenCalledWith('playerListUpdate', { players: session.players });
        });

        it('should emit joinGameResponse with success false if session does not exist', () => {
            const secretCode = 'invalidSecret';
            const game: Game = {
                name: 'Nonexistent Game',
                size: '5x5',
                mode: 'Casual',
                description: 'A game that does not exist',
                grid: [],
                image: 'nonexistent-game.png',
                date: new Date(),
                visibility: false,
                _id: 'game000',
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            gateway.handleJoinGame(clientSocket, { secretCode, game });

            expect(sessionsService.getSession).toHaveBeenCalledWith(secretCode);

            expect(clientSocket.emit).toHaveBeenCalledWith('joinGameResponse', {
                success: false,
                message: 'Code invalide',
            });

            expect(clientSocket.join).not.toHaveBeenCalledWith(secretCode);
            expect(clientSocket.join).not.toHaveBeenCalledWith(JSON.stringify(game));

            expect(server.to).not.toHaveBeenCalled();
            expect(server.emit).not.toHaveBeenCalled();
        });

        it('should emit joinGameResponse with success false if session is full', () => {
            const secretCode = 'secret456';
            const game: Game = {
                name: 'Full Game',
                size: '6x6',
                mode: 'Competitive',
                description: 'A full game session',
                grid: [],
                image: 'full-game.png',
                date: new Date(),
                visibility: true,
                _id: 'game111',
            };

            const session = {
                selectedGameID: game._id,
                players: [
                    {
                        socketId: 'player1',
                        name: 'Player1',
                        avatar: 'avatar1',
                        attributes: {},
                        isOrganizer: false,
                        position: { row: 0, col: 0 },
                        accessibleTiles: [],
                    },
                ],
                locked: false,
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            (sessionsService.isSessionFull as jest.Mock).mockReturnValue(true);

            gateway.handleJoinGame(clientSocket, { secretCode, game });

            expect(sessionsService.getSession).toHaveBeenCalledWith(secretCode);

            expect(sessionsService.isSessionFull).toHaveBeenCalledWith(session);

            expect(clientSocket.emit).toHaveBeenCalledWith('joinGameResponse', {
                success: false,
                message: 'Le nombre maximum de joueurs est atteint.',
            });

            expect(clientSocket.join).not.toHaveBeenCalled();

            expect(server.to).not.toHaveBeenCalled();
            expect(server.emit).not.toHaveBeenCalled();
        });

        it('should emit joinGameResponse with success false if session is locked', () => {
            const secretCode = 'secret789';
            const game: Game = {
                name: 'Locked Game',
                size: '7x7',
                mode: 'Solo',
                description: 'A locked game session',
                grid: [],
                image: 'locked-game.png',
                date: new Date(),
                visibility: false,
                _id: 'game222',
            };

            const session = {
                selectedGameID: game._id,
                players: [],
                locked: true,
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            (sessionsService.isSessionFull as jest.Mock).mockReturnValue(false);

            gateway.handleJoinGame(clientSocket, { secretCode, game });

            expect(sessionsService.getSession).toHaveBeenCalledWith(secretCode);

            expect(sessionsService.isSessionFull).toHaveBeenCalledWith(session);

            expect(clientSocket.emit).toHaveBeenCalledWith('joinGameResponse', {
                success: false,
                message: 'La salle est verrouillée.',
            });

            expect(clientSocket.join).not.toHaveBeenCalled();

            expect(server.to).not.toHaveBeenCalled();
            expect(server.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleAvatarInfoRequest', () => {
        it('should emit avatar info if player with the avatar exists', async () => {
            const sessionCode = 'session4';
            const avatar = 'avatarX';
            const player = {
                name: 'Eve',
                avatar: 'avatarX',
            };

            const session = {
                players: [player],
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            await gateway.handleAvatarInfoRequest(clientSocket, { sessionCode, avatar });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            expect(clientSocket.emit).toHaveBeenCalledWith('avatarInfo', { name: 'Eve', avatar: 'avatarX' });
        });

        it('should do nothing if the session does not exist', async () => {
            const sessionCode = 'invalidSession';
            const avatar = 'avatarY';

            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            await gateway.handleAvatarInfoRequest(clientSocket, { sessionCode, avatar });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            expect(clientSocket.emit).not.toHaveBeenCalled();
        });

        it('should do nothing if no player has the requested avatar', async () => {
            const sessionCode = 'session5';
            const avatar = 'nonexistentAvatar';

            const session = {
                players: [
                    { name: 'Alice', avatar: 'avatarA' },
                    { name: 'Bob', avatar: 'avatarB' },
                ],
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            await gateway.handleAvatarInfoRequest(clientSocket, { sessionCode, avatar });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            expect(clientSocket.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleTileInfoRequest', () => {
        it('should emit tile info if session exists and tile is valid', async () => {
            const sessionCode = 'session6';
            const row = 2;
            const col = 3;
            const tile = {
                images: ['tile1.png'],
                isOccuped: false,
            };

            const session = {
                grid: [
                    [
                        { images: ['tile0_0.png'], isOccuped: false },
                        { images: ['tile0_1.png'], isOccuped: false },
                        { images: ['tile0_2.png'], isOccuped: false },
                        { images: ['tile0_3.png'], isOccuped: false },
                    ],
                    [
                        { images: ['tile1_0.png'], isOccuped: false },
                        { images: ['tile1_1.png'], isOccuped: false },
                        { images: ['tile1_2.png'], isOccuped: false },
                        { images: ['tile1_3.png'], isOccuped: false },
                    ],
                    [
                        { images: ['tile2_0.png'], isOccuped: false },
                        { images: ['tile2_1.png'], isOccuped: false },
                        { images: ['tile2_2.png'], isOccuped: false },
                        tile,
                    ],
                ],
            };

            const movementCost = 5;
            const tileEffect = 'Boost';
            const tileType = 'wall'; 
            const tileDetails = {
                name: 'wall',
                label: 'Mur: on ne peut pas passer à travers.',
                alt: 'Wall Tile',
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            (movementService.getMovementCost as jest.Mock).mockReturnValue(movementCost);
            (movementService.getTileEffect as jest.Mock).mockReturnValue(tileEffect);
            (movementService.getTileType as jest.Mock).mockReturnValue(tileType);

            jest.mock('@app/constants/tiles-constants', () => ({
                tilesList: [
                    { name: 'wall', label: 'Mur: on ne peut pas passer à travers.', alt: 'Wall Tile' },
                ],
            }));

            await gateway.handleTileInfoRequest(clientSocket, { sessionCode, row, col });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            expect(movementService.getMovementCost).toHaveBeenCalledWith(tile);
            expect(movementService.getTileEffect).toHaveBeenCalledWith(tile);
            (movementService.getTileType as jest.Mock).mockReturnValue(tileType);

            expect(clientSocket.emit).toHaveBeenCalledWith('tileInfo', {
                type: tileType,
                label: tileDetails.label,
                alt: tileDetails.alt,
                cost: movementCost,
                effect: tileEffect,
                objectInfo: null, 
            });
        });

        it('should do nothing if the session does not exist', async () => {
            const sessionCode = 'invalidSession2';
            const row = 1;
            const col = 1;

            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            await gateway.handleTileInfoRequest(clientSocket, { sessionCode, row, col });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            expect(movementService.getMovementCost).not.toHaveBeenCalled();
            expect(movementService.getTileEffect).not.toHaveBeenCalled();

            expect(clientSocket.emit).not.toHaveBeenCalled();
        });
    });

    it('should handle startGame event and execute the try block', async () => {
        const sessionCode = '1234';
        const session = {
            selectedGameID: 'game-id',
            players: [],
            grid: [],
            statistics: {
                totalTerrainTiles: 0,
                totalDoors: 0,
                startTime: new Date(),
            },
        };
        const game: Game = {
            _id: 'game-id',
            name: 'Test Game',
            size: { x: 10, y: 10 },
            grid: [[{ images: [] }]],
        } as any;

        sessionsService.getSession = jest.fn().mockReturnValue(session);
        changeGridService.changeGrid = jest.fn().mockReturnValue([[{ images: [] }]]);
        changeGridService.countElements = jest.fn().mockReturnValue(5);
        gameService.getGameById = jest.fn().mockResolvedValue(game);

        await gateway.handleStartGame(clientSocket, { sessionCode });

        expect(sessionsService.calculateTurnOrder).toHaveBeenCalledWith(session, sessionCode, server);
        expect(gameService.getGameById).toHaveBeenCalledWith('game-id');
        expect(changeGridService.changeGrid).toHaveBeenCalledWith(game.grid, session.players);
        expect(server.to).toHaveBeenCalledWith(sessionCode);
        expect(server.to(sessionCode).emit).toHaveBeenCalledWith('gameStarted', { sessionCode });
        expect(server.to(sessionCode).emit).toHaveBeenCalledWith('getGameInfo', { name: game.name, size: game.size });
        expect(server.to(sessionCode).emit).toHaveBeenCalledWith('gridArray', { sessionCode, grid: session.grid });
        expect(changeGridService.countElements).toHaveBeenCalledTimes(2);
        expect(changeGridService.countElements).toHaveBeenCalledWith(session.grid, TERRAIN_TYPES);
        expect(changeGridService.countElements).toHaveBeenCalledWith(session.grid, DOOR_TYPES);
        expect(session.statistics.totalTerrainTiles).toBeDefined();
        expect(session.statistics.totalDoors).toBeDefined();
        expect(session.statistics.startTime).toBeInstanceOf(Date);
        expect(sessionsService.startTurn).toHaveBeenCalledWith(sessionCode, server);
    });

    it('should handle tileInfoRequest and find objectKey', async () => {
        const sessionCode = '1234';
        const row = 0;
        const col = 0;
        const session = {
            grid: [[{ images: ['assets/objects/Shield.png'] }]],
        };

        const tileDetails = {
            name: 'Grass',
            label: 'Grass Tile',
            alt: 'A grassy tile',
        };

        sessionsService.getSession = jest.fn().mockReturnValue(session);
        movementService.getTileType = jest.fn().mockReturnValue('Grass');
        movementService.getMovementCost = jest.fn().mockReturnValue(1);
        movementService.getTileEffect = jest.fn().mockReturnValue('None');

        jest.spyOn(TILES_LIST, 'find').mockReturnValue(tileDetails);

        const client = {
            emit: jest.fn(),
        } as any;

        await gateway.handleTileInfoRequest(client, { sessionCode, row, col });

        expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
        expect(movementService.getTileType).toHaveBeenCalledWith(session.grid[row][col].images);
        expect(client.emit).toHaveBeenCalledWith('tileInfo', expect.any(Object));

        const emittedTileInfo = client.emit.mock.calls[0][1];
        expect(emittedTileInfo.objectInfo).toEqual({
            name: 'Shield',
            effectSummary: 'Adds 2 to defence',
        });
    });
    it('should return correct effect summary from getObjectEffectSummary', () => {
        const objectKey = 'shield';
        const effectSummary = (gateway as any).getObjectEffectSummary(objectKey, '');
        expect(effectSummary).toBe('Adds 2 to defence');
    });

    it('should return "No effect" for unknown objectKey in getObjectEffectSummary', () => {
        const objectKey = 'unknown';
        const effectSummary = (gateway as any).getObjectEffectSummary(objectKey, '');
        expect(effectSummary).toBe('No effect');
    });

    describe('getObjectEffectSummary', () => {
        it('should return correct effect summary for all objectKeys', () => {
            const testCases = [
                { objectKey: 'shield', expected: 'Adds 2 to defence' },
                { objectKey: 'potion', expected: 'Adds 2 to life, subtracts 1 from attack' },
                { objectKey: 'wheel', expected: 'Adds 2 to speed on grass' },
                { objectKey: 'sword', expected: 'Adds 2 to attack if only one item in inventory' },
                { objectKey: 'flag', expected: 'Take it to your starting point to win the game' },
                { objectKey: 'flyingshoe', expected: 'Move to any tile' },
                { objectKey: 'unknown', expected: 'No effect' },
            ];

            testCases.forEach(({ objectKey, expected }) => {
                const effectSummary = (gateway as any).getObjectEffectSummary(objectKey, '');
                expect(effectSummary).toBe(expected);
            });
        });
    });
});
