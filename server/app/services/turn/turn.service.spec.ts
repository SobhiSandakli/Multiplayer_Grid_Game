import { Test, TestingModule } from '@nestjs/testing';
import { TurnService } from './turn.service';
import { MovementService } from '@app/services/movement/movement.service';
import { ActionService } from '@app/services/action/action.service';
import { EventsGateway } from '@app/services/events/events.service';
import { Session } from '@app/interfaces/session/session.interface';
import { Server } from 'socket.io';
import { Player } from '@app/interfaces/player/player.interface';
import { Attribute } from '@app/interfaces/attribute/attribute.interface';
import { EventEmitter } from 'events';

describe('TurnService', () => {
    let service: TurnService;
    let movementService: MovementService;
    let actionService: ActionService;
    let eventsService: EventsGateway;
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
                {
                    provide: ActionService,
                    useValue: {
                        checkAvailableActions: jest.fn(),
                    },
                },
                {
                    provide: EventsGateway,
                    useValue: {
                        addEventToSession: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TurnService>(TurnService);
        movementService = module.get<MovementService>(MovementService);
        actionService = module.get<ActionService>(ActionService);
        eventsService = module.get<EventsGateway>(EventsGateway);

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

        expect(session.turnOrder[0]).toBe(player2.socketId);
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

        actionService.checkAvailableActions = jest.fn().mockReturnValue(true);

        service.startTurn('sessionCode', server, sessions);

        expect(session.currentTurnIndex).toBe(0);
        expect(session.currentPlayerSocketId).toBe(player1.socketId);
        expect(session.timeLeft).toBe(30);
        expect(player1.attributes.speed.currentValue).toBe(player1.attributes.speed.baseValue);
        expect(movementService.calculateAccessibleTiles).toHaveBeenCalled();
        expect(eventsService.addEventToSession).toHaveBeenCalledWith(
            'sessionCode',
            'Le tour de Player1 commence.',
            ['everyone']
        );

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

        actionService.checkAvailableActions = jest.fn().mockReturnValue(false);
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

        jest.advanceTimersByTime(3000);

        expect(session.currentTurnIndex).toBe(1);
        expect(session.currentPlayerSocketId).toBe(player2.socketId);
        expect(emitMock).toHaveBeenCalledWith('nextTurnNotification', {
            playerSocketId: player2.socketId,
            inSeconds: 3,
        });

        jest.useRealTimers();
    });

    it('should handle turn ending', () => {
        jest.useFakeTimers();
    
        session.players = [player1];
        session.turnOrder = [player1.socketId];
        session.currentTurnIndex = -1;
        session.combat = [];
    
        player1.accessibleTiles = [
            { position: { row: 0, col: 0 }, path: [] },
            { position: { row: 0, col: 1 }, path: [{ row: 0, col: 1 }] },
        ];
    
        service.startTurn('sessionCode', server, sessions);
    
        jest.advanceTimersByTime(3000); // Next turn notification delay
        expect(session.timeLeft).toBe(30); // Vérifiez l'initialisation correcte de timeLeft
    
        // Simulez manuellement la fin du timer sans rappeler `startTurn`
        jest.advanceTimersByTime(31000); // Avance de 31s pour atteindre zéro
    
        // Désactivez la boucle de rappel en contrôlant la logique dans `endTurn`
        service.clearTurnTimer(session); // Assurez-vous que le timer est bien arrêté

        // Vérifiez que l'événement 'turnEnded' est bien émis
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
    it('should emit "noMovementPossible" and end turn if current player has no movement and no actions available', () => {
        jest.useFakeTimers();

        session.players = [player1];
        session.turnOrder = [player1.socketId];
        session.currentTurnIndex = 0;
        session.grid = [
            [{ images: [], isOccuped: false }],
        ];
        player1.accessibleTiles = [{ position: player1.position, path: [] }];
        movementService.calculateAccessibleTiles = jest.fn(() => {
            player1.accessibleTiles = [{ position: player1.position, path: [] }];
        });

        actionService.checkAvailableActions = jest.fn().mockReturnValue(false);

        service.startTurn('sessionCode', server, sessions);

        jest.advanceTimersByTime(3000);

        expect(emitMock).toHaveBeenCalledWith('noMovementPossible', { playerName: player1.name });

        expect(emitMock).toHaveBeenCalledWith('turnEnded', {
            playerSocketId: player1.socketId,
        });

        jest.useRealTimers();
    });
    
    
});
