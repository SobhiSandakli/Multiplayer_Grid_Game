/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-lines */
import { Test, TestingModule } from '@nestjs/testing';
import { TurnGateway } from './turn.gateway';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { MovementService } from '@app/services/movement/movement.service';
import { TurnService } from '@app/services/turn/turn.service';
import { Server, Socket } from 'socket.io';
import { EVASION_DELAY } from '@app/constants/session-gateway-constants';

describe('TurnGateway', () => {
    let gateway: TurnGateway;
    let sessionsService: SessionsService;
    let changeGridService: ChangeGridService;
    let movementService: MovementService;
    let turnService: TurnService;
    let server: Server;
    let clientSocket: Socket;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TurnGateway,
                {
                    provide: SessionsService,
                    useValue: {
                        getSession: jest.fn(),
                        endTurn: jest.fn(),
                    },
                },
                {
                    provide: ChangeGridService,
                    useValue: {
                        moveImage: jest.fn(),
                    },
                },
                {
                    provide: MovementService,
                    useValue: {
                        isDestinationAccessible: jest.fn(),
                        calculateMovementCost: jest.fn(),
                        getPathToDestination: jest.fn(),
                        calculatePathWithSlips: jest.fn(),
                        updatePlayerAttributesOnTile: jest.fn(),
                        calculateAccessibleTiles: jest.fn(),
                    },
                },
                {
                    provide: TurnService,
                    useValue: {
                        isCurrentPlayerTurn: jest.fn(),
                    },
                },
            ],
        }).compile();

        gateway = module.get<TurnGateway>(TurnGateway);
        sessionsService = module.get<SessionsService>(SessionsService);
        changeGridService = module.get<ChangeGridService>(ChangeGridService);
        movementService = module.get<MovementService>(MovementService);
        turnService = module.get<TurnService>(TurnService);

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

    describe('handleEndTurn', () => {
        it('should end the turn if session exists and client is current player', () => {
            const sessionCode = 'session1';
            const session = {
                turnData: {
                    currentPlayerSocketId: 'client-socket-id',
                },
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleEndTurn(clientSocket, { sessionCode });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
            expect(sessionsService.endTurn).toHaveBeenCalledWith(sessionCode, server);
        });

        it('should not end the turn if session does not exist', () => {
            const sessionCode = 'invalidSession';

            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            gateway.handleEndTurn(clientSocket, { sessionCode });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
            expect(sessionsService.endTurn).not.toHaveBeenCalled();
        });

        it('should not end the turn if client is not the current player', () => {
            const sessionCode = 'session2';
            const session = {
                turnData: {
                    currentPlayerSocketId: 'other-client-id',
                },
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleEndTurn(clientSocket, { sessionCode });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
            expect(sessionsService.endTurn).not.toHaveBeenCalled();
        });
    });

    describe('handleGetAccessibleTiles', () => {
        it('should emit accessible tiles if session and player exist and it is their turn', () => {
            const sessionCode = 'session3';
            const session = {
                players: [
                    {
                        socketId: 'client-socket-id',
                        accessibleTiles: ['tile1', 'tile2'],
                    },
                ],
                turnData: {
                    currentPlayerSocketId: 'client-socket-id',
                },
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleGetAccessibleTiles(clientSocket, { sessionCode });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
            expect(clientSocket.emit).toHaveBeenCalledWith('accessibleTiles', { accessibleTiles: ['tile1', 'tile2'] });
        });

        it('should not emit accessible tiles if session does not exist', () => {
            const sessionCode = 'invalidSession';

            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            gateway.handleGetAccessibleTiles(clientSocket, { sessionCode });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
            expect(clientSocket.emit).not.toHaveBeenCalled();
        });

        it('should not emit accessible tiles if player does not exist', () => {
            const sessionCode = 'session4';
            const session = {
                players: [],
                turnData: {
                    currentPlayerSocketId: 'client-socket-id',
                },
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleGetAccessibleTiles(clientSocket, { sessionCode });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
            expect(clientSocket.emit).not.toHaveBeenCalled();
        });

        it("should not emit accessible tiles if it is not the player's turn", () => {
            const sessionCode = 'session5';
            const session = {
                players: [
                    {
                        socketId: 'client-socket-id',
                        accessibleTiles: ['tile1', 'tile2'],
                    },
                ],
                turnData: {
                    currentPlayerSocketId: 'other-client-id',
                },
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleGetAccessibleTiles(clientSocket, { sessionCode });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
            expect(clientSocket.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleMovePlayer', () => {
        it('should process player movement if all conditions are met', () => {
            const sessionCode = 'session6';
            const data = {
                sessionCode,
                source: { row: 0, col: 0 },
                destination: { row: 1, col: 1 },
                movingImage: 'image1.png',
            };
            const player = {
                socketId: 'client-socket-id',
                position: { row: 0, col: 0 },
                attributes: {
                    speed: { currentValue: 10 },
                },
                accessibleTiles: ['tile1', 'tile2'],
            };
            const session = {
                players: [player],
                grid: [
                    [
                        { images: ['image1.png'], isOccuped: false },
                        { images: [], isOccuped: false },
                    ],
                    [
                        { images: [], isOccuped: false },
                        { images: [], isOccuped: false },
                    ],
                ],
                turnData: {
                    currentPlayerSocketId: 'client-socket-id',
                },
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);
            (turnService.isCurrentPlayerTurn as jest.Mock).mockReturnValue(true);
            (movementService.isDestinationAccessible as jest.Mock).mockReturnValue(true);
            (movementService.calculateMovementCost as jest.Mock).mockReturnValue(5);
            (movementService.getPathToDestination as jest.Mock).mockReturnValue([{ row: 1, col: 1 }]);
            (movementService.calculatePathWithSlips as jest.Mock).mockReturnValue({
                realPath: [{ row: 1, col: 1 }],
                slipOccurred: false,
            });
            (changeGridService.moveImage as jest.Mock).mockReturnValue(true);
            (movementService.updatePlayerAttributesOnTile as jest.Mock).mockReturnValue(undefined);
            (movementService.calculateAccessibleTiles as jest.Mock).mockReturnValue(undefined);

            gateway.handleMovePlayer(clientSocket, data);

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
            expect(turnService.isCurrentPlayerTurn).toHaveBeenCalledWith(session, clientSocket);
            expect(movementService.isDestinationAccessible).toHaveBeenCalledWith(player, data.destination);
            expect(movementService.calculateMovementCost).toHaveBeenCalledWith(data.source, data.destination, player, session.grid);
            expect(movementService.getPathToDestination).toHaveBeenCalledWith(player, data.destination);
            expect(movementService.calculatePathWithSlips).toHaveBeenCalledWith([{ row: 1, col: 1 }], session.grid);
            expect(changeGridService.moveImage).toHaveBeenCalledWith(session.grid, data.source, { row: 1, col: 1 }, data.movingImage);
            expect(player.position).toEqual({ row: 1, col: 1 });
            expect(player.attributes.speed.currentValue).toBe(5);
            expect(movementService.updatePlayerAttributesOnTile).toHaveBeenCalledWith(player, session.grid[1][1]);
            expect(movementService.calculateAccessibleTiles).toHaveBeenCalledWith(session.grid, player, 5);
            expect(clientSocket.emit).toHaveBeenCalledWith('accessibleTiles', { accessibleTiles: player.accessibleTiles });
            expect(server.to).toHaveBeenCalledWith(sessionCode);
            expect(server.emit).toHaveBeenCalledWith('playerMovement', {
                desiredPath: [{ row: 1, col: 1 }],
                realPath: [{ row: 1, col: 1 }],
            });
            expect(server.emit).toHaveBeenCalledWith('playerListUpdate', { players: session.players });
        });

        it('should not process movement if session does not exist', () => {
            const sessionCode = 'invalidSession';
            const data = {
                sessionCode,
                source: { row: 0, col: 0 },
                destination: { row: 1, col: 1 },
                movingImage: 'image1.png',
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            gateway.handleMovePlayer(clientSocket, data);

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
            expect(turnService.isCurrentPlayerTurn).not.toHaveBeenCalled();
            expect(movementService.isDestinationAccessible).not.toHaveBeenCalled();
            expect(changeGridService.moveImage).not.toHaveBeenCalled();
            expect(clientSocket.emit).not.toHaveBeenCalled();
            expect(server.to).not.toHaveBeenCalled();
            expect(server.emit).not.toHaveBeenCalled();
        });

        it('should not process movement if player does not exist', () => {
            const sessionCode = 'session7';
            const data = {
                sessionCode,
                source: { row: 0, col: 0 },
                destination: { row: 1, col: 1 },
                movingImage: 'image1.png',
            };
            const session = {
                players: [],
                grid: [],
                turnData: {
                    currentPlayerSocketId: 'client-socket-id',
                },
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleMovePlayer(clientSocket, data);

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
            expect(turnService.isCurrentPlayerTurn).not.toHaveBeenCalled();
            expect(movementService.isDestinationAccessible).not.toHaveBeenCalled();
            expect(changeGridService.moveImage).not.toHaveBeenCalled();
            expect(clientSocket.emit).not.toHaveBeenCalled();
            expect(server.to).not.toHaveBeenCalled();
            expect(server.emit).not.toHaveBeenCalled();
        });

        it("should not process movement if it is not the player's turn", () => {
            const sessionCode = 'session8';
            const data = {
                sessionCode,
                source: { row: 0, col: 0 },
                destination: { row: 1, col: 1 },
                movingImage: 'image1.png',
            };
            const player = {
                socketId: 'client-socket-id',
                position: { row: 0, col: 0 },
                attributes: {
                    speed: { currentValue: 10 },
                },
                accessibleTiles: ['tile1', 'tile2'],
            };
            const session = {
                players: [player],
                grid: [],
                turnData: {
                    currentPlayerSocketId: 'other-client-id',
                },
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);
            (turnService.isCurrentPlayerTurn as jest.Mock).mockReturnValue(false);

            gateway.handleMovePlayer(clientSocket, data);

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
            expect(turnService.isCurrentPlayerTurn).toHaveBeenCalledWith(session, clientSocket);
            expect(movementService.isDestinationAccessible).not.toHaveBeenCalled();
            expect(changeGridService.moveImage).not.toHaveBeenCalled();
            expect(clientSocket.emit).not.toHaveBeenCalled();
            expect(server.to).not.toHaveBeenCalled();
            expect(server.emit).not.toHaveBeenCalled();
        });

        it('should not process movement if destination is not accessible', () => {
            const sessionCode = 'session9';
            const data = {
                sessionCode,
                source: { row: 0, col: 0 },
                destination: { row: 1, col: 1 },
                movingImage: 'image1.png',
            };
            const player = {
                socketId: 'client-socket-id',
                position: { row: 0, col: 0 },
                attributes: {
                    speed: { currentValue: 10 },
                },
                accessibleTiles: ['tile1', 'tile2'],
            };
            const session = {
                players: [player],
                grid: [],
                turnData: {
                    currentPlayerSocketId: 'client-socket-id',
                },
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);
            (turnService.isCurrentPlayerTurn as jest.Mock).mockReturnValue(true);
            (movementService.isDestinationAccessible as jest.Mock).mockReturnValue(false);

            gateway.handleMovePlayer(clientSocket, data);

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
            expect(turnService.isCurrentPlayerTurn).toHaveBeenCalledWith(session, clientSocket);
            expect(movementService.isDestinationAccessible).toHaveBeenCalledWith(player, data.destination);
            expect(changeGridService.moveImage).not.toHaveBeenCalled();
            expect(clientSocket.emit).not.toHaveBeenCalled();
            expect(server.to).not.toHaveBeenCalled();
            expect(server.emit).not.toHaveBeenCalled();
        });

        it('should finalize movement and handle slip if slipOccurred is true', () => {
            jest.useFakeTimers();

            const sessionCode = 'session10';
            const data = {
                sessionCode,
                source: { row: 0, col: 0 },
                destination: { row: 1, col: 1 },
                movingImage: 'image1.png',
            };
            const player = {
                socketId: 'client-socket-id',
                position: { row: 0, col: 0 },
                attributes: {
                    speed: { currentValue: 10 },
                },
                accessibleTiles: ['tile1', 'tile2'],
                avatar: 'avatarX',
            };
            const session = {
                players: [player],
                grid: [
                    [
                        { images: ['image1.png'], isOccuped: false },
                        { images: [], isOccuped: false },
                    ],
                    [
                        { images: [], isOccuped: false },
                        { images: [], isOccuped: false },
                    ],
                ],
                turnData: {
                    currentPlayerSocketId: 'client-socket-id',
                },
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);
            (turnService.isCurrentPlayerTurn as jest.Mock).mockReturnValue(true);
            (movementService.isDestinationAccessible as jest.Mock).mockReturnValue(true);
            (movementService.calculateMovementCost as jest.Mock).mockReturnValue(5);
            (movementService.getPathToDestination as jest.Mock).mockReturnValue([{ row: 1, col: 1 }]);
            (movementService.calculatePathWithSlips as jest.Mock).mockReturnValue({
                realPath: [{ row: 1, col: 1 }],
                slipOccurred: true,
            });
            (changeGridService.moveImage as jest.Mock).mockReturnValue(true);
            (movementService.updatePlayerAttributesOnTile as jest.Mock).mockReturnValue(undefined);
            (movementService.calculateAccessibleTiles as jest.Mock).mockReturnValue(undefined);

            gateway.handleMovePlayer(clientSocket, data);

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
            expect(turnService.isCurrentPlayerTurn).toHaveBeenCalledWith(session, clientSocket);
            expect(movementService.isDestinationAccessible).toHaveBeenCalledWith(player, data.destination);
            expect(movementService.calculateMovementCost).toHaveBeenCalledWith(data.source, data.destination, player, session.grid);
            expect(movementService.getPathToDestination).toHaveBeenCalledWith(player, data.destination);
            expect(movementService.calculatePathWithSlips).toHaveBeenCalledWith([{ row: 1, col: 1 }], session.grid);
            expect(changeGridService.moveImage).toHaveBeenCalledWith(session.grid, data.source, { row: 1, col: 1 }, data.movingImage);
            expect(player.position).toEqual({ row: 1, col: 1 });
            expect(player.attributes.speed.currentValue).toBe(5);
            expect(movementService.updatePlayerAttributesOnTile).toHaveBeenCalledWith(player, session.grid[1][1]);
            expect(movementService.calculateAccessibleTiles).toHaveBeenCalledWith(session.grid, player, 5);
            expect(clientSocket.emit).toHaveBeenCalledWith('accessibleTiles', { accessibleTiles: player.accessibleTiles });
            expect(server.to).toHaveBeenCalledWith(sessionCode);
            expect(server.emit).toHaveBeenCalledWith('playerMovement', {
                avatar: player.avatar,
                desiredPath: [{ row: 1, col: 1 }],
                realPath: [{ row: 1, col: 1 }],
            });
            expect(server.emit).toHaveBeenCalledWith('playerListUpdate', { players: session.players });

            jest.advanceTimersByTime(EVASION_DELAY);

            expect(sessionsService.endTurn).toHaveBeenCalledWith(sessionCode, server);
        });
    });
});
