import { Test, TestingModule } from '@nestjs/testing';
import { TurnService } from './turn.service';
import { MovementService } from '@app/services/movement/movement.service';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { ActionService } from '@app/services/action/action.service';
import { VirtualPlayerService } from '@app/services/virtual-player/virtual-player.service';
import { Server, Socket } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { THOUSAND, THREE_THOUSAND, TURN_DURATION } from '@app/constants/turn-constants';
import { of } from 'rxjs';

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
    });
