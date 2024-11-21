/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-lines */
import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { MovementService } from '@app/services/movement/movement.service';
import { GameService } from '@app/services/game/game.service';
import { Server, Socket } from 'socket.io';
import { Game } from '@app/model/schema/game.schema';

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
                        // Add other methods if necessary
                    },
                },
                {
                    provide: ChangeGridService,
                    useValue: {
                        changeGrid: jest.fn(),
                    },
                },
                {
                    provide: MovementService,
                    useValue: {
                        getMovementCost: jest.fn(),
                        getTileEffect: jest.fn(),
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

        // Mock the socket.io server
        server = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            sockets: {
                sockets: new Map<string, Socket>(),
            },
        } as unknown as Server;

        // Assign the mocked server to the gateway's private property
        (gateway as any).server = server;

        // Mock the client socket
        clientSocket = {
            id: 'client-socket-id',
            join: jest.fn(),
            leave: jest.fn(),
            emit: jest.fn(),
            rooms: new Set(['client-socket-id']), // Each socket is in its own room by default
        } as unknown as Socket;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('handleStartGame', () => {
        // it('should start the game successfully', async () => {
        //     const sessionCode = 'session1';
        //     const selectedGameID = 'game123';
        //     const game: Game = {
        //         name: 'Test Game',
        //         size: '10x10',
        //         mode: 'Adventure',
        //         description: 'A test game description',
        //         grid: [
        //             [
        //                 { images: ['image1.png'], isOccuped: false },
        //                 { images: ['image2.png'], isOccuped: true },
        //             ],
        //         ],
        //         image: 'game-image.png',
        //         date: new Date(),
        //         visibility: true,
        //         _id: 'game123',
        //     };

        //     const session = {
        //         selectedGameID,
        //         grid: [],
        //         players: [],
        //     };

        //     // Mock getSession to return the session
        //     (sessionsService.getSession as jest.Mock).mockReturnValue(session);

        //     // Mock getGameById to return the game
        //     (gameService.getGameById as jest.Mock).mockResolvedValue(game);

        //     // Mock changeGrid to return a new grid
        //     const newGrid = [
        //         [
        //             { images: ['newImage1.png'], isOccuped: false },
        //             { images: ['newImage2.png'], isOccuped: true },
        //         ],
        //     ];
        //     (changeGridService.changeGrid as jest.Mock).mockReturnValue(newGrid);

        //     // Call handleStartGame
        //     await gateway.handleStartGame(clientSocket, { sessionCode });

        //     // Verify that getSession was called correctly
        //     expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

        //     // Verify that calculateTurnOrder was called
        //     expect(sessionsService.calculateTurnOrder).toHaveBeenCalledWith(session);

        //     // Verify that getGameById was called
        //     expect(gameService.getGameById).toHaveBeenCalledWith(selectedGameID);

        //     // Verify that changeGrid was called
        //     expect(changeGridService.changeGrid).toHaveBeenCalledWith(game.grid, session.players);

        //     // Verify that the session's grid was updated
        //     expect(session.grid).toBe(newGrid);

        //     // Verify that events were emitted
        //     expect(server.to).toHaveBeenCalledWith(sessionCode);
        //     expect(server.emit).toHaveBeenCalledWith('gameStarted', {
        //         sessionCode,
        //     });
        //     expect(server.emit).toHaveBeenCalledWith('getGameInfo', { name: game.name, size: game.size });
        //     expect(server.emit).toHaveBeenCalledWith('gridArray', { sessionCode, grid: newGrid });

        //     // Verify that startTurn was called
        //     expect(sessionsService.startTurn).toHaveBeenCalledWith(sessionCode, server);
        // });

        it('should not start the game if the session does not exist', async () => {
            const sessionCode = 'invalidSession';

            // Mock getSession to return undefined
            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            // Call handleStartGame
            await gateway.handleStartGame(clientSocket, { sessionCode });

            // Verify that getSession was called
            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            // Verify that no further actions were taken
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

            // Mock getSession to return the session
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            // Mock getGameById to throw an error
            (gameService.getGameById as jest.Mock).mockRejectedValue(new Error('Game not found'));

            // Call handleStartGame
            await gateway.handleStartGame(clientSocket, { sessionCode });

            // Verify that getSession was called
            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            // Verify that calculateTurnOrder was called
            expect(sessionsService.calculateTurnOrder).toHaveBeenCalledWith(session);

            // Verify that getGameById was called
            expect(gameService.getGameById).toHaveBeenCalledWith(selectedGameID);

            // Verify that no events were emitted due to error
            expect(server.to).not.toHaveBeenCalled();
            expect(server.emit).not.toHaveBeenCalled();

            // Verify that startTurn was not called
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

            // Mock getSession to return the session
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            // Call handleGetGridArray
            gateway.handleGetGridArray(clientSocket, { sessionCode });

            // Verify that getSession was called
            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            // Verify that the client received the grid array
            expect(clientSocket.emit).toHaveBeenCalledWith('gridArray', { sessionCode, grid });
        });

        it('should do nothing if the session does not exist', () => {
            const sessionCode = 'invalidSession';

            // Mock getSession to return undefined
            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            // Call handleGetGridArray
            gateway.handleGetGridArray(clientSocket, { sessionCode });

            // Verify that getSession was called
            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            // Verify that the client did not receive the grid array
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

            // Mock getSession to return the session
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            // Mock isSessionFull to return false
            (sessionsService.isSessionFull as jest.Mock).mockReturnValue(false);

            // Call handleJoinGame
            gateway.handleJoinGame(clientSocket, { secretCode, game });

            // Verify that getSession was called
            expect(sessionsService.getSession).toHaveBeenCalledWith(secretCode);

            // Verify that isSessionFull was called
            expect(sessionsService.isSessionFull).toHaveBeenCalledWith(session);

            // Verify that the client joined the secretCode room and game room
            expect(clientSocket.join).toHaveBeenCalledWith(secretCode);
            expect(clientSocket.join).toHaveBeenCalledWith(JSON.stringify(game));

            // Verify that joinGameResponse was emitted with success true
            expect(clientSocket.emit).toHaveBeenCalledWith('joinGameResponse', { success: true });

            // Verify that getGameInfo was emitted to the client
            expect(clientSocket.emit).toHaveBeenCalledWith('getGameInfo', { sessionCode: secretCode });

            // Verify that playerListUpdate was emitted to the secretCode room
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

            // Mock getSession to return undefined
            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            // Call handleJoinGame
            gateway.handleJoinGame(clientSocket, { secretCode, game });

            // Verify that getSession was called
            expect(sessionsService.getSession).toHaveBeenCalledWith(secretCode);

            // Verify that joinGameResponse was emitted with success false and appropriate message
            expect(clientSocket.emit).toHaveBeenCalledWith('joinGameResponse', {
                success: false,
                message: 'Code invalide',
            });

            // Verify that client did not join any rooms
            expect(clientSocket.join).not.toHaveBeenCalledWith(secretCode);
            expect(clientSocket.join).not.toHaveBeenCalledWith(JSON.stringify(game));

            // Verify that no other events were emitted
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

            // Mock getSession to return the session
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            // Mock isSessionFull to return true
            (sessionsService.isSessionFull as jest.Mock).mockReturnValue(true);

            // Call handleJoinGame
            gateway.handleJoinGame(clientSocket, { secretCode, game });

            // Verify that getSession was called
            expect(sessionsService.getSession).toHaveBeenCalledWith(secretCode);

            // Verify that isSessionFull was called
            expect(sessionsService.isSessionFull).toHaveBeenCalledWith(session);

            // Verify that joinGameResponse was emitted with success false and appropriate message
            expect(clientSocket.emit).toHaveBeenCalledWith('joinGameResponse', {
                success: false,
                message: 'Le nombre maximum de joueurs est atteint.',
            });

            // Verify that client did not join any rooms
            expect(clientSocket.join).not.toHaveBeenCalled();

            // Verify that no other events were emitted
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

            // Mock getSession to return the session
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            // Mock isSessionFull to return false
            (sessionsService.isSessionFull as jest.Mock).mockReturnValue(false);

            // Call handleJoinGame
            gateway.handleJoinGame(clientSocket, { secretCode, game });

            // Verify that getSession was called
            expect(sessionsService.getSession).toHaveBeenCalledWith(secretCode);

            // Verify that isSessionFull was called
            expect(sessionsService.isSessionFull).toHaveBeenCalledWith(session);

            // Verify that joinGameResponse was emitted with success false and appropriate message
            expect(clientSocket.emit).toHaveBeenCalledWith('joinGameResponse', {
                success: false,
                message: 'La salle est verrouillée.',
            });

            // Verify that client did not join any rooms
            expect(clientSocket.join).not.toHaveBeenCalled();

            // Verify that no other events were emitted
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

            // Mock getSession to return the session
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            // Call handleAvatarInfoRequest
            await gateway.handleAvatarInfoRequest(clientSocket, { sessionCode, avatar });

            // Verify that getSession was called
            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            // Verify that the client received the avatar info
            expect(clientSocket.emit).toHaveBeenCalledWith('avatarInfo', { name: 'Eve', avatar: 'avatarX' });
        });

        it('should do nothing if the session does not exist', async () => {
            const sessionCode = 'invalidSession';
            const avatar = 'avatarY';

            // Mock getSession to return undefined
            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            // Call handleAvatarInfoRequest
            await gateway.handleAvatarInfoRequest(clientSocket, { sessionCode, avatar });

            // Verify that getSession was called
            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            // Verify that the client did not receive any avatar info
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

            // Mock getSession to return the session
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            // Call handleAvatarInfoRequest
            await gateway.handleAvatarInfoRequest(clientSocket, { sessionCode, avatar });

            // Verify that getSession was called
            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            // Verify that the client did not receive any avatar info
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

            // Mock getSession to return the session
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            // Mock movementService methods
            (movementService.getMovementCost as jest.Mock).mockReturnValue(movementCost);
            (movementService.getTileEffect as jest.Mock).mockReturnValue(tileEffect);

            // Call handleTileInfoRequest
            await gateway.handleTileInfoRequest(clientSocket, { sessionCode, row, col });

            // Verify that getSession was called
            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            // Verify that movementService methods were called
            expect(movementService.getMovementCost).toHaveBeenCalledWith(tile);
            expect(movementService.getTileEffect).toHaveBeenCalledWith(tile);

            // Verify that the client received the tile info
            expect(clientSocket.emit).toHaveBeenCalledWith('tileInfo', {
                cost: movementCost,
                effect: tileEffect,
            });
        });

        it('should do nothing if the session does not exist', async () => {
            const sessionCode = 'invalidSession2';
            const row = 1;
            const col = 1;

            // Mock getSession to return undefined
            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            // Call handleTileInfoRequest
            await gateway.handleTileInfoRequest(clientSocket, { sessionCode, row, col });

            // Verify that getSession was called
            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);

            // Verify that movementService methods were not called
            expect(movementService.getMovementCost).not.toHaveBeenCalled();
            expect(movementService.getTileEffect).not.toHaveBeenCalled();

            // Verify that the client did not receive any tile info
            expect(clientSocket.emit).not.toHaveBeenCalled();
        });
    });
});
