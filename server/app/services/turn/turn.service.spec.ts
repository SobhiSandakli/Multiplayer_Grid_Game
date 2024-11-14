/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { TurnService } from './turn.service';
import { MovementService } from '@app/services/movement/movement.service';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { ActionService } from '@app/services/action/action.service';
import { Server, Socket } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import { TURN_DURATION, NEXT_TURN_NOTIFICATION_DELAY, THOUSAND } from '@app/constants/turn-constants';

jest.useFakeTimers();

describe('TurnService', () => {
    let turnService: TurnService;
    let mockMovementService: Partial<MovementService>;
    let mockEventsService: Partial<EventsGateway>;
    let mockActionService: Partial<ActionService>;
    let mockServer: Partial<Server>;

    beforeEach(() => {
        mockMovementService = {
            calculateAccessibleTiles: jest.fn(),
        };

        mockEventsService = {
            addEventToSession: jest.fn(),
        };

        mockActionService = {
            checkAvailableActions: jest.fn().mockReturnValue(true),
        };

        turnService = new TurnService(mockMovementService as MovementService, mockEventsService as EventsGateway, mockActionService as ActionService);

        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };
    });

    const createMockSession = (): Session => ({
        organizerId: 'organizer1',
        locked: false,
        maxPlayers: 4,
        players: [
            {
                socketId: 'player1',
                name: 'Player 1',
                avatar: 'avatar1',
                attributes: {
                    speed: { name: 'speed', description: 'Speed attribute', baseValue: 5, currentValue: 5 },
                },
                isOrganizer: true,
                position: { row: 0, col: 0 },
                accessibleTiles: [],
            },
            {
                socketId: 'player2',
                name: 'Player 2',
                avatar: 'avatar2',
                attributes: {
                    speed: { name: 'speed', description: 'Speed attribute', baseValue: 5, currentValue: 5 },
                },
                isOrganizer: false,
                position: { row: 1, col: 1 },
                accessibleTiles: [],
            },
        ],
        selectedGameID: 'game1',
        grid: [],
        turnData: {
            turnOrder: ['player1', 'player2'],
            currentTurnIndex: 0,
            currentPlayerSocketId: 'player1',
            turnTimer: null,
            timeLeft: 30,
        },
        combatData: {
            combatants: [],
            turnIndex: 0,
            turnTimer: null,
            timeLeft: 0,
        },
    });

    it('should start a turn and emit all expected events in order', () => {
        const mockSession = createMockSession();

        turnService.startTurn('sessionCode', mockServer as Server, { sessionCode: mockSession });

        expect(mockServer.to).toHaveBeenNthCalledWith(1, 'sessionCode');
        expect(mockServer.emit).toHaveBeenNthCalledWith(1, 'nextTurnNotification', {
            playerSocketId: 'player1',
            inSeconds: NEXT_TURN_NOTIFICATION_DELAY,
        });

        expect(mockServer.to).toHaveBeenNthCalledWith(2, 'player1');
        expect(mockServer.emit).toHaveBeenNthCalledWith(2, 'accessibleTiles', {
            accessibleTiles: mockSession.players[0].accessibleTiles,
        });

        expect(mockServer.to).toHaveBeenNthCalledWith(3, 'player2');
        expect(mockServer.emit).toHaveBeenNthCalledWith(3, 'accessibleTiles', {
            accessibleTiles: [],
        });
    });

    it('should end a turn and start a new one if no combatants are present', () => {
        const mockSession = createMockSession();
        mockSession.combatData.combatants = [];
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(turnService, 'startTurn').mockImplementation(() => {});
        turnService.endTurn('sessionCode', mockServer as Server, { sessionCode: mockSession });

        expect(turnService.startTurn).toHaveBeenCalledWith('sessionCode', mockServer, { sessionCode: mockSession });
        expect(mockServer.emit).toHaveBeenCalledWith('turnEnded', {
            playerSocketId: mockSession.turnData.currentPlayerSocketId,
        });
    });

    it('should emit time left during a turn', () => {
        const mockSession = createMockSession();
        mockSession.turnData.timeLeft = 10;

        turnService.sendTimeLeft('sessionCode', mockServer as Server, { sessionCode: mockSession });

        expect(mockServer.to).toHaveBeenCalledWith('sessionCode');
        expect(mockServer.emit).toHaveBeenCalledWith('timeLeft', {
            timeLeft: mockSession.turnData.timeLeft,
            playerSocketId: mockSession.turnData.currentPlayerSocketId,
        });
    });

    it('should shuffle players with equal speed when calculating turn order', () => {
        const mockSession = createMockSession();
        mockSession.players[0].attributes.speed.currentValue = 5;
        mockSession.players[1].attributes.speed.currentValue = 5;

        jest.spyOn(Math, 'random').mockReturnValueOnce(0.8).mockReturnValueOnce(0.1);
        turnService.calculateTurnOrder(mockSession);

        expect(mockSession.turnData.turnOrder).toEqual(['player1', 'player2']);
    });

    it('should pause turn if combat is active', () => {
        const mockSession = createMockSession();
        mockSession.combatData.combatants.push(mockSession.players[0]);

        turnService.startTurn('sessionCode', mockServer as Server, { sessionCode: mockSession });

        expect(mockServer.to).toHaveBeenCalledWith('sessionCode');
        expect(mockServer.emit).toHaveBeenCalledWith('turnPaused', { message: 'Le tour est en pause pour le combat en cours.' });
    });

    it('should check if it is the current player’s turn', () => {
        const mockSession = createMockSession();
        mockSession.turnData.currentPlayerSocketId = 'player1';

        const mockClient = { id: 'player1' } as Socket;
        const result = turnService.isCurrentPlayerTurn(mockSession, mockClient);

        expect(result).toBe(true);
    });

    it('should handle no movement by ending the turn after a delay', () => {
        const mockSession = createMockSession();
        mockSession.turnData.currentTurnIndex = 0;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(turnService, 'endTurn').mockImplementation(() => {});
        turnService.startTurn('sessionCode', mockServer as Server, { sessionCode: mockSession });

        expect(mockServer.to).toHaveBeenNthCalledWith(1, 'sessionCode');
        expect(mockServer.emit).toHaveBeenNthCalledWith(1, 'noMovementPossible', { playerName: mockSession.players[0].name });
    });

    it('should start the turn timer and decrement time', () => {
        const mockSession = createMockSession();
        mockSession.turnData.timeLeft = TURN_DURATION;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(turnService, 'endTurn').mockImplementation(() => {});

        turnService.startTurn('sessionCode', mockServer as Server, { sessionCode: mockSession });
        jest.advanceTimersByTime(TURN_DURATION * THOUSAND);

        expect(mockServer.emit).toHaveBeenCalledWith('timeLeft', {
            timeLeft: 0,
            playerSocketId: mockSession.turnData.currentPlayerSocketId,
        });
        expect(turnService.endTurn).toHaveBeenCalled();
    });
});
