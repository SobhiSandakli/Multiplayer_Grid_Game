// sessions.service.spec.ts

import { CharacterData } from '@app/interfaces/character-data/character-data.interface';
import { Server, Socket } from 'socket.io';
import { SessionsService } from './sessions.service';
import { mock, MockProxy } from 'jest-mock-extended';
import { TurnService } from '@app/services/turn/turn.service';
import { Session } from '@app/interfaces/session/session.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { NOMBRE_OF_PLAYER, MIN_SESSION_CODE, MAX_SESSION_CODE } from '@app/constants/session-constants';

describe('SessionsService', () => {
    let sessionsService: SessionsService;
    let mockServer: MockProxy<Server>;
    let mockSocket: MockProxy<Socket>;
    let mockTurnService: MockProxy<TurnService>;

    beforeEach(() => {
        // Créer un mock de TurnService
        mockTurnService = mock<TurnService>();

        // Instancier SessionsService avec le mock de TurnService
        sessionsService = new SessionsService(mockTurnService);

        // Créer des mocks de Server et Socket
        mockServer = mock<Server>();
        mockServer.to.mockReturnThis(); // Permet le chaînage des appels

        mockSocket = mock<Socket>();
        Object.defineProperty(mockSocket, 'id', { value: 'client123' });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateUniqueSessionCode', () => {
        it('should generate a unique session code within the specified range', () => {
            const sessionCode = sessionsService.generateUniqueSessionCode();
            const numericCode = Number(sessionCode);
            expect(sessionCode).toHaveLength(4); // Assumant que NOMBRE_OF_PLAYER = 4
            expect(numericCode).toBeGreaterThanOrEqual(MIN_SESSION_CODE);
            expect(numericCode).toBeLessThanOrEqual(MAX_SESSION_CODE);
        });

        it('should generate a unique session code not already in use', () => {
            // Simuler que certains codes existent déjà
            (sessionsService as any).sessions['1234'] = {} as Session;
            (sessionsService as any).sessions['5678'] = {} as Session;

            const sessionCode = sessionsService.generateUniqueSessionCode();
            expect(['1234', '5678']).not.toContain(sessionCode);
            const numericCode = Number(sessionCode);
            expect(numericCode).toBeGreaterThanOrEqual(MIN_SESSION_CODE);
            expect(numericCode).toBeLessThanOrEqual(MAX_SESSION_CODE);
        });
    });

    describe('createNewSession', () => {
        it('should create a new session and return a valid session code', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);

            expect(sessionCode).toBeDefined();
            expect(session).toBeDefined();
            expect(session?.organizerId).toBe('client123');
            expect(session?.maxPlayers).toBe(NOMBRE_OF_PLAYER);
            expect(session?.selectedGameID).toBe('game123');
            expect(session?.players).toEqual([]);
            expect(session?.locked).toBe(false);
            expect(session?.turnOrder).toEqual([]);
            expect(session?.currentTurnIndex).toBe(-1);
            expect(session?.currentPlayerSocketId).toBeNull();
            expect(session?.turnTimer).toBeNull();
            expect(session?.timeLeft).toBe(0);
        });
    });

    describe('validateCharacterCreation', () => {
        it('should return error if session is not found', () => {
            const result = sessionsService.validateCharacterCreation('invalidCode', {} as CharacterData, mockServer);
            expect(result.error).toBe('Session introuvable ou code de session manquant.');
        });

        it('should return error if avatar is already taken', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);
            if (session) {
                session.players.push({
                    socketId: 'player1',
                    name: 'Player1',
                    avatar: 'avatar1',
                    attributes: { speed: { name: 'Speed', description: '', baseValue: 5, currentValue: 5 } },
                    isOrganizer: true,
                    position: { row: 0, col: 0 },
                    accessibleTiles: [],
                    hasLeft: false,
                });
            }

            const result = sessionsService.validateCharacterCreation(
                sessionCode,
                { name: 'Player2', avatar: 'avatar1', attributes: { speed: { name: 'Speed', description: '', baseValue: 5, currentValue: 5 } } } as CharacterData,
                mockServer,
            );

            expect(result.error).toBe('Avatar déjà pris.');
        });

        it('should return error if session is full', () => {
            const sessionCode = sessionsService.createNewSession('client123', 1, 'game123'); // maxPlayers = 1
            const session = sessionsService.getSession(sessionCode);
            if (session) {
                session.players.push({
                    socketId: 'player1',
                    name: 'Player1',
                    avatar: 'avatar1',
                    attributes: { speed: { name: 'Speed', description: '', baseValue: 5, currentValue: 5 } },
                    isOrganizer: true,
                    position: { row: 0, col: 0 },
                    accessibleTiles: [],
                    hasLeft: false,
                });
            }

            const result = sessionsService.validateCharacterCreation(
                sessionCode,
                { name: 'Player2', avatar: 'avatar2', attributes: { speed: { name: 'Speed', description: '', baseValue: 5, currentValue: 5 } } } as CharacterData,
                mockServer,
            );

            expect(result.error).toBe('Le nombre maximum de joueurs est atteint.');
            expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
            expect(mockServer.emit).toHaveBeenCalledWith('roomLocked', { locked: true });
        });

        it('should return valid session and unique player name', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const result = sessionsService.validateCharacterCreation(
                sessionCode,
                { name: 'Player1', avatar: 'avatar1', attributes: { speed: { name: 'Speed', description: '', baseValue: 5, currentValue: 5 } } } as CharacterData,
                mockServer,
            );

            expect(result.error).toBeUndefined();
            expect(result.finalName).toBe('Player1');
            expect(result.session).toBeDefined();
            expect(result.gameId).toBe('game123');
        });

        it('should generate a unique player name if the desired name is already taken', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);
            if (session) {
                session.players.push({
                    socketId: 'player1',
                    name: 'Player1',
                    avatar: 'avatar1',
                    attributes: { speed: { name: 'Speed', description: '', baseValue: 5, currentValue: 5 } },
                    isOrganizer: true,
                    position: { row: 0, col: 0 },
                    accessibleTiles: [],
                    hasLeft: false,
                });
                session.players.push({
                    socketId: 'player2',
                    name: 'Player1-2',
                    avatar: 'avatar2',
                    attributes: { speed: { name: 'Speed', description: '', baseValue: 5, currentValue: 5 } },
                    isOrganizer: false,
                    position: { row: 1, col: 1 },
                    accessibleTiles: [],
                    hasLeft: false,
                });
            }

            const result = sessionsService.validateCharacterCreation(
                sessionCode,
                { name: 'Player1', avatar: 'avatar3', attributes: { speed: { name: 'Speed', description: '', baseValue: 5, currentValue: 5 } } } as CharacterData,
                mockServer,
            );

            expect(result.error).toBeUndefined();
            expect(result.finalName).toBe('Player1-3'); // SUFFIX_NAME_INITIAL = 1, donc Player1-3
            expect(result.session).toBeDefined();
        });
    });

    describe('addPlayerToSession', () => {
        it('should add a player to the session and set isOrganizer correctly', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);
            expect(session?.players.length).toBe(0);

            if (session) {
                sessionsService.addPlayerToSession(
                    session,
                    mockSocket,
                    'Player1',
                    {
                        name: 'Player1',
                        avatar: 'avatar1',
                        attributes: { speed: { name: 'Speed', description: '', baseValue: 5, currentValue: 5 }, life: { name: 'Life', description: '', baseValue: 10, currentValue: 10 } },
                    } as CharacterData,
                );

                expect(session.players.length).toBe(1);
                expect(session.players[0].name).toBe('Player1');
                expect(session.players[0].isOrganizer).toBe(true);
                expect(session.players[0].avatar).toBe('avatar1');
                expect(session.players[0].attributes.speed.currentValue).toBe(5);
                expect(session.players[0].attributes.speed.baseValue).toBe(5);
                expect(session.players[0].attributes.life.currentValue).toBe(10);
                expect(session.players[0].attributes.life.baseValue).toBe(10);
                expect(session.players[0].position).toEqual({ row: 0, col: 0 });
                expect(session.players[0].accessibleTiles).toEqual([]);
            }
        });

        it('should set isOrganizer to false for subsequent players', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);
            expect(session?.players.length).toBe(0);

            if (session) {
                // Ajouter le premier joueur (organisateur)
                sessionsService.addPlayerToSession(
                    session,
                    mockSocket,
                    'Player1',
                    {
                        name: 'Player1',
                        avatar: 'avatar1',
                        attributes: { speed: { name: 'Speed', description: '', baseValue: 5, currentValue: 5 }, life: { name: 'Life', description: '', baseValue: 10, currentValue: 10 } },
                    } as CharacterData,
                );

                // Créer un deuxième socket
                const mockSocket2 = mock<Socket>();
                Object.defineProperty(mockSocket2, 'id', { value: 'client456' });

                // Ajouter le deuxième joueur
                sessionsService.addPlayerToSession(
                    session,
                    mockSocket2,
                    'Player2',
                    {
                        name: 'Player2',
                        avatar: 'avatar2',
                        attributes: { speed: { name: 'Speed', description: '', baseValue: 4, currentValue: 4 }, life: { name: 'Life', description: '', baseValue: 8, currentValue: 8 } },
                    } as CharacterData,
                );

                expect(session.players.length).toBe(2);
                expect(session.players[1].name).toBe('Player2');
                expect(session.players[1].isOrganizer).toBe(false);
            }
        });
    });

    describe('removePlayerFromSession', () => {
        it('should remove a player from the session and update turnOrder', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);
            if (session) {
                // Ajouter des joueurs
                session.players.push(
                    {
                        socketId: 'player1',
                        name: 'Player1',
                        avatar: 'avatar1',
                        attributes: { speed: { name: 'Speed', description: '', baseValue: 5, currentValue: 5 }, life: { name: 'Life', description: '', baseValue: 10, currentValue: 10 } },
                        isOrganizer: true,
                        position: { row: 0, col: 0 },
                        accessibleTiles: [],
                        hasLeft: false,
                    },
                    {
                        socketId: 'player2',
                        name: 'Player2',
                        avatar: 'avatar2',
                        attributes: { speed: { name: 'Speed', description: '', baseValue: 4, currentValue: 4 }, life: { name: 'Life', description: '', baseValue: 8, currentValue: 8 } },
                        isOrganizer: false,
                        position: { row: 1, col: 1 },
                        accessibleTiles: [],
                        hasLeft: false,
                    },
                );
                session.turnOrder = ['player1', 'player2'];

                const result = sessionsService.removePlayerFromSession(session, 'player1');
                expect(result).toBe(true);
                expect(session.turnOrder).toEqual(['player2']);
            }
        });

        it('should return false if player is not in the session', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);

            const result = sessionsService.removePlayerFromSession(session as Session, 'nonExistentPlayer');
            expect(result).toBe(false);
        });
    });

    describe('isOrganizer', () => {
        it('should return true if the client is the organizer', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);

            const result = sessionsService.isOrganizer(session as Session, 'client123');
            expect(result).toBe(true);
        });

        it('should return false if the client is not the organizer', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);

            const result = sessionsService.isOrganizer(session as Session, 'otherClient');
            expect(result).toBe(false);
        });
    });

    describe('terminateSession', () => {
        it('should delete a session', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            expect(sessionsService.getSession(sessionCode)).toBeDefined();

            sessionsService.terminateSession(sessionCode);
            expect(sessionsService.getSession(sessionCode)).toBeUndefined();
        });
    });

    describe('toggleSessionLock', () => {
        it('should toggle the lock status of a session', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);

            if (session) {
                sessionsService.toggleSessionLock(session, true);
                expect(session.locked).toBe(true);

                sessionsService.toggleSessionLock(session, false);
                expect(session.locked).toBe(false);
            }
        });
    });

    describe('getTakenAvatars', () => {
        it('should return a list of taken avatars in the session', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);
            if (session) {
                session.players.push(
                    {
                        socketId: 'player1',
                        name: 'Player1',
                        avatar: 'avatar1',
                        attributes: { speed: { name: 'Speed', description: '', baseValue: 5, currentValue: 5 }, life: { name: 'Life', description: '', baseValue: 10, currentValue: 10 } },
                        isOrganizer: true,
                        position: { row: 0, col: 0 },
                        accessibleTiles: [],
                        hasLeft: false,
                    },
                    {
                        socketId: 'player2',
                        name: 'Player2',
                        avatar: 'avatar2',
                        attributes: { speed: { name: 'Speed', description: '', baseValue: 4, currentValue: 4 }, life: { name: 'Life', description: '', baseValue: 8, currentValue: 8 } },
                        isOrganizer: false,
                        position: { row: 1, col: 1 },
                        accessibleTiles: [],
                        hasLeft: false,
                    },
                );
            }

            const avatars = sessionsService.getTakenAvatars(session as Session);
            expect(avatars).toEqual(['avatar1', 'avatar2']);
        });

        it('should return an empty array if no avatars are taken', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);

            const avatars = sessionsService.getTakenAvatars(session as Session);
            expect(avatars).toEqual([]);
        });
    });

    describe('getUniquePlayerName', () => {
        it('should return a unique player name if the desired name is already taken', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);

            if (session) {
                session.players.push(
                    {
                        socketId: 'player1',
                        name: 'Player1',
                        avatar: 'avatar1',
                        attributes: { speed: { name: 'Speed', description: '', baseValue: 5, currentValue: 5 }, life: { name: 'Life', description: '', baseValue: 10, currentValue: 10 } },
                        isOrganizer: true,
                        position: { row: 0, col: 0 },
                        accessibleTiles: [],
                        hasLeft: false,
                    },
                    {
                        socketId: 'player2',
                        name: 'Player1-2',
                        avatar: 'avatar2',
                        attributes: { speed: { name: 'Speed', description: '', baseValue: 4, currentValue: 4 }, life: { name: 'Life', description: '', baseValue: 8, currentValue: 8 } },
                        isOrganizer: false,
                        position: { row: 1, col: 1 },
                        accessibleTiles: [],
                        hasLeft: false,
                    },
                );
            }

            const uniqueName = (sessionsService as any).getUniquePlayerName(session as Session, 'Player1');
            expect(uniqueName).toBe('Player1-3'); // SUFFIX_NAME_INITIAL = 1
        });

        it('should return the same name if it is unique', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);

            const uniqueName = (sessionsService as any).getUniquePlayerName(session as Session, 'Player1');
            expect(uniqueName).toBe('Player1');
        });
    });
});
