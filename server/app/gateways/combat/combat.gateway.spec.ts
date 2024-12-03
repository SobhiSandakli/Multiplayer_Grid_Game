/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-lines */
import { CombatService } from '@app/services/combat/combat.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { CombatGateway } from './combat.gateway';

describe('CombatGateway', () => {
    let gateway: CombatGateway;
    let combatService: CombatService;
    let sessionsService: SessionsService;
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
                CombatGateway,
                {
                    provide: CombatService,
                    useValue: {
                        initiateCombat: jest.fn(),
                        executeAttack: jest.fn(),
                        attemptEvasion: jest.fn(),
                    },
                },
                {
                    provide: SessionsService,
                    useValue: {
                        getSession: jest.fn(),
                    },
                },
            ],
        }).compile();

        gateway = module.get<CombatGateway>(CombatGateway);
        combatService = module.get<CombatService>(CombatService);
        sessionsService = module.get<SessionsService>(SessionsService);

        (gateway as any).server = server as Server;
    });

    const createMockSession = () => ({
        players: [
            {
                socketId: 'client-socket-id',
                avatar: 'avatar1',
            },
            {
                socketId: 'other-socket-id',
                avatar: 'avatar2',
            },
        ],
        combatData: {
            combatants: [
                {
                    socketId: 'client-socket-id',
                    avatar: 'avatar1',
                },
                {
                    socketId: 'other-socket-id',
                    avatar: 'avatar2',
                },
            ],
        },
    });

    describe('handleStartCombat', () => {
        it('should initiate combat between two players', () => {
            const sessionCode = 'testSession';
            const data = { sessionCode, avatar1: 'avatar1', avatar2: 'avatar2' };
            const session = createMockSession();
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleStartCombat(client as Socket, data);

            expect(combatService.initiateCombat).toHaveBeenCalledWith(sessionCode, session.players[0], session.players[1], server);
        });

        it('should not initiate combat if opponent is not found', () => {
            const sessionCode = 'testSession';
            const data = { sessionCode, avatar1: 'avatar1', avatar2: 'nonexistent-avatar' };
            const session = createMockSession();
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleStartCombat(client as Socket, data);

            expect(combatService.initiateCombat).not.toHaveBeenCalled();
        });

        it('should not initiate combat if session is not found', () => {
            const sessionCode = 'invalidSession';
            const data = { sessionCode, avatar1: 'avatar1', avatar2: 'avatar2' };
            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            gateway.handleStartCombat(client as Socket, data);

            expect(combatService.initiateCombat).not.toHaveBeenCalled();
        });
    });

    describe('handleAttack', () => {
        it('should execute attack between two combatants', () => {
            const sessionCode = 'testSession';
            const data = { sessionCode };
            const session = createMockSession();
            session.combatData.combatants = [
                { socketId: 'client-socket-id', avatar: 'avatar1' },
                { socketId: 'other-socket-id', avatar: 'avatar2' },
            ];
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleAttack(client as Socket, data);

            expect(combatService.executeAttack).toHaveBeenCalledWith(
                sessionCode,
                session.combatData.combatants[0],
                session.combatData.combatants[1],
                server,
            );
        });

        it('should not execute attack if opponent is not found', () => {
            const sessionCode = 'testSession';
            const data = { sessionCode };
            const session = createMockSession();
            session.combatData.combatants = [{ socketId: 'client-socket-id', avatar: 'avatar1' }];
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleAttack(client as Socket, data);

            expect(combatService.executeAttack).not.toHaveBeenCalled();
        });

        it('should not execute attack if session is not found', () => {
            const sessionCode = 'invalidSession';
            const data = { sessionCode };
            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            gateway.handleAttack(client as Socket, data);

            expect(combatService.executeAttack).not.toHaveBeenCalled();
        });
    });

    describe('handleEvasion', () => {
        it('should attempt evasion for the player', () => {
            const sessionCode = 'testSession';
            const data = { sessionCode };
            const session = createMockSession();
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleEvasion(client as Socket, data);

            expect(combatService.attemptEvasion).toHaveBeenCalledWith(sessionCode, session.players[0], server);
        });

        it('should not attempt evasion if player is not found', () => {
            const sessionCode = 'testSession';
            const data = { sessionCode };
            const session = createMockSession();
            session.players = [];
            (sessionsService.getSession as jest.Mock).mockReturnValue(session);

            gateway.handleEvasion(client as Socket, data);

            expect(combatService.attemptEvasion).not.toHaveBeenCalled();
        });

        it('should not attempt evasion if session is not found', () => {
            const sessionCode = 'invalidSession';
            const data = { sessionCode };
            (sessionsService.getSession as jest.Mock).mockReturnValue(undefined);

            gateway.handleEvasion(client as Socket, data);

            expect(combatService.attemptEvasion).not.toHaveBeenCalled();
        });
    });
});
