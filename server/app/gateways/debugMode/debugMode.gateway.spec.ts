import { Test, TestingModule } from '@nestjs/testing';
import { DebugModeGateway } from './debugMode.gateway';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { DebugModeService } from '@app/services/debugMode/debugMode.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { TurnService } from '@app/services/turn/turn.service';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { Server, Socket } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import { Player } from '@app/interfaces/player/player.interface';

describe('DebugModeGateway', () => {
    let debugModeGateway: DebugModeGateway;
    let sessionsService: SessionsService;
    let debugModeService: DebugModeService;
    let turnService: TurnService;
    let eventsGateway: EventsGateway;
    let client: Socket;
    let server: Server;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DebugModeGateway,
                {
                    provide: SessionsService,
                    useValue: {
                        getSession: jest.fn(),
                    },
                },
                {
                    provide: DebugModeService,
                    useValue: {
                        processDebugMovement: jest.fn(),
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
                {
                    provide: EventsGateway,
                    useValue: {
                        addEventToSession: jest.fn(),
                    },
                },
            ],
        }).compile();

        debugModeGateway = module.get<DebugModeGateway>(DebugModeGateway);
        sessionsService = module.get<SessionsService>(SessionsService);
        debugModeService = module.get<DebugModeService>(DebugModeService);
        turnService = module.get<TurnService>(TurnService);
        eventsGateway = module.get<EventsGateway>(EventsGateway);

        server = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as any as Server;

        client = {
            id: 'socket-id',
            emit: jest.fn(),
        } as any as Socket;

        debugModeGateway['server'] = server;
    });

    describe('handleToggleDebugMode', () => {
        it('should do nothing if session is invalid', () => {
            const data = { sessionCode: 'invalid-session' };
            (sessionsService.getSession as jest.Mock).mockReturnValue(null);

            debugModeGateway.handleToggleDebugMode(client, data);

            expect(client.emit).not.toHaveBeenCalled();
            expect(server.to).not.toHaveBeenCalled();
        });

        it('should emit error if client is not the organizer', () => {
            const data = { sessionCode: 'session-code' };
            const session: Session = {
                organizerId: 'other-socket-id',
            } as any;

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            debugModeGateway.handleToggleDebugMode(client, data);

            expect(client.emit).toHaveBeenCalledWith('error', {
                message: "Seul l'organisateur peut activer/désactiver le mode débogage.",
            });
            expect(server.to).not.toHaveBeenCalled();
        });

        it('should toggle debug mode and emit events', () => {
            const data = { sessionCode: 'session-code' };
            const session: Session = {
                organizerId: client.id,
                isDebugMode: false,
            } as any;

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            debugModeGateway.handleToggleDebugMode(client, data);

            expect(session.isDebugMode).toBe(true);
            expect(server.to).toHaveBeenCalledWith(data.sessionCode);
            expect(server.to(data.sessionCode).emit).toHaveBeenCalledWith('debugModeToggled', {
                isDebugMode: true,
            });
            expect(eventsGateway.addEventToSession).toHaveBeenCalledWith(data.sessionCode, 'Le mode débogage a été activé.', ['everyone']);
        });
    });

    describe('handleDebugModeMovement', () => {
        it("should do nothing if it is not the player's turn", () => {
            const data = { sessionCode: 'session-code', destination: { row: 2, col: 2 } };
            const session: Session = {
                players: [{ socketId: client.id }],
            } as any;

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);
            (turnService.isCurrentPlayerTurn as jest.Mock).mockReturnValue(false);

            debugModeGateway.handleDebugModeMovement(client, data);

            expect(debugModeService.processDebugMovement).not.toHaveBeenCalled();
        });

        it('should call processDebugMovement when valid', () => {
            const data = { sessionCode: 'session-code', destination: { row: 2, col: 2 } };
            const player: Player = { socketId: client.id } as any;
            const session: Session = {
                players: [player],
            } as any;

            (sessionsService.getSession as jest.Mock).mockReturnValue(session);
            (turnService.isCurrentPlayerTurn as jest.Mock).mockReturnValue(true);

            debugModeGateway.handleDebugModeMovement(client, data);

            expect(debugModeService.processDebugMovement).toHaveBeenCalledWith(client, data.sessionCode, player, data.destination, server);
        });
    });
});
