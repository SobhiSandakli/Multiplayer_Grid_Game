/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { TurnService } from './turn.service';
import { MovementService } from '@app/services/movement/movement.service';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { ActionService } from '@app/services/action/action.service';
import { VirtualPlayerService } from '@app/services/virtual-player/virtual-player.service';
import { Server, Socket } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { FIVE_THOUSAND, THOUSAND, THREE_THOUSAND, TURN_DURATION } from '@app/constants/turn-constants';
import { AccessibleTile } from '@app/interfaces/player/accessible-tile.interface';

jest.useFakeTimers();

describe('TurnService', () => {
    let service: TurnService;
    let movementService: MovementService;
    let eventsService: EventsGateway;
    let actionService: ActionService;
    let virtualPlayerService: VirtualPlayerService;
    let server: Server;
    let sessions: { [key: string]: Session };
    let sessionCode: string;
    let currentPlayer: Player;
    let mockSession: Session;

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
                    provide: EventsGateway,
                    useValue: {
                        addEventToSession: jest.fn(),
                    },
                },
                {
                    provide: ActionService,
                    useValue: {
                        checkAvailableActions: jest.fn(),
                    },
                },
                {
                    provide: VirtualPlayerService,
                    useValue: {
                        handleVirtualPlayerTurn: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TurnService>(TurnService);
        movementService = module.get<MovementService>(MovementService);
        eventsService = module.get<EventsGateway>(EventsGateway);
        actionService = module.get<ActionService>(ActionService);
        virtualPlayerService = module.get<VirtualPlayerService>(VirtualPlayerService);

        server = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as unknown as Server;

        sessionCode = 'testSession';
        currentPlayer = {
            socketId: 'player1',
            name: 'Player One',
            isVirtual: false,
            attributes: {
                speed: {
                    baseValue: 5,
                    currentValue: 5,
                },
            },
            accessibleTiles: [],
        } as unknown as Player;

        mockSession = {
            statistics: {
                totalTurns: 0,
            },
            turnData: {
                timeLeft: TURN_DURATION,
                turnTimer: null,
                paused: false,
                currentTurnIndex: -1,
                turnOrder: [currentPlayer.socketId],
                currentPlayerSocketId: '',
            },
            combatData: {
                combatants: [],
            },
            players: [currentPlayer],
            grid: [],
        } as unknown as Session;

        sessions = {
            [sessionCode]: mockSession,
        };
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('startTurn', () => {
        it('should not proceed if session does not exist', () => {
            const invalidSessionCode = 'invalidSession';
            service.startTurn(invalidSessionCode, server, sessions);
            expect(server.to).not.toHaveBeenCalled();
        });

        it('should return early if currentPlayer does not exist', () => {
            // Arrange
            sessions[sessionCode].players = []; // Remove all players to simulate missing currentPlayer
            jest.spyOn(service as any, 'getCurrentPlayer').mockReturnValue(undefined);
            const resetPlayerSpeedSpy = jest.spyOn(service as any, 'resetPlayerSpeed');
            const calculateAccessibleTilesSpy = jest.spyOn(service as any, 'calculateAccessibleTiles');
            const notifyOthersOfRestrictedTilesSpy = jest.spyOn(service as any, 'notifyOthersOfRestrictedTiles');
            const notifyAllPlayersOfNextTurnSpy = jest.spyOn(service as any, 'notifyAllPlayersOfNextTurn');
            const eventsServiceSpy = jest.spyOn(eventsService, 'addEventToSession');
            const initiateVirtualPlayerTurnSpy = jest.spyOn(service as any, 'initiateVirtualPlayerTurn');
            const initiateRealPlayerTurnSpy = jest.spyOn(service as any, 'initiateRealPlayerTurn');

            // Act
            service.startTurn(sessionCode, server, sessions);
            jest.advanceTimersByTime(THREE_THOUSAND);

            // Assert
            expect(resetPlayerSpeedSpy).not.toHaveBeenCalled();
            expect(calculateAccessibleTilesSpy).not.toHaveBeenCalled();
            expect(notifyOthersOfRestrictedTilesSpy).not.toHaveBeenCalled();
            expect(notifyAllPlayersOfNextTurnSpy).not.toHaveBeenCalled();
            expect(eventsServiceSpy).not.toHaveBeenCalled();
            expect(initiateVirtualPlayerTurnSpy).not.toHaveBeenCalled();
            expect(initiateRealPlayerTurnSpy).not.toHaveBeenCalled();
        });

        it('should increment totalTurns and set turn data', () => {
            service.startTurn(sessionCode, server, sessions);
            expect(sessions[sessionCode].statistics.totalTurns).toBe(1);
            expect(sessions[sessionCode].turnData.timeLeft).toBe(TURN_DURATION);
        });

        it('should handle combat active scenario', () => {
            sessions[sessionCode].combatData.combatants.push(currentPlayer);
            service.startTurn(sessionCode, server, sessions);
            expect(server.to).toHaveBeenCalledWith(sessionCode);
            expect(server.emit).toHaveBeenCalledWith('turnPaused', {
                message: 'Le tour est en pause pour le combat en cours.',
            });
        });

        it('should set current player and initialize turn', () => {
            service.startTurn(sessionCode, server, sessions);
            jest.advanceTimersByTime(THREE_THOUSAND);
            expect(sessions[sessionCode].turnData.currentPlayerSocketId).toBe(currentPlayer.socketId);
            expect(movementService.calculateAccessibleTiles).toHaveBeenCalled();
            expect(server.emit).toHaveBeenCalledWith('nextTurnNotification', {
                playerSocketId: currentPlayer.socketId,
                inSeconds: expect.any(Number),
            });
        });

        it('should initiate virtual player turn if current player is virtual', () => {
            currentPlayer.isVirtual = true;
            service.startTurn(sessionCode, server, sessions);
            jest.advanceTimersByTime(THREE_THOUSAND);
            expect(eventsService.addEventToSession).toHaveBeenCalledWith(sessionCode, `Le tour de ${currentPlayer.name} commence.`, ['everyone']);
            expect(server.emit).toHaveBeenCalledWith('turnStarted', {
                playerSocketId: currentPlayer.socketId,
            });
        });
    });

    describe('endTurn', () => {
        it('should not proceed if session does not exist', () => {
            const invalidSessionCode = 'invalidSession';
            service.endTurn(invalidSessionCode, server, sessions);
            expect(server.to).not.toHaveBeenCalled();
        });

        it('should clear turn timer and reset player speed', () => {
            sessions[sessionCode].turnData.turnTimer = setInterval(() => {}, 1000);
            service.endTurn(sessionCode, server, sessions);
            expect(sessions[sessionCode].turnData.turnTimer).toBeNull();
            expect(currentPlayer.attributes.speed.currentValue).toBe(currentPlayer.attributes.speed.baseValue);
        });

        it('should emit turnEnded and playerListUpdate events', () => {
            sessions[sessionCode].turnData.currentPlayerSocketId = currentPlayer.socketId;
            service.endTurn(sessionCode, server, sessions);
            expect(server.emit).toHaveBeenCalledWith('turnEnded', {
                playerSocketId: currentPlayer.socketId,
            });
            expect(server.emit).toHaveBeenCalledWith('playerListUpdate', {
                players: sessions[sessionCode].players,
            });
        });

        it('should start next turn if no combatants are present', () => {
            const startTurnSpy = jest.spyOn(service, 'startTurn');
            service.endTurn(sessionCode, server, sessions);
            expect(startTurnSpy).toHaveBeenCalledWith(sessionCode, server, sessions);
        });
    });

    describe('isCurrentPlayerTurn', () => {
        it("should return true if it is the current player's turn", () => {
            sessions[sessionCode].turnData.currentPlayerSocketId = currentPlayer.socketId;
            const mockSocket = { id: currentPlayer.socketId } as Socket;
            const result = service.isCurrentPlayerTurn(sessions[sessionCode], mockSocket);
            expect(result).toBe(true);
        });

        it("should return false if it is not the current player's turn", () => {
            sessions[sessionCode].turnData.currentPlayerSocketId = 'otherPlayer';
            const mockSocket = { id: currentPlayer.socketId } as Socket;
            const result = service.isCurrentPlayerTurn(sessions[sessionCode], mockSocket);
            expect(result).toBe(false);
        });
    });

    describe('calculateTurnOrder', () => {
        it('should calculate and set turn order based on player speed', () => {
            const player2 = {
                socketId: 'player2',
                name: 'Player Two',
                isVirtual: false,
                attributes: {
                    speed: {
                        baseValue: 7,
                        currentValue: 7,
                    },
                },
                accessibleTiles: [],
            } as unknown as Player;
            sessions[sessionCode].players.push(player2);
            service.calculateTurnOrder(sessions[sessionCode], sessionCode, server);
            expect(sessions[sessionCode].turnData.turnOrder).toEqual([player2.socketId, currentPlayer.socketId]);
            expect(server.emit).toHaveBeenCalledWith('playerListUpdate', {
                players: sessions[sessionCode].players,
            });
        });
    });

    describe('timer functionalities', () => {
        beforeEach(() => {
            sessions[sessionCode].turnData.currentPlayerSocketId = currentPlayer.socketId;
        });
        it('should not processed if session does not exist', () => {
            const invalidSessionCode = 'invalidSession';
            service['startTurnTimer'](invalidSessionCode, server, sessions, currentPlayer);
            expect(server.to).not.toHaveBeenCalled();
        });

        it('should start and decrement timeLeft during real player turn', () => {
            actionService.checkAvailableActions = jest.fn().mockReturnValue(true);
            movementService.calculateAccessibleTiles = jest.fn();
            service['startTurnTimer'](sessionCode, server, sessions, currentPlayer);
            jest.advanceTimersByTime(THOUSAND * (TURN_DURATION - 1));
            expect(sessions[sessionCode].turnData.timeLeft).toBe(1);
            expect(server.emit).toHaveBeenCalledWith('timeLeft', {
                timeLeft: expect.any(Number),
                playerSocketId: currentPlayer.socketId,
            });
        });

        it('should end turn when timeLeft reaches zero', () => {
            const endTurnSpy = jest.spyOn(service, 'endTurn');
            actionService.checkAvailableActions = jest.fn().mockReturnValue(true);
            movementService.calculateAccessibleTiles = jest.fn();
            service['startTurnTimer'](sessionCode, server, sessions, currentPlayer);
            jest.advanceTimersByTime(THOUSAND * TURN_DURATION);
            expect(endTurnSpy).toHaveBeenCalledWith(sessionCode, server, sessions);
        });

        it('should handle no movement possible scenario', () => {
            actionService.checkAvailableActions = jest.fn().mockReturnValue(false);
            currentPlayer.accessibleTiles = [];
            service['startTurnTimer'](sessionCode, server, sessions, currentPlayer);
            jest.advanceTimersByTime(THOUSAND);
            expect(server.emit).toHaveBeenCalledWith('noMovementPossible', {
                playerName: currentPlayer.name,
            });
        });
    });

    describe('virtual player turn', () => {
        beforeEach(() => {
            currentPlayer.isVirtual = true;
            sessions[sessionCode].turnData.currentPlayerSocketId = currentPlayer.socketId;
        });

        it('should start virtual player timer and handle turn', () => {
            service['startVirtualPlayerTimer'](sessionCode, server, sessions, currentPlayer, sessions[sessionCode]);
            jest.advanceTimersByTime(THOUSAND * (TURN_DURATION - 5));
            expect(virtualPlayerService.handleVirtualPlayerTurn).toHaveBeenCalledWith(
                sessionCode,
                server,
                sessions,
                currentPlayer,
                sessions[sessionCode],
            );
        });

        it('should end virtual player turn when timeLeft reaches zero', () => {
            const endTurnSpy = jest.spyOn(service, 'endTurn');
            service['startVirtualPlayerTimer'](sessionCode, server, sessions, currentPlayer, sessions[sessionCode]);
            jest.advanceTimersByTime(THOUSAND * TURN_DURATION);
            expect(endTurnSpy).toHaveBeenCalledWith(sessionCode, server, sessions);
        });
    });

    describe('pause and resume functionalities', () => {
        it('should pause turn timer', () => {
            sessions[sessionCode].turnData.turnTimer = setInterval(() => {}, 1000);
            service.pauseTurnTimer(sessions[sessionCode]);
            expect(sessions[sessionCode].turnData.turnTimer).toBeNull();
            expect(sessions[sessionCode].turnData.paused).toBe(true);
        });

        it('should resume turn timer', () => {
            service.resumeTurnTimer(sessionCode, server, sessions);
            expect(sessions[sessionCode].turnData.paused).toBe(false);
            jest.advanceTimersByTime(THOUSAND);
            expect(sessions[sessionCode].turnData.timeLeft).toBe(TURN_DURATION);
        });

        it('should not resume if turn is not paused', () => {
            sessions[sessionCode].turnData.paused = false;
            service.resumeTurnTimer(sessionCode, server, sessions);
            expect(sessions[sessionCode].turnData.turnTimer).toBeNull();
        });
    });
    describe('resume functionalities', () => {
        beforeEach(() => {
            // Set up the session and player
            sessions[sessionCode].turnData.paused = true;
            sessions[sessionCode].turnData.currentPlayerSocketId = currentPlayer.socketId;
        });

        it('should return early if session does not exist', () => {
            const invalidSessionCode = 'invalidSession';
            service.resumeTurnTimer(invalidSessionCode, server, sessions);
            expect(server.to).not.toHaveBeenCalled();
        });

        it('should return early if timer is not paused', () => {
            sessions[sessionCode].turnData.paused = false;
            service.resumeTurnTimer(sessionCode, server, sessions);
            expect(server.to).not.toHaveBeenCalled();
        });

        it('should reset paused state and start timer', () => {
            service.resumeTurnTimer(sessionCode, server, sessions);
            expect(sessions[sessionCode].turnData.paused).toBe(false);
            expect(sessions[sessionCode].turnData.turnTimer).not.toBeNull();
        });

        it('should decrement timeLeft and send time updates', () => {
            service.resumeTurnTimer(sessionCode, server, sessions);

            // Mock dependencies
            movementService.calculateAccessibleTiles = jest.fn();
            actionService.checkAvailableActions = jest.fn().mockReturnValue(true);
            service.sendTimeLeft = jest.fn();

            // Advance timers to simulate the passage of time
            jest.advanceTimersByTime(THOUSAND);

            expect(sessions[sessionCode].turnData.timeLeft).toBe(TURN_DURATION - 1);
            expect(movementService.calculateAccessibleTiles).toHaveBeenCalled();
            expect(actionService.checkAvailableActions).toHaveBeenCalled();
            expect(service.sendTimeLeft).toHaveBeenCalledWith(sessionCode, server, sessions);
        });

        it('should handle no movement and no actions possible', () => {
            // Set up mocks to simulate no movement and no actions
            movementService.calculateAccessibleTiles = jest.fn();
            actionService.checkAvailableActions = jest.fn().mockReturnValue(false);
            currentPlayer.accessibleTiles = []; // Simulate no accessible tiles
            service.endTurn = jest.fn();
            service['clearTurnTimer'] = jest.fn();

            service.resumeTurnTimer(sessionCode, server, sessions);

            // Advance timers to trigger the interval callback
            jest.advanceTimersByTime(THOUSAND);

            expect(service['clearTurnTimer']).toHaveBeenCalledWith(sessions[sessionCode]);
            expect(server.to).toHaveBeenCalledWith(sessionCode);
            expect(server.emit).toHaveBeenCalledWith('noMovementPossible', {
                playerName: currentPlayer.name,
            });
            expect(service.endTurn).toHaveBeenCalledWith(sessionCode, server, sessions);
        });

        it('should end turn when timeLeft reaches zero', () => {
            service['clearTurnTimer'] = jest.fn();
            service.endTurn = jest.fn();
            service.sendTimeLeft = jest.fn();
            movementService.calculateAccessibleTiles = jest.fn();
            actionService.checkAvailableActions = jest.fn().mockReturnValue(true);

            // Set timeLeft to 1 to simulate timer reaching zero quickly
            sessions[sessionCode].turnData.timeLeft = 1;

            service.resumeTurnTimer(sessionCode, server, sessions);

            // Advance timers to trigger the interval callback
            jest.advanceTimersByTime(THOUSAND);

            expect(service['clearTurnTimer']).toHaveBeenCalledWith(sessions[sessionCode]);
            expect(service.endTurn).toHaveBeenCalledWith(sessionCode, server, sessions);
        });
        describe('send time left', () => {
            it('should not processed if session does not exist', () => {
                const invalidSessionCode = 'invalidSession';
                const toSpy = jest.spyOn(server, 'to');
                const emitSpy = jest.spyOn(server, 'emit');

                service.sendTimeLeft(invalidSessionCode, server, sessions);

                expect(toSpy).not.toHaveBeenCalled();
                expect(emitSpy).not.toHaveBeenCalled();
            });
        });

        it('should continue the turn if movement or actions are possible and timeLeft > 0', () => {
            service.sendTimeLeft = jest.fn();
            movementService.calculateAccessibleTiles = jest.fn();
            actionService.checkAvailableActions = jest.fn().mockReturnValue(true);

            service.resumeTurnTimer(sessionCode, server, sessions);

            // Advance timers to simulate multiple intervals
            jest.advanceTimersByTime(THOUSAND * 5);

            expect(sessions[sessionCode].turnData.timeLeft).toBe(TURN_DURATION - 5);
            expect(service.sendTimeLeft).toHaveBeenCalledTimes(5);
            expect(movementService.calculateAccessibleTiles).toHaveBeenCalledTimes(5);
            expect(actionService.checkAvailableActions).toHaveBeenCalledTimes(5);
        });
    });

    describe('pauseVirtualPlayerTimer', () => {
        beforeEach(() => {
            // Set up a virtual player and active timer
            currentPlayer.isVirtual = true;
            sessions[sessionCode].turnData.turnTimer = setInterval(() => {}, 1000);
            sessions[sessionCode].turnData.paused = false;
        });

        it('should return early if session does not exist', () => {
            const invalidSessionCode = 'invalidSession';
            service.pauseVirtualPlayerTimer(invalidSessionCode, server, sessions);
            // No exception means test passes
        });

        it('should return early if turnTimer is falsy', () => {
            sessions[sessionCode].turnData.turnTimer = null;
            service.pauseVirtualPlayerTimer(sessionCode, server, sessions);
            expect(sessions[sessionCode].turnData.paused).toBe(false);
        });

        it('should clear interval, set turnTimer to null, and set paused to true', () => {
            jest.spyOn(global, 'clearInterval');
            const timerId = sessions[sessionCode].turnData.turnTimer;
            service.pauseVirtualPlayerTimer(sessionCode, server, sessions);
            expect(clearInterval).toHaveBeenCalledWith(timerId);
            expect(sessions[sessionCode].turnData.turnTimer).toBeNull();
            expect(sessions[sessionCode].turnData.paused).toBe(true);
        });
    });
    describe('resumeVirtualPlayerTimer', () => {
        beforeEach(() => {
            // Set up a virtual player and paused state
            currentPlayer.isVirtual = true;
            sessions[sessionCode].turnData.paused = true;
            sessions[sessionCode].turnData.timeLeft = TURN_DURATION;

            // Mock dependencies
            service['clearTurnTimer'] = jest.fn();
            service.endTurn = jest.fn();
            service.sendTimeLeft = jest.fn();
        });

        it('should return early if session does not exist', () => {
            const invalidSessionCode = 'invalidSession';
            service.resumeVirtualPlayerTimer(invalidSessionCode, server, sessions);
            // No exception means test passes
        });

        it('should return early if paused is false', () => {
            sessions[sessionCode].turnData.paused = false;
            service.resumeVirtualPlayerTimer(sessionCode, server, sessions);
            expect(sessions[sessionCode].turnData.turnTimer).toBeNull();
        });

        it('should set paused to false and start the interval', () => {
            service.resumeVirtualPlayerTimer(sessionCode, server, sessions);
            expect(sessions[sessionCode].turnData.paused).toBe(false);
            expect(sessions[sessionCode].turnData.turnTimer).not.toBeNull();
        });

        it('should decrement timeLeft and send time updates', () => {
            service.resumeVirtualPlayerTimer(sessionCode, server, sessions);
            jest.advanceTimersByTime(THOUSAND);
            expect(sessions[sessionCode].turnData.timeLeft).toBe(TURN_DURATION - 1);
            expect(service.sendTimeLeft).toHaveBeenCalledWith(sessionCode, server, sessions);
        });

        it('should end turn when timeLeft reaches zero', () => {
            sessions[sessionCode].turnData.timeLeft = 1;
            service.resumeVirtualPlayerTimer(sessionCode, server, sessions);
            jest.advanceTimersByTime(THOUSAND);
            expect(service['clearTurnTimer']).toHaveBeenCalledWith(sessions[sessionCode]);
            expect(service.endTurn).toHaveBeenCalledWith(sessionCode, server, sessions);
        });

        it('should end turn after 5 seconds if not paused', () => {
            service.resumeVirtualPlayerTimer(sessionCode, server, sessions);
            jest.advanceTimersByTime(FIVE_THOUSAND);
            expect(service['clearTurnTimer']).toHaveBeenCalledWith(sessions[sessionCode]);
            expect(service.endTurn).toHaveBeenCalledWith(sessionCode, server, sessions);
        });

        it('should not end turn after 5 seconds if paused', () => {
            service.resumeVirtualPlayerTimer(sessionCode, server, sessions);
            // Pause the turn before 5 seconds
            jest.advanceTimersByTime(THOUSAND * 2);
            sessions[sessionCode].turnData.paused = true;
            jest.advanceTimersByTime(FIVE_THOUSAND - THOUSAND * 2);
            expect(service['clearTurnTimer']).not.toHaveBeenCalled();
            expect(service.endTurn).not.toHaveBeenCalled();
        });
    });
    describe('TurnService', () => {
        // ... (beforeEach and other setup code)

        // Mock the TURN_DURATION constant if needed
        const TURN_DURATION = 30;

        describe('setTurnData', () => {
            let advanceTurnIndexSpy: jest.SpyInstance;
            let setCurrentPlayerSpy: jest.SpyInstance;

            beforeEach(() => {
                // Initialize spies on private methods
                advanceTurnIndexSpy = jest.spyOn<any, any>(service, 'advanceTurnIndex');
                setCurrentPlayerSpy = jest.spyOn<any, any>(service, 'setCurrentPlayer');

                // Set up a session with a turn order
                sessions[sessionCode].turnData.turnOrder = ['player1', 'player2', 'player3'];
                sessions[sessionCode].turnData.currentTurnIndex = 0;
                sessions[sessionCode].turnData.currentPlayerSocketId = 'player1';
            });

            afterEach(() => {
                jest.clearAllMocks();
            });

            it('should set currentTurnIndex and currentPlayerSocketId when startingPlayerSocketId is provided and exists', () => {
                const startingPlayerSocketId = 'player2';

                service['setTurnData'](sessions[sessionCode], startingPlayerSocketId);

                expect(sessions[sessionCode].turnData.currentTurnIndex).toBe(1);
                expect(setCurrentPlayerSpy).toHaveBeenCalledWith(sessions[sessionCode]);
                expect(sessions[sessionCode].turnData.currentPlayerSocketId).toBe('player2');
                expect(sessions[sessionCode].turnData.timeLeft).toBe(TURN_DURATION);
                expect(advanceTurnIndexSpy).not.toHaveBeenCalled();
            });

            it('should set currentTurnIndex to -1 and currentPlayerSocketId to undefined when startingPlayerSocketId does not exist', () => {
                const startingPlayerSocketId = 'playerX'; // Does not exist in turnOrder

                service['setTurnData'](sessions[sessionCode], startingPlayerSocketId);

                expect(sessions[sessionCode].turnData.currentTurnIndex).toBe(-1);
                expect(setCurrentPlayerSpy).toHaveBeenCalledWith(sessions[sessionCode]);
                expect(sessions[sessionCode].turnData.currentPlayerSocketId).toBeUndefined();
                expect(sessions[sessionCode].turnData.timeLeft).toBe(TURN_DURATION);
                expect(advanceTurnIndexSpy).not.toHaveBeenCalled();
            });

            it('should advance turn index and set current player when startingPlayerSocketId is not provided', () => {
                sessions[sessionCode].turnData.currentTurnIndex = 1; // Before advancing

                service['setTurnData'](sessions[sessionCode]);

                expect(advanceTurnIndexSpy).toHaveBeenCalledWith(sessions[sessionCode]);
                expect(setCurrentPlayerSpy).toHaveBeenCalledWith(sessions[sessionCode]);
                expect(sessions[sessionCode].turnData.currentPlayerSocketId).toBe('player3');
                expect(sessions[sessionCode].turnData.timeLeft).toBe(TURN_DURATION);
            });

            it('should wrap around currentTurnIndex when it exceeds turnOrder length', () => {
                sessions[sessionCode].turnData.currentTurnIndex = 2; // Last index

                service['setTurnData'](sessions[sessionCode]);

                expect(advanceTurnIndexSpy).toHaveBeenCalledWith(sessions[sessionCode]);
                expect(setCurrentPlayerSpy).toHaveBeenCalledWith(sessions[sessionCode]);
                expect(sessions[sessionCode].turnData.currentPlayerSocketId).toBe('player1');
                expect(sessions[sessionCode].turnData.timeLeft).toBe(TURN_DURATION);
            });
        });
    });
    describe('initiateRealPlayerTurn', () => {
        let isMovementRestrictedSpy: jest.SpyInstance;
        let handleNoMovementSpy: jest.SpyInstance;
        let notifyPlayerOfAccessibleTilesSpy: jest.SpyInstance;
        let startTurnTimerSpy: jest.SpyInstance;

        beforeEach(() => {
            // Initialize spies on methods
            isMovementRestrictedSpy = jest.spyOn(service as any, 'isMovementRestricted');
            handleNoMovementSpy = jest.spyOn(service as any, 'handleNoMovement').mockImplementation(() => {});
            notifyPlayerOfAccessibleTilesSpy = jest.spyOn(service as any, 'notifyPlayerOfAccessibleTiles').mockImplementation(() => {});
            startTurnTimerSpy = jest.spyOn(service as any, 'startTurnTimer').mockImplementation(() => {});

            // Mock the actionService
            actionService.checkAvailableActions = jest.fn();

            // Set up the current player
            currentPlayer = {
                socketId: 'player1',
                name: 'Player One',
                isVirtual: false,
                attributes: {
                    speed: {
                        baseValue: 5,
                        currentValue: 5,
                    },
                },
                accessibleTiles: [],
            } as unknown as Player;

            // Set up the session
            sessions[sessionCode] = {
                // ... other session properties
                grid: [],
            } as unknown as Session;
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should handle no movement when movement is restricted and no actions are possible', () => {
            // Arrange
            jest.spyOn(actionService, 'checkAvailableActions').mockReturnValue(false);
            isMovementRestrictedSpy.mockReturnValue(true);

            // Act
            (service as any).initiateRealPlayerTurn(sessionCode, server, sessions, currentPlayer, sessions[sessionCode]);

            // Assert
            expect(actionService.checkAvailableActions).toHaveBeenCalledWith(currentPlayer, sessions[sessionCode].grid);
            expect(isMovementRestrictedSpy).toHaveBeenCalledWith(currentPlayer);
            expect(handleNoMovementSpy).toHaveBeenCalledWith(sessionCode, server, sessions, currentPlayer);
            expect(notifyPlayerOfAccessibleTilesSpy).not.toHaveBeenCalled();
            expect(startTurnTimerSpy).not.toHaveBeenCalled();
        });

        it('should proceed when movement is restricted but actions are possible', () => {
            // Arrange
            jest.spyOn(actionService, 'checkAvailableActions').mockReturnValue(true);
            isMovementRestrictedSpy.mockReturnValue(true);

            // Act
            (service as any).initiateRealPlayerTurn(sessionCode, server, sessions, currentPlayer, sessions[sessionCode]);

            // Assert
            expect(actionService.checkAvailableActions).toHaveBeenCalledWith(currentPlayer, sessions[sessionCode].grid);
            expect(isMovementRestrictedSpy).toHaveBeenCalledWith(currentPlayer);
            expect(handleNoMovementSpy).not.toHaveBeenCalled();
            expect(notifyPlayerOfAccessibleTilesSpy).toHaveBeenCalledWith(server, sessionCode, currentPlayer);
            expect(startTurnTimerSpy).toHaveBeenCalledWith(sessionCode, server, sessions, currentPlayer);
        });

        it('should proceed when movement is not restricted', () => {
            // Arrange
            jest.spyOn(actionService, 'checkAvailableActions').mockReturnValue(false);
            isMovementRestrictedSpy.mockReturnValue(false);

            // Act
            (service as any).initiateRealPlayerTurn(sessionCode, server, sessions, currentPlayer, sessions[sessionCode]);

            // Assert
            expect(actionService.checkAvailableActions).toHaveBeenCalledWith(currentPlayer, sessions[sessionCode].grid);
            expect(isMovementRestrictedSpy).toHaveBeenCalledWith(currentPlayer);
            expect(handleNoMovementSpy).not.toHaveBeenCalled();
            expect(notifyPlayerOfAccessibleTilesSpy).toHaveBeenCalledWith(server, sessionCode, currentPlayer);
            expect(startTurnTimerSpy).toHaveBeenCalledWith(sessionCode, server, sessions, currentPlayer);
        });
        it('should call methods with correct parameters', () => {
            // Arrange
            jest.spyOn(actionService, 'checkAvailableActions').mockReturnValue(true);
            isMovementRestrictedSpy.mockReturnValue(false);

            // Act
            (service as any).initiateRealPlayerTurn(sessionCode, server, sessions, currentPlayer, sessions[sessionCode]);

            // Assert
            expect(actionService.checkAvailableActions).toHaveBeenCalledWith(currentPlayer, sessions[sessionCode].grid);
            expect(isMovementRestrictedSpy).toHaveBeenCalledWith(currentPlayer);
            expect(notifyPlayerOfAccessibleTilesSpy).toHaveBeenCalledWith(server, sessionCode, currentPlayer);
            expect(startTurnTimerSpy).toHaveBeenCalledWith(sessionCode, server, sessions, currentPlayer);
        });
    });
    describe('shuffle', () => {
        it('should shuffle the array correctly when Math.random is mocked', () => {
            // Arrange
            const players: Player[] = [
                { socketId: 'player1' } as Player,
                { socketId: 'player2' } as Player,
                { socketId: 'player3' } as Player,
                { socketId: 'player4' } as Player,
            ];

            // Mock Math.random to return specific values
            const randomValues = [0.75, 0.5, 0.25];
            let callIndex = 0;
            jest.spyOn(Math, 'random').mockImplementation(() => randomValues[callIndex++]);

            // Act
            service['shuffle'](players);

            // Assert
            const expectedOrder = [{ socketId: 'player3' }, { socketId: 'player1' }, { socketId: 'player2' }, { socketId: 'player4' }];

            expect(players).toEqual(expectedOrder);
        });
    });
    describe('handleNoMovement', () => {
        it('should emit noMovementPossible event and call endTurn after timeout', () => {
            // Arrange
            jest.spyOn(service, 'endTurn').mockImplementation(() => {});
            const emitSpy = jest.spyOn(server, 'emit');

            // Act
            service['handleNoMovement'](sessionCode, server, sessions, currentPlayer);

            // Assert
            expect(server.to).toHaveBeenCalledWith(sessionCode);
            expect(emitSpy).toHaveBeenCalledWith('noMovementPossible', { playerName: currentPlayer.name });

            // Fast-forward time
            jest.advanceTimersByTime(THREE_THOUSAND);

            expect(service.endTurn).toHaveBeenCalledWith(sessionCode, server, sessions);
        });
    });

    describe('notifyPlayerOfAccessibleTiles', () => {
        it('should emit accessibleTiles event to the correct player with correct data', () => {
            // Arrange
            currentPlayer.accessibleTiles = [
                { row: 1, col: 1 },
                { row: 1, col: 2 },
            ] as any as AccessibleTile[];

            const emitSpy = jest.spyOn(server, 'emit');

            // Act
            service['notifyPlayerOfAccessibleTiles'](server, sessionCode, currentPlayer);

            // Assert
            expect(server.to).toHaveBeenCalledWith(currentPlayer.socketId);
            expect(emitSpy).toHaveBeenCalledWith('accessibleTiles', { accessibleTiles: currentPlayer.accessibleTiles });
        });
    });

    describe('notifyOthersOfRestrictedTiles', () => {
        it('should emit accessibleTiles event with empty tiles to all other players', () => {
            // Arrange
            const otherPlayer1 = { socketId: 'player2', name: 'Player Two' } as Player;
            const otherPlayer2 = { socketId: 'player3', name: 'Player Three' } as Player;
            sessions[sessionCode].players.push(otherPlayer1, otherPlayer2);

            const emitSpy = jest.spyOn(server, 'emit');

            // Act
            service['notifyOthersOfRestrictedTiles'](server, sessions[sessionCode], currentPlayer);

            // Assert
            expect(server.to).toHaveBeenCalledTimes(2);
            expect(server.to).toHaveBeenCalledWith(otherPlayer1.socketId);
            expect(server.to).toHaveBeenCalledWith(otherPlayer2.socketId);
            expect(emitSpy).toHaveBeenCalledTimes(2);
            expect(emitSpy).toHaveBeenCalledWith('accessibleTiles', { accessibleTiles: [] });
        });
    });
});
