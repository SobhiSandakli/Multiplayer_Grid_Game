/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-lines */
import { Test, TestingModule } from '@nestjs/testing';
import { MovementService } from './movement.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { Player } from '@app/interfaces/player/player.interface';
import { Server, Socket } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import { EVASION_DELAY } from '@app/constants/session-gateway-constants';
import { MovementContext } from '@app/interfaces/player/movement.interface';

const mockPlayer: Player = {
    socketId: 'socket1',
    name: 'Player One',
    avatar: 'avatar1.png',
    attributes: {
        life: { name: 'Life', description: 'Player life points', currentValue: 3, baseValue: 3 },
        combatWon: { name: 'Combat Won', description: 'Number of combats won', currentValue: 0, baseValue: 0 },
        speed: { name: 'Speed', description: 'Player speed', currentValue: 5, baseValue: 5 },
        attack: { name: 'Attack', description: 'Player attack', currentValue: 5, baseValue: 5 },
        defence: { name: 'Defence', description: 'Player defence', currentValue: 5, baseValue: 5 },
    },
    position: { row: 0, col: 0 },
    initialPosition: { row: 0, col: 0 },
    isOrganizer: false,
    accessibleTiles: [],
    inventory: [],
    statistics: {
        combats: 0,
        evasions: 0,
        victories: 0,
        defeats: 0,
        totalLifeLost: 0,
        totalLifeRemoved: 0,
        uniqueItems: new Set<string>(),
        tilesVisited: new Set<string>(),
    },
};

const mockSession: Session = {
    players: [mockPlayer],
    grid: [[{ images: ['assets/tiles/Grass.png'], isOccuped: false }], [{ images: ['assets/tiles/Grass.png'], isOccuped: false }]],
    combatData: {
        combatants: [],
        turnIndex: 0,
        turnTimer: null,
        timeLeft: 0,
    },
    organizerId: '',
    locked: false,
    maxPlayers: 0,
    selectedGameID: '',
    turnData: undefined,
    ctf: false,
    statistics: {
        gameDuration: '00:00',
        totalTurns: 0,
        totalTerrainTiles: 0,
        visitedTerrains: new Set<string>(),
        totalDoors: 0,
        manipulatedDoors: new Set<string>(),
        uniqueFlagHolders: new Set<string>(),
    },
};

