// turn.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TurnService } from './turn.service';
import { MovementService } from '@app/services/movement/movement.service';
import { Session } from '@app/interfaces/session/session.interface';
import { Server } from 'socket.io';
import { Player } from '@app/interfaces/player/player.interface';
import { Attribute } from '@app/interfaces/attribute/attribute.interface';
import { EventEmitter } from 'events';

describe('TurnService', () => {
    let service: TurnService;
    let movementService: MovementService;
    let server: Server;
    let session: Session;
    let sessions: { [key: string]: Session };
    let player1: Player;
    let player2: Player;
    let player3: Player;
    let emitMock: jest.Mock;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TurnService,
                {
                    provide: MovementService,
                    useValue: {
                        calculateAccessibleTiles: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TurnService>(TurnService);
        movementService = module.get<MovementService>(MovementService);

        // Mock Server (Socket.io)
        server = new EventEmitter() as unknown as Server;
        emitMock = jest.fn();
        server.to = jest.fn().mockReturnValue({
            emit: emitMock,
        });

        // Mock Session
        session = {
            organizerId: 'organizerId',
            locked: false,
            maxPlayers: 4,
            players: [],
            selectedGameID: 'gameId',
            grid: [],
            turnOrder: [],
            currentTurnIndex: 0,
            currentPlayerSocketId: '',
            turnTimer: null,
            timeLeft: 0,
            combat: [],
            combatTurnIndex: 0,
            combatTurnTimer: null,
            combatTimeLeft: 0,
        };
        sessions = { sessionCode: session };

        // Mock Players
        const speedAttribute: Attribute = {
            currentValue: 5,
            baseValue: 5,
            dice: '',
            name: '',
            description: '',
        };

        player1 = {
            socketId: 'socket1',
            name: 'Player1',
            avatar: '',
            attributes: {
                speed: { ...speedAttribute },
            },
            isOrganizer: false,
            position: { row: 0, col: 0 },
            accessibleTiles: [],
        };

        player2 = {
            socketId: 'socket2',
            name: 'Player2',
            avatar: '',
            attributes: {
                speed: { ...speedAttribute, currentValue: 7, baseValue: 7 },
            },
            isOrganizer: false,
            position: { row: 1, col: 1 },
            accessibleTiles: [],
        };

        player3 = {
            socketId: 'socket3',
            name: 'Player3',
            avatar: '',
            attributes: {
                speed: { ...speedAttribute, currentValue: 5, baseValue: 5 },
            },
            isOrganizer: false,
            position: { row: 2, col: 2 },
            accessibleTiles: [],
        };
        movementService.calculateAccessibleTiles = jest.fn(() => {
            player1.accessibleTiles = [
                { position: player1.position, path: [] },
                { position: { row: 0, col: 1 }, path: [{ row: 0, col: 1 }] },
            ];

            player2.accessibleTiles = [
                { position: player2.position, path: [] },
                { position: { row: 1, col: 2 }, path: [{ row: 1, col: 2 }] },
            ];

            player3.accessibleTiles = [
                { position: player3.position, path: [] },
                { position: { row: 2, col: 3 }, path: [{ row: 2, col: 3 }] },
            ];
        });
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('should calculate turn order correctly', () => {
        session.players = [player1, player2, player3];

        service.calculateTurnOrder(session);

        // Since player2 has highest speed, they should go first
        expect(session.turnOrder[0]).toBe(player2.socketId);
        // player1 and player3 have same speed, they should be randomly ordered
        expect(session.turnOrder).toContain(player1.socketId);
        expect(session.turnOrder).toContain(player3.socketId);
        expect(session.currentTurnIndex).toBe(-1);
    });

    it('should start turn correctly without combat', () => {
        jest.useFakeTimers();

        session.players = [player1, player2];
        session.turnOrder = [player1.socketId, player2.socketId];
        session.currentTurnIndex = -1;
        session.combat = [];

        service.startTurn('sessionCode', server, sessions);

        expect(session.currentTurnIndex).toBe(0);
        expect(session.currentPlayerSocketId).toBe(player1.socketId);
        expect(session.timeLeft).toBe(30);
        expect(player1.attributes.speed.currentValue).toBe(player1.attributes.speed.baseValue);
        expect(movementService.calculateAccessibleTiles).toHaveBeenCalled();

        jest.advanceTimersByTime(3000);

        expect(emitMock).toHaveBeenCalledWith('nextTurnNotification', {
            playerSocketId: player1.socketId,
            inSeconds: 3,
        });

        jest.advanceTimersByTime(1000);

        expect(emitMock).toHaveBeenCalledWith('turnStarted', {
            playerSocketId: player1.socketId,
        });

        jest.useRealTimers();
    });

    it('should handle no movement possible for current player', () => {
        jest.useFakeTimers();

        session.players = [player1];
        session.turnOrder = [player1.socketId];
        session.currentTurnIndex = -1;
        session.combat = [];

        // Mock accessibleTiles to have only current position
        player1.accessibleTiles = [{ position: player1.position, path: [] }];

        movementService.calculateAccessibleTiles = jest.fn(() => {
            player1.accessibleTiles = [{ position: player1.position, path: [] }];
        });

        service.startTurn('sessionCode', server, sessions);

        jest.advanceTimersByTime(3000);

        expect(emitMock).toHaveBeenCalledWith('noMovementPossible', { playerName: player1.name });

        jest.advanceTimersByTime(3000);

        expect(emitMock).toHaveBeenCalledWith('turnEnded', {
            playerSocketId: player1.socketId,
        });

        jest.useRealTimers();
    });

    it('should not start turn if combat is ongoing', () => {
        session.players = [player1];
        session.combat = [player1];

        service.startTurn('sessionCode', server, sessions);

        expect(emitMock).toHaveBeenCalledWith('turnPaused', {
            message: 'Le tour est en pause pour le combat en cours.',
        });
    });

    it('should advance to next player on endTurn', () => {
        jest.useFakeTimers();

        session.players = [player1, player2];
        session.turnOrder = [player1.socketId, player2.socketId];
        session.currentTurnIndex = 0;
        session.currentPlayerSocketId = player1.socketId;
        session.timeLeft = 10;
        session.combat = [];

        service.endTurn('sessionCode', server, sessions);

        expect(session.turnTimer).toBeNull();
        expect(emitMock).toHaveBeenCalledWith('turnEnded', {
            playerSocketId: player1.socketId,
        });
        expect(emitMock).toHaveBeenCalledWith('playerListUpdate', { players: session.players });

        // Next turn should start automatically
        jest.advanceTimersByTime(3000);

        expect(session.currentTurnIndex).toBe(1);
        expect(session.currentPlayerSocketId).toBe(player2.socketId);
        expect(emitMock).toHaveBeenCalledWith('nextTurnNotification', {
            playerSocketId: player2.socketId,
            inSeconds: 3,
        });

        jest.useRealTimers();
    });

    it('should not start next turn if combat starts after endTurn', () => {
        session.players = [player1, player2];
        session.turnOrder = [player1.socketId, player2.socketId];
        session.currentTurnIndex = 0;
        session.currentPlayerSocketId = player1.socketId;
        session.timeLeft = 10;
        session.combat = [player1, player2];

        service.endTurn('sessionCode', server, sessions);

        expect(session.turnTimer).toBeNull();
        expect(emitMock).toHaveBeenCalledWith('turnEnded', {
            playerSocketId: player1.socketId,
        });
        expect(emitMock).toHaveBeenCalledWith('playerListUpdate', { players: session.players });

        // Should not start next turn due to combat
        expect(emitMock).not.toHaveBeenCalledWith('nextTurnNotification', expect.anything());
    });

    it('should send time left during turn', () => {
        jest.useFakeTimers();

        session.players = [player1];
        session.turnOrder = [player1.socketId];
        session.currentTurnIndex = -1;
        session.combat = [];

        service.startTurn('sessionCode', server, sessions);

        jest.advanceTimersByTime(3000);

        jest.advanceTimersByTime(1000); // Start of turn

        expect(emitMock).toHaveBeenCalledWith('turnStarted', {
            playerSocketId: player1.socketId,
        });

        expect(emitMock).toHaveBeenCalledWith('timeLeft', {
            timeLeft: 30,
            playerSocketId: player1.socketId,
        });

        jest.advanceTimersByTime(1000);

        expect(emitMock).toHaveBeenCalledWith('timeLeft', {
            timeLeft: 29,
            playerSocketId: player1.socketId,
        });

        jest.useRealTimers();
    });

    it('should end turn when time runs out', () => {
        jest.useFakeTimers();

        session.players = [player1];
        session.turnOrder = [player1.socketId];
        session.currentTurnIndex = -1;
        session.combat = [];

        service.startTurn('sessionCode', server, sessions);

        jest.advanceTimersByTime(3000); // Next turn notification delay

        jest.advanceTimersByTime(1000); // Start of turn

        expect(session.timeLeft).toBe(30);

        jest.advanceTimersByTime(30000); // Advance 30 seconds

        expect(emitMock).toHaveBeenCalledWith('turnEnded', {
            playerSocketId: player1.socketId,
        });

        jest.useRealTimers();
    });

    it('should clear turn timer', () => {
        session.turnTimer = setInterval(() => {}, 1000);

        service.clearTurnTimer(session);

        expect(session.turnTimer).toBeNull();
    });

    it('should send time left', () => {
        session.currentPlayerSocketId = player1.socketId;
        session.timeLeft = 20;

        service.sendTimeLeft('sessionCode', server, sessions);

        expect(emitMock).toHaveBeenCalledWith('timeLeft', {
            timeLeft: 20,
            playerSocketId: player1.socketId,
        });
    });

    it('should handle starting turn from a specific player', () => {
        jest.useFakeTimers();

        session.players = [player1, player2];
        session.turnOrder = [player1.socketId, player2.socketId];
        session.currentTurnIndex = -1;
        session.combat = [];

        service.startTurn('sessionCode', server, sessions, player2.socketId);

        expect(session.currentTurnIndex).toBe(1);
        expect(session.currentPlayerSocketId).toBe(player2.socketId);

        jest.useRealTimers();
    });

    it('should shuffle players with same speed in turn order', () => {
        session.players = [player1, player3];
        const results = new Set<string>();

        // Run multiple times to check randomness
        for (let i = 0; i < 10; i++) {
            service.calculateTurnOrder(session);
            results.add(session.turnOrder.join(','));
        }

        expect(results.size).toBeGreaterThan(1);
    });
    it('should start turn correctly with startingPlayerSocketId', () => {
        jest.useFakeTimers();

        session.players = [player1, player2];
        session.turnOrder = [player1.socketId, player2.socketId];
        session.currentTurnIndex = -1;
        session.combat = [];

        service.startTurn('sessionCode', server, sessions, player2.socketId);

        expect(session.currentTurnIndex).toBe(1);
        expect(session.currentPlayerSocketId).toBe(player2.socketId);
        expect(session.timeLeft).toBe(30);
        expect(player2.attributes.speed.currentValue).toBe(player2.attributes.speed.baseValue);
        expect(movementService.calculateAccessibleTiles).toHaveBeenCalledWith(session.grid, player2, player2.attributes.speed.currentValue);

        jest.advanceTimersByTime(3000);

        expect(emitMock).toHaveBeenCalledWith('nextTurnNotification', {
            playerSocketId: player2.socketId,
            inSeconds: 3,
        });

        jest.advanceTimersByTime(1000);

        expect(emitMock).toHaveBeenCalledWith('turnStarted', {
            playerSocketId: player2.socketId,
        });

        jest.useRealTimers();
    });

    it('should handle no movement possible during the turn timer', () => {
        jest.useFakeTimers();

        session.players = [player1];
        session.turnOrder = [player1.socketId];
        session.currentTurnIndex = -1;
        session.combat = [];

        // Initial accessibleTiles allow movement
        player1.accessibleTiles = [
            { position: { row: 0, col: 0 }, path: [] },
            { position: { row: 0, col: 1 }, path: [{ row: 0, col: 1 }] },
        ];

        // Mock calculateAccessibleTiles to restrict movement during the turn
        let calculateAccessibleTilesCallCount = 0;
        movementService.calculateAccessibleTiles = jest.fn(() => {
            if (calculateAccessibleTilesCallCount === 0) {
                // First call: player can move
                player1.accessibleTiles = [
                    { position: { row: 0, col: 0 }, path: [] },
                    { position: { row: 0, col: 1 }, path: [{ row: 0, col: 1 }] },
                ];
            } else {
                // Subsequent calls: player cannot move
                player1.accessibleTiles = [{ position: player1.position, path: [] }];
            }
            calculateAccessibleTilesCallCount++;
        });

        service.startTurn('sessionCode', server, sessions);

        jest.advanceTimersByTime(3000); // Next turn notification delay

        jest.advanceTimersByTime(1000); // Start of turn

        expect(emitMock).toHaveBeenCalledWith('turnStarted', {
            playerSocketId: player1.socketId,
        });

        // Simulate passage of time to trigger the interval
        jest.advanceTimersByTime(1000);

        // At this point, movement is restricted
        expect(emitMock).toHaveBeenCalledWith('noMovementPossible', { playerName: player1.name });
        expect(emitMock).toHaveBeenCalledWith('turnEnded', {
            playerSocketId: player1.socketId,
        });

        jest.useRealTimers();
    });

    it('should handle timeLeft decreasing and turn continuing', () => {
        jest.useFakeTimers();

        session.players = [player1];
        session.turnOrder = [player1.socketId];
        session.currentTurnIndex = -1;
        session.combat = [];

        player1.accessibleTiles = [
            { position: { row: 0, col: 0 }, path: [] },
            { position: { row: 0, col: 1 }, path: [{ row: 0, col: 1 }] },
        ];

        movementService.calculateAccessibleTiles = jest.fn();

        service.startTurn('sessionCode', server, sessions);

        jest.advanceTimersByTime(3000); // Next turn notification delay

        jest.advanceTimersByTime(1000); // Start of turn

        expect(emitMock).toHaveBeenCalledWith('turnStarted', {
            playerSocketId: player1.socketId,
        });

        // Simulate passage of time without movement restriction
        for (let i = 29; i > 0; i--) {
            jest.advanceTimersByTime(1000);
            expect(session.timeLeft).toBe(i);
            expect(emitMock).toHaveBeenCalledWith('timeLeft', {
                timeLeft: i,
                playerSocketId: player1.socketId,
            });
        }

        jest.useRealTimers();
    });

    it('should handle timeLeft reaching zero and turn ending', () => {
        jest.useFakeTimers();

        session.players = [player1];
        session.turnOrder = [player1.socketId];
        session.currentTurnIndex = -1;
        session.combat = [];

        player1.accessibleTiles = [
            { position: { row: 0, col: 0 }, path: [] },
            { position: { row: 0, col: 1 }, path: [{ row: 0, col: 1 }] },
        ];

        movementService.calculateAccessibleTiles = jest.fn();

        service.startTurn('sessionCode', server, sessions);

        jest.advanceTimersByTime(3000); // Next turn notification delay

        jest.advanceTimersByTime(1000); // Start of turn

        expect(emitMock).toHaveBeenCalledWith('turnStarted', {
            playerSocketId: player1.socketId,
        });

        // Simulate passage of time until timeLeft reaches 0
        jest.advanceTimersByTime(30000); // 30 seconds

        expect(session.timeLeft).toBe(0);
        expect(emitMock).toHaveBeenCalledWith('turnEnded', {
            playerSocketId: player1.socketId,
        });

        jest.useRealTimers();
    });

    // Additional edge case tests

    it('should not start turn if session is not found', () => {
        sessions = {}; // Empty sessions object

        service.startTurn('invalidSessionCode', server, sessions);

        expect(emitMock).not.toHaveBeenCalled();
    });

    it('should not end turn if session is not found', () => {
        sessions = {}; // Empty sessions object

        service.endTurn('invalidSessionCode', server, sessions);

        expect(emitMock).not.toHaveBeenCalled();
    });

    it('should handle case when player is not found in getCurrentPlayer', () => {
        session.players = [];
        session.currentPlayerSocketId = 'nonexistentSocketId';

        const currentPlayer = (service as any).getCurrentPlayer(session);

        expect(currentPlayer).toBeUndefined();
    });

    it('should handle empty turnOrder in advanceTurnIndex', () => {
        session.turnOrder = [];

        (service as any).advanceTurnIndex(session);

        expect(session.currentTurnIndex).toBe(NaN); // Because division by zero in modulo operation
    });

    it('should handle empty players list in calculateTurnOrder', () => {
        session.players = [];

        service.calculateTurnOrder(session);

        expect(session.turnOrder).toEqual([]);
        expect(session.currentTurnIndex).toBe(-1);
    });

    it('should handle movementService.calculateAccessibleTiles throwing an error', () => {
        jest.useFakeTimers();

        session.players = [player1];
        session.turnOrder = [player1.socketId];
        session.currentTurnIndex = -1;
        session.combat = [];

        movementService.calculateAccessibleTiles = jest.fn(() => {
            throw new Error('Calculation error');
        });

        service.startTurn('sessionCode', server, sessions);

        jest.advanceTimersByTime(3000); // Next turn notification delay

        // The error should be caught internally, and the test should not crash

        jest.useRealTimers();
    });
});
