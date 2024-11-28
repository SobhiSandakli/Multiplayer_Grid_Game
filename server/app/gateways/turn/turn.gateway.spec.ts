/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-lines */
import { Test, TestingModule } from '@nestjs/testing';
import { TurnGateway } from './turn.gateway';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { MovementService } from '@app/services/movement/movement.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { TurnService } from '@app/services/turn/turn.service';
import { Server, Socket } from 'socket.io';
import { createMock } from '@golevelup/ts-jest';
import { ObjectsImages } from '@app/constants/objects-enums-constants';

describe('TurnGateway', () => {
    let gateway: TurnGateway;
    let sessionsService: SessionsService;
    let movementService: MovementService;
    let turnService: TurnService;
    let server: Partial<Server>;
    let client: Partial<Socket>;

    beforeEach(async () => {
        server = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };

        client = createMock<Socket>({
            id: 'client-socket-id',
            emit: jest.fn(),
        });

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
                    provide: MovementService,
                    useValue: {
                        isDestinationAccessible: jest.fn(),
                        processPlayerMovement: jest.fn(),
                        handleItemDiscard: jest.fn(),
                    },
                },
                {
                    provide: ChangeGridService,
                    useValue: {},
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
        movementService = module.get<MovementService>(MovementService);
        turnService = module.get<TurnService>(TurnService);

        (gateway as any).server = server as Server;
    });

    const createMockSession = () => ({
        turnData: {
            currentPlayerSocketId: 'client-socket-id',
        },
        players: [
            {
                socketId: 'client-socket-id',
                accessibleTiles: [{ row: 1, col: 1 }],
            },
            {
                socketId: 'other-socket-id',
                accessibleTiles: [],
            },
        ],
    });

    describe('handleEndTurn', () => {
        it('should end the turn if client is the current player', () => {
            const sessionCode = 'testSession';
            const session = createMockSession();
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleEndTurn(client as Socket, { sessionCode });

            expect(sessionsService.getSession).toHaveBeenCalledWith(sessionCode);
            expect(sessionsService.endTurn).toHaveBeenCalledWith(sessionCode, server);
        });

        it('should not end the turn if session is invalid', () => {
            const sessionCode = 'invalidSession';
            (sessionsService.getSession as jest.Mock).mockReturnValue(null);
            gateway.handleEndTurn(client as Socket, { sessionCode });
            expect(sessionsService.endTurn).not.toHaveBeenCalled();
        });

        it('should not end the turn if client is not the current player', () => {
            const sessionCode = 'testSession';
            const session = createMockSession();
            session.turnData.currentPlayerSocketId = 'other-socket-id';
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleEndTurn(client as Socket, { sessionCode });

            expect(sessionsService.endTurn).not.toHaveBeenCalled();
        });
    });

    describe('handleGetAccessibleTiles', () => {
        it('should emit accessible tiles to the client if they are the current player', () => {
            const sessionCode = 'testSession';
            const session = createMockSession();
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleGetAccessibleTiles(client as Socket, { sessionCode });

            expect(client.emit).toHaveBeenCalledWith('accessibleTiles', {
                accessibleTiles: session.players[0].accessibleTiles,
            });
        });
        it('should not emit accessible tiles if the session is invalid', () => {
            const sessionCode = 'invalidSession';
            const session = createMockSession();
            (sessionsService.getSession as jest.Mock).mockReturnValue(null);
            gateway.handleGetAccessibleTiles(client as Socket, { sessionCode });
            expect(client.emit).not.toHaveBeenCalled();
        });

        it('should not emit accessible tiles if the client is not in the session', () => {
            const sessionCode = 'testSession';
            const session = createMockSession();
            session.players = [];
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleGetAccessibleTiles(client as Socket, { sessionCode });

            expect(client.emit).not.toHaveBeenCalled();
        });

        it('should not emit accessible tiles if the client is not the current player', () => {
            const sessionCode = 'testSession';
            const session = createMockSession();
            session.turnData.currentPlayerSocketId = 'other-socket-id';
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleGetAccessibleTiles(client as Socket, { sessionCode });

            expect(client.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleMovePlayer', () => {
        it('should process player movement if destination is accessible and client is the current player', () => {
            const sessionCode = 'testSession';
            const data = {
                sessionCode,
                source: { row: 0, col: 0 },
                destination: { row: 1, col: 1 },
                movingImage: 'image.png',
            };
            const session = createMockSession();
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);
            (turnService.isCurrentPlayerTurn as jest.Mock).mockReturnValue(true);
            (movementService.isDestinationAccessible as jest.Mock).mockReturnValue(true);

            gateway.handleMovePlayer(client as Socket, data);

            expect(movementService.processPlayerMovement).toHaveBeenCalledWith(client, session.players[0], session, data, server);
        });
        it('should not process movement if session is invalid', () => {
            const sessionCode = 'invalidSession';
            const data = {
                sessionCode,
                source: { row: 0, col: 0 },
                destination: { row: 1, col: 1 },
                movingImage: 'image.png',
            };
            (sessionsService.getSession as jest.Mock).mockReturnValue(null);
            expect(() => gateway.handleMovePlayer(client as Socket, data)).not.toThrow();
        });

        it('should not process movement if destination is not accessible', () => {
            const sessionCode = 'testSession';
            const data = {
                sessionCode,
                source: { row: 0, col: 0 },
                destination: { row: 1, col: 1 },
                movingImage: 'image.png',
            };
            const session = createMockSession();
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);
            (turnService.isCurrentPlayerTurn as jest.Mock).mockReturnValue(true);
            (movementService.isDestinationAccessible as jest.Mock).mockReturnValue(false);

            gateway.handleMovePlayer(client as Socket, data);

            expect(movementService.processPlayerMovement).not.toHaveBeenCalled();
        });

        it('should not process movement if client is not the current player', () => {
            const sessionCode = 'testSession';
            const data = {
                sessionCode,
                source: { row: 0, col: 0 },
                destination: { row: 1, col: 1 },
                movingImage: 'image.png',
            };
            const session = createMockSession();
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);
            (turnService.isCurrentPlayerTurn as jest.Mock).mockReturnValue(false);

            gateway.handleMovePlayer(client as Socket, data);

            expect(movementService.processPlayerMovement).not.toHaveBeenCalled();
        });
    });
    describe('handleDiscardItem', () => {
        it('should discard item if player is found and session is valid', () => {
            const sessionCode = 'testSession';
            const discardedItem = ObjectsImages.Potion;
            const pickedUpItem = ObjectsImages.Shield;
            const session = createMockSession();
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleDiscardItem(client as Socket, {
                sessionCode,
                discardedItem,
                pickedUpItem,
            });

            expect(movementService.handleItemDiscard).toHaveBeenCalledWith(session.players[0], discardedItem, pickedUpItem, server, sessionCode);
        });

        it('should not discard item if player is not found in session', () => {
            const sessionCode = 'testSession';
            const discardedItem = ObjectsImages.Flag;
            const pickedUpItem = ObjectsImages.Sword;
            const session = createMockSession();
            session.players = [];
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleDiscardItem(client as Socket, {
                sessionCode,
                discardedItem,
                pickedUpItem,
            });

            expect(movementService.handleItemDiscard).not.toHaveBeenCalled();
        });

        it('should not discard item if session is invalid or not found', () => {
            const sessionCode = 'invalidSession';
            const discardedItem = ObjectsImages.Key;
            const pickedUpItem = ObjectsImages.Wheel;
            (sessionsService.getSession as jest.Mock).mockReturnValue(null);

            gateway.handleDiscardItem(client as Socket, {
                sessionCode,
                discardedItem,
                pickedUpItem,
            });

            expect(movementService.handleItemDiscard).not.toHaveBeenCalled();
        });
    });
});