describe('MovementService', () => {
    let service: MovementService;
    let changeGridService: ChangeGridService;
    let sessionsService: SessionsService;
    let mockServer: Server;
    let mockClient: Socket;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MovementService,
                {
                    provide: ChangeGridService,
                    useValue: {
                        moveImage: jest.fn(),
                    },
                },
                {
                    provide: SessionsService,
                    useValue: {
                        endTurn: jest.fn(),
                        getSession: jest.fn().mockImplementation((sessionCode: string) => {
                            if (sessionCode === 'session123') {
                                return mockSession; // Renvoie un mock de session valide
                            }
                            return undefined; // Simule une session non trouvée
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<MovementService>(MovementService);
        changeGridService = module.get<ChangeGridService>(ChangeGridService);
        sessionsService = module.get<SessionsService>(SessionsService);

        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as unknown as Server;

        mockClient = {
            emit: jest.fn(),
        } as unknown as Socket;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getMovementCost', () => {
        it('should return the correct movement cost for a tile', () => {
            const tile = { images: ['assets/tiles/Grass.png'] };
            const cost = service.getMovementCost(tile);
            expect(cost).toBe(1);
        });
    });

    describe('getTileEffect', () => {
        it('should return the correct tile effect', () => {
            const tile = { images: ['assets/tiles/Ice.png'] };
            const effect = service.getTileEffect(tile);
            expect(effect).toBe('Glissant');
        });
    });

    describe('calculateAccessibleTiles', () => {
        it('should calculate accessible tiles for a player', () => {
            service.calculateAccessibleTiles(mockSession.grid, mockPlayer, 5);
            expect(mockPlayer.accessibleTiles.length).toBeGreaterThan(0);
        });
    });

    describe('calculateMovementCost', () => {
        it('should calculate the movement cost between two positions', () => {
            service.calculateAccessibleTiles(mockSession.grid, mockPlayer, 5);
            const cost = service.calculateMovementCost({ row: 0, col: 0 }, { row: 1, col: 0 }, mockPlayer, mockSession.grid);
            expect(cost).toBe(1);
        });
    });

    describe('calculatePathWithSlips', () => {
        it('should calculate the real path with slips', () => {
            const desiredPath = [
                { row: 0, col: 0 },
                { row: 1, col: 0 },
            ];
            const result = service.calculatePathWithSlips(desiredPath, mockSession.grid);
            expect(result.realPath.length).toBeGreaterThan(0);
        });
    });

    describe('getPathToDestination', () => {
        it('should return the path to the destination', () => {
            service.calculateAccessibleTiles(mockSession.grid, mockPlayer, 5);
            const path = service.getPathToDestination(mockPlayer, { row: 1, col: 0 });
            expect(path).not.toBeNull();
        });
    });

    describe('processPlayerMovement', () => {
        it('should process player movement', () => {
            service.calculateAccessibleTiles(mockSession.grid, mockPlayer, 5);
            service.processPlayerMovement(
                mockClient,
                mockPlayer,
                mockSession,
                {
                    sessionCode: 'session123',
                    source: { row: 0, col: 0 },
                    destination: { row: 1, col: 0 },
                    movingImage: 'avatar1.png',
                },
                mockServer,
            );
        });
    });

    describe('isDestinationAccessible', () => {
        it('should check if the destination is accessible', () => {
            service.calculateAccessibleTiles(mockSession.grid, mockPlayer, 5);
            const accessible = service.isDestinationAccessible(mockPlayer, { row: 1, col: 0 });
            expect(accessible).toBe(true);
        });
    });

    describe('updatePlayerAttributesOnTile', () => {
        it('should update player attributes based on the tile', () => {
            const tile = { images: ['assets/tiles/Ice.png'], isOccuped: false };
            service.updatePlayerAttributesOnTile(mockPlayer, tile);
            expect(mockPlayer.attributes['attack'].currentValue).toBe(3);
            expect(mockPlayer.attributes['defence'].currentValue).toBe(3);
        });
    });

    describe('Private Methods', () => {
        describe('processTile', () => {
            it('should process a tile correctly', () => {
                const context = service['initializeTileContext'](mockSession.grid, mockPlayer);
                service['processTile']({ row: 0, col: 0 }, 0, 5, context, mockSession.grid);
                expect(context.accessibleTiles.length).toBeGreaterThan(0);
            });
        });

        describe('processNeighbor', () => {
            it('should process a neighbor tile correctly', () => {
                const context = service['initializeTileContext'](mockSession.grid, mockPlayer);
                service['processNeighbor']({ row: 0, col: 0 }, { row: 1, col: 0 }, 0, context, mockSession.grid);
                expect(context.queue.length).toBeGreaterThan(0);
            });
        });

        describe('finalizeMovement', () => {
            it('should finalize player movement', () => {
                const movementContext: MovementContext = {
                    client: mockClient,
                    player: mockPlayer,
                    session: mockSession,
                    movementData: {
                        sessionCode: 'session123',
                        source: { row: 0, col: 0 },
                        destination: { row: 1, col: 0 },
                        movingImage: 'avatar1.png',
                    },
                    path: {
                        realPath: [
                            { row: 0, col: 0 },
                            { row: 1, col: 0 },
                        ],
                        desiredPath: [
                            { row: 0, col: 0 },
                            { row: 1, col: 0 },
                        ],
                    },
                    slipOccurred: false,
                    movementCost: 1,
                    destination: { row: 1, col: 0 },
                };
                service['finalizeMovement'](movementContext, mockServer);
            });
        });

        describe('updatePlayerPosition', () => {
            it('should update player position correctly', () => {
                const movementContext: MovementContext = {
                    client: mockClient,
                    player: mockPlayer,
                    session: mockSession,
                    movementData: {
                        sessionCode: 'session123',
                        source: { row: 0, col: 0 },
                        destination: { row: 1, col: 0 },
                        movingImage: 'avatar1.png',
                    },
                    path: {
                        realPath: [
                            { row: 0, col: 0 },
                            { row: 1, col: 0 },
                        ],
                        desiredPath: [
                            { row: 0, col: 0 },
                            { row: 1, col: 0 },
                        ],
                    },
                    slipOccurred: false,
                    movementCost: 1,
                    destination: { row: 1, col: 0 },
                };
                (changeGridService.moveImage as jest.Mock).mockReturnValue(true);
                const moved = service['updatePlayerPosition'](movementContext);
                expect(moved).toBe(true);
                expect(mockPlayer.position).toEqual({ row: 1, col: 0 });
                expect(mockPlayer.attributes['speed'].currentValue).toBe(4);
            });
        });

        describe('handleSlip', () => {
            it('should handle slip correctly', () => {
                jest.useFakeTimers();
                service['handleSlip']('session123', true, mockServer);
                jest.advanceTimersByTime(EVASION_DELAY);
                expect(sessionsService.endTurn).toHaveBeenCalledWith('session123', mockServer);
                jest.useRealTimers();
            });
        });

        describe('emitMovementUpdatesToClient', () => {
            it('should emit movement updates to client', () => {
                service['emitMovementUpdatesToClient'](mockClient, mockPlayer);
                expect(mockClient.emit).toHaveBeenCalledWith('accessibleTiles', { accessibleTiles: mockPlayer.accessibleTiles });
            });
        });

        describe('emitMovementUpdatesToOthers', () => {
            it('should emit movement updates to others', () => {
                // Appeler la méthode avec les données mockées
                service['emitMovementUpdatesToOthers'](
                    'session123',
                    mockPlayer,
                    {
                        realPath: [
                            { row: 0, col: 0 },
                            { row: 1, col: 0 },
                        ],
                        desiredPath: [
                            { row: 0, col: 0 },
                            { row: 1, col: 0 },
                        ],
                    },
                    mockServer,
                    false,
                );

                // Vérifiez que la méthode utilise bien le mock
                expect(sessionsService.getSession).toHaveBeenCalledWith('session123');

                // Vérifiez que les bonnes données sont transmises au serveur
                expect(mockServer.to).toHaveBeenCalledWith('session123');
                expect(mockServer.emit).toHaveBeenCalledWith('playerMovement', {
                    avatar: mockPlayer.avatar,
                    desiredPath: [
                        { row: 0, col: 0 },
                        { row: 1, col: 0 },
                    ],
                    realPath: [
                        { row: 0, col: 0 },
                        { row: 1, col: 0 },
                    ],
                    slipOccurred: false,
                });
                expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
            });
        });
    });
    describe('getMovementCost', () => {
        it('should return default cost of 1 for unknown tile types', () => {
            const tile = { images: ['assets/tiles/UnknownTile.png'] };
            const cost = service.getMovementCost(tile);
            expect(cost).toBe(1);
        });
    });
    describe('getTileType', () => {
        it('should return "base" when no known tile types are matched', () => {
            const images = ['assets/tiles/UnknownTile.png'];
            const tileType = service.getTileType(images);
            expect(tileType).toBe('base');
        });
    });
    describe('calculateMovementCost', () => {
        it('should throw an error if path to destination is not found in accessible tiles', () => {
            mockPlayer.accessibleTiles = [];

            expect(() => {
                service.calculateMovementCost(
                    { row: 0, col: 0 },
                    { row: 99, col: 99 }, // An unreachable destination
                    mockPlayer,
                    mockSession.grid,
                );
            }).toThrowError('Path to destination not found in accessible tiles.');
        });
    });
    describe('calculatePathWithSlips', () => {
        it('should adjust the real path when a slip occurs on ice', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0); // Force slip to occur

            const desiredPath = [
                { row: 0, col: 0 },
                { row: 1, col: 0 },
            ];
            const grid = [[{ images: ['assets/tiles/Ice.png'], isOccuped: false }], [{ images: ['assets/tiles/Grass.png'], isOccuped: false }]];

            const result = service.calculatePathWithSlips(desiredPath, grid);

            expect(result.realPath).toEqual([{ row: 0, col: 0 }]); // Slipped on the starting tile
            expect(result.slipOccurred).toBe(true);

            jest.spyOn(Math, 'random').mockRestore();
        });
    });
    describe('updatePlayerPosition', () => {
        it('should recalculate accessible tiles after moving the player', () => {
            const movementContext: MovementContext = {
                client: mockClient,
                player: mockPlayer,
                session: mockSession,
                movementData: {
                    sessionCode: 'session123',
                    source: { row: 0, col: 0 },
                    destination: { row: 1, col: 0 },
                    movingImage: 'avatar1.png',
                },
                path: {
                    realPath: [
                        { row: 0, col: 0 },
                        { row: 1, col: 0 },
                    ],
                    desiredPath: [
                        { row: 0, col: 0 },
                        { row: 1, col: 0 },
                    ],
                },
                slipOccurred: false,
                movementCost: 1,
                destination: { row: 1, col: 0 },
            };

            jest.spyOn(service, 'calculateAccessibleTiles');
            (changeGridService.moveImage as jest.Mock).mockReturnValue(true);

            const moved = service['updatePlayerPosition'](movementContext);

            expect(moved).toBe(true);
            expect(service.calculateAccessibleTiles).toHaveBeenCalledWith(mockSession.grid, mockPlayer, mockPlayer.attributes['speed'].currentValue);
        });
    });
});
