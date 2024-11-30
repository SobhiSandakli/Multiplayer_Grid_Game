/* eslint-disable  @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { DebugModeService } from './debugMode.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { MovementService } from '@app/services/movement/movement.service';
import { Socket, Server } from 'socket.io';
import { Player } from '@app/interfaces/player/player.interface';
import { ObjectsImages } from '@app/constants/objects-enums-constants';

describe('DebugModeService', () => {
    let debugModeService: DebugModeService;
    let sessionsService: SessionsService;
    let movementService: MovementService;
    let client: Socket;
    let server: Server;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DebugModeService,
                {
                    provide: SessionsService,
                    useValue: {
                        getSession: jest.fn(),
                    },
                },
                {
                    provide: MovementService,
                    useValue: {
                        finalizeMovement: jest.fn(),
                        getTileType: jest.fn(),
                    },
                },
            ],
        }).compile();

        debugModeService = module.get<DebugModeService>(DebugModeService);
        sessionsService = module.get<SessionsService>(SessionsService);
        movementService = module.get<MovementService>(MovementService);

        client = {
            id: 'socket-id',
            emit: jest.fn(),
        } as any as Socket;

        server = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as any as Server;
    });

    describe('processDebugMovement', () => {
        it('should emit debugMoveFailed when session is invalid', () => {
            const sessionCode = 'invalid-session';
            const player: Player = {} as any;
            const destination = { row: 0, col: 0 };

            (sessionsService.getSession as jest.Mock).mockReturnValue(null);

            debugModeService.processDebugMovement(client, sessionCode, player, destination, server);

            expect(client.emit).toHaveBeenCalledWith('debugMoveFailed', { reason: 'Invalid session' });
        });

        it('should call finalizeMovement when tile is free', () => {
            const sessionCode = 'valid-session';
            const player: Player = {
                position: { row: 1, col: 1 },
                avatar: 'player-avatar',
            } as any;

            const destination = { row: 2, col: 2 };

            const session = {
                grid: [
                    [{ images: [] }, { images: [] }, { images: [] }],
                    [{ images: [] }, { images: [] }, { images: [] }],
                    [{ images: [] }, { images: [] }, { images: [] }],
                ],
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            debugModeService.processDebugMovement(client, sessionCode, player, destination, server);

            expect(movementService['finalizeMovement']).toHaveBeenCalled();

            const movementContextArg = (movementService['finalizeMovement'] as jest.Mock).mock.calls[0][0];
            expect(movementContextArg.client).toBe(client);
            expect(movementContextArg.player).toBe(player);
            expect(movementContextArg.session).toBe(session);
            expect(movementContextArg.movementData).toEqual({
                sessionCode,
                source: player.position,
                destination,
                movingImage: player.avatar,
            });
            expect(movementContextArg.path).toEqual({
                desiredPath: [player.position, destination],
                realPath: [player.position, destination],
            });
            expect(movementContextArg.slipOccurred).toBe(false);
            expect(movementContextArg.movementCost).toBe(0);
            expect(movementContextArg.destination).toEqual(destination);
        });

        it('should emit debugMoveFailed when tile is not free due to wall, door, or doorOpen', () => {
            const sessionCode = 'valid-session';
            const player: Player = {
                position: { row: 1, col: 1 },
                avatar: 'player-avatar',
            } as any;

            const destination = { row: 2, col: 2 };
            const wallImage = 'wall';
            const doorImage = 'door';
            const doorOpenImage = 'doorOpen';
            const objectImage = Object.values(ObjectsImages)[0]; // Get any image from ObjectsImages

            const session = {
                grid: [
                    [{ images: [] }, { images: [] }, { images: [] }],
                    [{ images: [] }, { images: [] }, { images: [] }],
                    [
                        { images: [] },
                        { images: [] },
                        { images: [] }, // We'll replace this cell's images in each test case
                    ],
                ],
            };

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            const testCases = [
                { images: [wallImage], tileType: 'wall' },
                { images: [doorImage], tileType: 'door' },
                { images: [doorOpenImage], tileType: 'doorOpen' },
                { images: [objectImage], tileType: 'object' },
            ];

            for (const testCase of testCases) {
                session.grid[2][2].images = testCase.images;

                // Mock getTileType to return the appropriate tile type
                (movementService.getTileType as jest.Mock).mockReturnValue(testCase.tileType);

                debugModeService.processDebugMovement(client, sessionCode, player, destination, server);

                expect(server.to).toHaveBeenCalledWith(client.id);
                expect(server.to(client.id).emit).toHaveBeenCalledWith('debugMoveFailed', { reason: 'Tile is not free' });

                // Reset mocks and spies for the next iteration
                jest.clearAllMocks();
            }
        });
    });
});
