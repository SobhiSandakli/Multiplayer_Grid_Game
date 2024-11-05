// combat-turn.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CombatTurnService } from './combat-turn.service';
import { SessionsGateway } from '@app/gateways/sessions/sessions/sessions.gateway';
import { Session } from '@app/interfaces/session/session.interface';
import { Server } from 'socket.io';
import { Player } from '@app/interfaces/player/player.interface';
import { Attribute } from '@app/interfaces/attribute/attribute.interface';
import { EventEmitter } from 'events';

describe('CombatTurnService', () => {
    let service: CombatTurnService;
    let sessionsGateway: SessionsGateway;
    let server: Server;
    let session: Session;
    let player1: Player;
    let player2: Player;
    let emitMock: jest.Mock;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CombatTurnService,
                {
                    provide: SessionsGateway,
                    useValue: {
                        handleAttack: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<CombatTurnService>(CombatTurnService);
        sessionsGateway = module.get<SessionsGateway>(SessionsGateway);

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

        // Mock Players
        const nbEvasionAttribute: Attribute = {
            currentValue: 1,
            baseValue: 1,
            dice: '',
            name: '',
            description: ''
        };

        player1 = {
            socketId: 'socket1',
            name: 'Player1',
            avatar: '',
            attributes: {
                nbEvasion: { ...nbEvasionAttribute },
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
                nbEvasion: { ...nbEvasionAttribute },
            },
            isOrganizer: false,
            position: { row: 1, col: 1 },
            accessibleTiles: [],
        };
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('should start combat with correct initial values', () => {
        session.combat = [player1, player2];
        session.combatTurnIndex = -1;

        service.startCombat('sessionCode', server, session);

        expect(session.combatTurnIndex).toBe(0);
        expect(server.to).toHaveBeenCalledWith('sessionCode');
        expect(emitMock).toHaveBeenCalledWith('combatTurnStarted', {
            playerSocketId: player1.socketId,
            timeLeft: expect.any(Number),
        });
    });

    it('should start the combat and initiate the first turn timer', () => {
        jest.useFakeTimers();

        session.combat = [player1, player2];

        service.startCombat('sessionCode', server, session);

        expect(session.combatTurnIndex).toBe(0);

        jest.advanceTimersByTime(1000);

        expect(emitMock).toHaveBeenCalledWith('combatTimeLeft', {
            timeLeft: expect.any(Number),
            playerSocketId: player1.socketId,
        });

        jest.useRealTimers();
    });

    it('should trigger auto-attack when time runs out without action', () => {
        jest.useFakeTimers();

        player1.attributes['nbEvasion'].currentValue = 1;
        session.combat = [player1, player2];

        service.startCombat('sessionCode', server, session);

        jest.advanceTimersByTime(5000);

        expect(emitMock).toHaveBeenCalledWith('autoAttack', {
            message: 'Time is up! An attack was automatically chosen.',
        });
        expect(sessionsGateway.handleAttack).toHaveBeenCalledWith(null, {
            sessionCode: 'sessionCode',
            clientSocketId: player1.socketId,
        });

        jest.useRealTimers();
    });

    it('should not trigger auto-attack if action was taken', () => {
        jest.useFakeTimers();

        player1.attributes['nbEvasion'].currentValue = 1;
        session.combat = [player1, player2];

        service.startCombat('sessionCode', server, session);

        service.markActionTaken();

        jest.advanceTimersByTime(5000);

        expect(emitMock).not.toHaveBeenCalledWith('autoAttack', expect.anything());
        expect(sessionsGateway.handleAttack).not.toHaveBeenCalled();

        jest.useRealTimers();
    });

    it('should use shorter turn duration when player has no evasion attempts', () => {
        jest.useFakeTimers();

        player1.attributes['nbEvasion'].currentValue = 0;
        session.combat = [player1, player2];

        service.startCombat('sessionCode', server, session);

        jest.advanceTimersByTime(3000);

        expect(emitMock).toHaveBeenCalledWith('autoAttack', {
            message: 'Time is up! An attack was automatically chosen.',
        });
        expect(sessionsGateway.handleAttack).toHaveBeenCalledWith(null, {
            sessionCode: 'sessionCode',
            clientSocketId: player1.socketId,
        });

        jest.useRealTimers();
    });

    it('should end the current combat turn and start the next one', () => {
        jest.useFakeTimers();

        session.combat = [player1, player2];
        session.combatTurnIndex = 0;
        session.combatTurnTimer = setInterval(() => {}, 1000);

        service.endCombatTurn('sessionCode', server, session);

        expect(session.combatTurnTimer).toBeNull();
        expect(session.combatTurnIndex).toBe(1);
        expect(emitMock).toHaveBeenCalledWith('combatTurnEnded', {
            playerSocketId: player2.socketId,
        });

        jest.advanceTimersByTime(1000);

        expect(emitMock).toHaveBeenCalledWith('combatTurnStarted', {
            playerSocketId: player2.socketId,
            timeLeft: expect.any(Number),
        });

        jest.useRealTimers();
    });

    it('should not start next combat turn if there are no combat participants', () => {
        session.combat = [];
        session.combatTurnTimer = setInterval(() => {}, 1000);

        service.endCombatTurn('sessionCode', server, session);

        expect(session.combatTurnTimer).toBeNull();
        expect(emitMock).not.toHaveBeenCalledWith('combatTurnEnded', expect.anything());
    });

    it('should end the combat and reset session combat state', () => {
        session.combatTurnTimer = setInterval(() => {}, 1000);
        session.combat = [player1, player2];
        session.combatTurnIndex = 1;

        service.endCombat('sessionCode', server, session);

        expect(session.combatTurnTimer).toBeNull();
        expect(emitMock).toHaveBeenCalledWith('combatEnded', { message: 'Combat has ended.' });
        expect(session.combat).toEqual([]);
        expect(session.combatTurnIndex).toBe(-1);
    });

    it('should mark action as taken', () => {
        service.markActionTaken();
        expect(service['actionTaken']).toBe(true);
    });
});
