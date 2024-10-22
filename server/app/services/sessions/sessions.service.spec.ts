import { CharacterData } from '@app/interfaces/character-data/character-data.interface';
import { Server, Socket } from 'socket.io';
import { NOMBRE_OF_PLAYER, MIN_SESSION_CODE, MAX_SESSION_CODE } from '@app/constants/session-constants';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
    let sessionsService: SessionsService;
    let mockServer: Partial<Server>;
    let mockSocket: Partial<Socket>;

    beforeEach(() => {
        sessionsService = new SessionsService();
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };
        mockSocket = {
            id: 'client123',
        };
    });

    describe('generateUniqueSessionCode', () => {
        it('should generate a unique session code', () => {
            const sessionCode = sessionsService.generateUniqueSessionCode();
            expect(sessionCode).toHaveLength(NOMBRE_OF_PLAYER);
            expect(Number(sessionCode)).toBeGreaterThanOrEqual(MIN_SESSION_CODE);
            expect(Number(sessionCode)).toBeLessThanOrEqual(MAX_SESSION_CODE);
        });
    });

    describe('createNewSession', () => {
        it('should create a new session and return session code', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);

            expect(sessionCode).toHaveLength(NOMBRE_OF_PLAYER);
            expect(session).toBeDefined();
            expect(session?.organizerId).toBe('client123');
            expect(session?.maxPlayers).toBe(NOMBRE_OF_PLAYER);
            expect(session?.selectedGameID).toBe('game123');
        });
    });

    describe('validateCharacterCreation', () => {
        it('should return error if session is not found', () => {
            const result = sessionsService.validateCharacterCreation('invalidCode', {} as CharacterData, mockServer as Server);
            expect(result.error).toBe('Session introuvable ou code de session manquant.');
        });

        it('should return error if avatar is already taken', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);
            if (session) {
                session.players.push({ socketId: 'player1', name: 'Player1', avatar: 'avatar1', attributes: {}, isOrganizer: true });
            }

            const result = sessionsService.validateCharacterCreation(
                sessionCode,
                { name: 'Player2', avatar: 'avatar1', attributes: {} } as CharacterData,
                mockServer as Server,
            );
            expect(result.error).toBe('Avatar déjà pris.');
        });

        it('should return error if session is full', () => {
            const sessionCode = sessionsService.createNewSession('client123', 1, 'game123');
            const session = sessionsService.getSession(sessionCode);
            if (session) {
                session.players.push({ socketId: 'player1', name: 'Player1', avatar: 'avatar1', attributes: {}, isOrganizer: true });
            }

            const result = sessionsService.validateCharacterCreation(
                sessionCode,
                { name: 'Player2', avatar: 'avatar2', attributes: {} } as CharacterData,
                mockServer as Server,
            );
            expect(result.error).toBe('Le nombre maximum de joueurs est atteint.');
            expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
            expect(mockServer.emit).toHaveBeenCalledWith('roomLocked', { locked: true });
        });

        it('should return valid session and unique player name', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const result = sessionsService.validateCharacterCreation(
                sessionCode,
                { name: 'Player1', avatar: 'avatar1', attributes: {} } as CharacterData,
                mockServer as Server,
            );

            expect(result.error).toBeUndefined();
            expect(result.finalName).toBe('Player1');
            expect(result.session).toBeDefined();
        });
    });

    describe('addPlayerToSession', () => {
        it('should add a player to the session', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);
            expect(session?.players.length).toBe(0);

            if (session) {
                sessionsService.addPlayerToSession(session, mockSocket as Socket, 'Player1', { avatar: 'avatar1', attributes: {} } as CharacterData);
                expect(session.players.length).toBe(1);
                expect(session.players[0].name).toBe('Player1');
                expect(session.players[0].isOrganizer).toBe(true);
            }
        });
    });

    describe('getUniquePlayerName', () => {
        it('should return unique player name if name is already taken', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);
            if (session) {
                session.players.push({ socketId: 'player1', name: 'Player1', avatar: 'avatar1', attributes: {}, isOrganizer: true });
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (sessionsService as any).getUniquePlayerName(session, 'Player1');
            expect(result).toBe('Player1-2');
        });

        it('should return same name if it is unique', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (sessionsService as any).getUniquePlayerName(session, 'Player1');
            expect(result).toBe('Player1');
        });
    });

    describe('removePlayerFromSession', () => {
        it('should remove a player from the session', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);
            if (session) {
                session.players.push({ socketId: 'player1', name: 'Player1', avatar: 'avatar1', attributes: {}, isOrganizer: true });
            }

            const result = sessionsService.removePlayerFromSession(session, 'player1');
            expect(result).toBe(true);
            expect(session?.players.length).toBe(0);
        });

        it('should return false if player is not in session', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);

            const result = sessionsService.removePlayerFromSession(session, 'playerNotFound');
            expect(result).toBe(false);
        });
    });

    describe('isOrganizer', () => {
        it('should return true if client is the organizer', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);

            const result = sessionsService.isOrganizer(session, 'client123');
            expect(result).toBe(true);
        });

        it('should return false if client is not the organizer', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);

            const result = sessionsService.isOrganizer(session, 'otherClient');
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
        it('should toggle the lock of a session', () => {
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
        it('should return a list of taken avatars', () => {
            const sessionCode = sessionsService.createNewSession('client123', NOMBRE_OF_PLAYER, 'game123');
            const session = sessionsService.getSession(sessionCode);
            if (session) {
                session.players.push({ socketId: 'player1', name: 'Player1', avatar: 'avatar1', attributes: {}, isOrganizer: true });
                session.players.push({ socketId: 'player2', name: 'Player2', avatar: 'avatar2', attributes: {}, isOrganizer: false });
            }

            const avatars = sessionsService.getTakenAvatars(session);
            expect(avatars).toEqual(['avatar1', 'avatar2']);
        });
    });
});
