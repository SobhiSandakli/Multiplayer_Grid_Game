/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-lines */

import { SessionsService } from './sessions.service';
import { TurnService } from '@app/services/turn/turn.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { Server, Socket } from 'socket.io';
import { CharacterData } from '@app/interfaces/character-data/character-data.interface';
import { CombatService } from '@app/services/combat/combat.service';

describe('SessionsService', () => {
    let sessionsService: SessionsService;
    let mockTurnService: Partial<TurnService>;
    let mockChangeGridService: Partial<ChangeGridService>;
    let mockCombatService: Partial<CombatService>;
    let mockServer: Partial<Server>;
    let mockSocket: Partial<Socket>;

    beforeEach(() => {
        mockTurnService = {
            calculateTurnOrder: jest.fn(),
            startTurn: jest.fn(),
            endTurn: jest.fn(),
        };

        mockChangeGridService = {
            removePlayerAvatar: jest.fn(),
        };
        const mockCombatService = {
            initiateCombat: jest.fn(),
            executeAttack: jest.fn(),
            attemptEvasion: jest.fn(),
            finalizeCombat: jest.fn(),
        };

        sessionsService = new SessionsService(
            mockTurnService as TurnService,
            mockChangeGridService as ChangeGridService,
            mockCombatService as unknown as CombatService,
        );

        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };

        mockSocket = {
            id: 'socket1',
        };
    });
    const characterData: CharacterData = {
        name: 'Player1',
        avatar: 'avatar1',
        attributes: {
            speed: { name: 'speed', description: 'Movement speed', baseValue: 10, currentValue: 10 },
            life: { name: 'life', description: 'Health points', baseValue: 100, currentValue: 100 },
        },
    };

    it('should generate a unique session code', () => {
        const sessionCode = sessionsService.generateUniqueSessionCode();
        expect(sessionCode).toBeDefined();
        expect(sessionsService.getSession(sessionCode)).toBeUndefined();
    });

    it('should create a new session', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        const session = sessionsService.getSession(sessionCode);
        expect(session).toBeDefined();
        expect(session?.organizerId).toBe('client1');
        expect(session?.maxPlayers).toBe(4);
        expect(session?.selectedGameID).toBe('game1');
    });

    it('should validate character creation with available avatar and name', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        // Updated characterData with full Attribute structure

        // const characterData: CharacterData = {
        //     name: 'Player1',
        //     avatar: 'avatar1',
        //     attributes: {
        //         speed: { name: 'speed', description: 'Movement speed', baseValue: 10, currentValue: 10 },
        //         life: { name: 'life', description: 'Health points', baseValue: 100, currentValue: 100 },
        //     },
        // };

        const result = sessionsService.validateCharacterCreation(sessionCode, characterData, mockServer as Server);
        expect(result.error).toBeUndefined();
        expect(result.finalName).toBe('Player1');
    });

    it('should return error if avatar is taken during character creation', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        // Updated characterData with full Attribute structure

        // const characterData: CharacterData = {
        //     name: 'Player1',
        //     avatar: 'avatar1',
        //     attributes: {
        //         speed: { name: 'speed', description: 'Movement speed', baseValue: 10, currentValue: 10 },
        //         life: { name: 'life', description: 'Health points', baseValue: 100, currentValue: 100 },
        //     },
        // };

        sessionsService.addPlayerToSession(sessionsService.getSession(sessionCode)!, mockSocket as Socket, 'Player1', characterData);

        const result = sessionsService.validateCharacterCreation(sessionCode, characterData, mockServer as Server);
        expect(result.error).toBe('Avatar déjà pris.');
    });

    it('should return error if session is full', () => {
        const sessionCode = sessionsService.createNewSession('client1', 1, 'game1', 'Classique');
        // Updated characterData with full Attribute structure

        // const characterData: CharacterData = {
        //     name: 'Player1',
        //     avatar: 'avatar1',
        //     attributes: {
        //         speed: { name: 'speed', description: 'Movement speed', baseValue: 10, currentValue: 10 },
        //         life: { name: 'life', description: 'Health points', baseValue: 100, currentValue: 100 },
        //     },
        // };

        sessionsService.addPlayerToSession(sessionsService.getSession(sessionCode)!, mockSocket as Socket, 'Player1', characterData);

        const result = sessionsService.validateCharacterCreation(
            sessionCode,
            { name: 'Player2', avatar: 'avatar2', attributes: characterData.attributes },
            mockServer as Server,
        );
        expect(result.error).toBe('Le nombre maximum de joueurs est atteint.');
    });

    it('should add a player to session', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        // Updated characterData with full Attribute structure

        // const characterData: CharacterData = {
        //     name: 'Player1',
        //     avatar: 'avatar1',
        //     attributes: {
        //         speed: { name: 'speed', description: 'Movement speed', baseValue: 10, currentValue: 10 },
        //         life: { name: 'life', description: 'Health points', baseValue: 100, currentValue: 100 },
        //     },
        // };

        const session = sessionsService.getSession(sessionCode)!;
        sessionsService.addPlayerToSession(session, mockSocket as Socket, 'Player1', characterData);

        expect(session.players.length).toBe(1);
        expect(session.players[0].name).toBe('Player1');
        expect(session.players[0].socketId).toBe(mockSocket.id);
    });

    // it('should remove a player from session', () => {
    //     const sessionCode = sessionsService.createNewSession('client1', 4, 'game1');
    //     const session = sessionsService.getSession(sessionCode)!;

    //     sessionsService.addPlayerToSession(session, mockSocket as Socket, 'Player1', {
    //         name: 'Player1',
    //         avatar: 'avatar1',
    //         attributes: {
    //             speed: { name: 'speed', description: 'Movement speed', baseValue: 10, currentValue: 10 },
    //             life: { name: 'life', description: 'Health points', baseValue: 100, currentValue: 100 },
    //         },
    //     });

    //     const removed = sessionsService.removePlayerFromSession("client1", mockSocket.id, mockServer as Server);
    //     expect(removed).toBe(true);
    //     expect(session.players.length).toBe(0);
    // });

    it('should toggle session lock', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        const session = sessionsService.getSession(sessionCode)!;

        sessionsService.toggleSessionLock(session, true);
        expect(session.locked).toBe(true);

        sessionsService.toggleSessionLock(session, false);
        expect(session.locked).toBe(false);
    });

    it('should update session grid', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        const newGrid = [[{ images: [], isOccuped: false }]];
        sessionsService.updateSessionGrid(sessionCode, newGrid);

        const session = sessionsService.getSession(sessionCode);
        expect(session?.grid).toEqual(newGrid);
    });

    it('should terminate a session', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        sessionsService.terminateSession(sessionCode);
        expect(sessionsService.getSession(sessionCode)).toBeUndefined();
    });

    it('should return a unique player name with suffix if name is taken', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        const session = sessionsService.getSession(sessionCode)!;

        sessionsService.addPlayerToSession(session, mockSocket as Socket, 'Player1', characterData);

        const uniqueName = sessionsService.validateCharacterCreation(
            sessionCode,
            { name: 'Player1', avatar: 'avatar2', attributes: characterData.attributes },
            mockServer as Server,
        ).finalName;
        expect(uniqueName).toBe('Player1-2');
    });

    it('should lock and emit room lock status if session is full', () => {
        const sessionCode = sessionsService.createNewSession('client1', 1, 'game1', 'Classique');
        sessionsService.addPlayerToSession(sessionsService.getSession(sessionCode)!, mockSocket as Socket, 'Player1', characterData);

        const result = sessionsService.validateCharacterCreation(
            sessionCode,
            { name: 'Player2', avatar: 'avatar2', attributes: characterData.attributes },
            mockServer as Server,
        );
        expect(result.error).toBe('Le nombre maximum de joueurs est atteint.');
        expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
        expect(mockServer.emit).toHaveBeenCalledWith('roomLocked', { locked: true });
    });

    // it('should return false if removing a player not found in session', () => {
    //     const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
    //     const session = sessionsService.getSession(sessionCode)!;

    //     const result = sessionsService.removePlayerFromSession(session, 'nonExistentSocketId');
    //     expect(result).toBe(false);
    //     expect(session.players.length).toBe(0);
    // });

    it('should update session grid', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        const newGrid = [[{ images: ['image1.png'], isOccuped: false }]];

        sessionsService.updateSessionGrid(sessionCode, newGrid);
        const session = sessionsService.getSession(sessionCode);
        expect(session?.grid).toEqual(newGrid);
    });

    it('should assign a unique name if desired name is taken', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        const session = sessionsService.getSession(sessionCode)!;
        sessionsService.addPlayerToSession(session, mockSocket as Socket, 'Player1', characterData);

        const uniqueName = sessionsService.validateCharacterCreation(
            sessionCode,
            { name: 'Player1', avatar: 'avatar2', attributes: characterData.attributes },
            mockServer as Server,
        ).finalName;
        expect(uniqueName).toBe('Player1-2');
    });

    it('should not create a new session if code already exists', () => {
        jest.spyOn(sessionsService, 'generateUniqueSessionCode').mockReturnValue('existingCode');
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        const result = sessionsService.getSession(sessionCode);
        expect(result).toBeDefined();
        expect(result?.organizerId).toBe('client1');
    });
    it('should calculate turn order using TurnService', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        const session = sessionsService.getSession(sessionCode)!;
        sessionsService.calculateTurnOrder(session);
        expect(mockTurnService.calculateTurnOrder).toHaveBeenCalledWith(session);
    });

    it('should start a turn using TurnService', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        sessionsService.startTurn(sessionCode, mockServer as Server);
        expect(mockTurnService.startTurn).toHaveBeenCalledWith(sessionCode, mockServer, sessionsService['sessions']);
    });

    it('should end a turn using TurnService', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        sessionsService.endTurn(sessionCode, mockServer as Server);
        expect(mockTurnService.endTurn).toHaveBeenCalledWith(sessionCode, mockServer, sessionsService['sessions']);
    });

    it('should find a player by socket ID', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        const session = sessionsService.getSession(sessionCode)!;
        sessionsService.addPlayerToSession(session, mockSocket as Socket, 'Player1', characterData);

        const foundPlayer = sessionsService.findPlayerBySocketId(session, 'socket1');
        expect(foundPlayer).toBeDefined();
        expect(foundPlayer?.name).toBe('Player1');

        const notFoundPlayer = sessionsService.findPlayerBySocketId(session, 'nonexistentSocket');
        expect(notFoundPlayer).toBeUndefined();
    });

    it('should return error if validateCharacterCreation is called with missing sessionCode or session', () => {
        const result = sessionsService.validateCharacterCreation('', characterData, mockServer as Server);
        expect(result.error).toBe('Session introuvable ou code de session manquant.');

        const resultWithInvalidSessionCode = sessionsService.validateCharacterCreation('invalidCode', characterData, mockServer as Server);
        expect(resultWithInvalidSessionCode.error).toBe('Session introuvable ou code de session manquant.');
    });

    it('should return taken avatars in session', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        const session = sessionsService.getSession(sessionCode)!;
        sessionsService.addPlayerToSession(session, mockSocket as Socket, 'Player1', characterData);

        const takenAvatars = sessionsService.getTakenAvatars(session);
        expect(takenAvatars).toEqual(['avatar1']);
    });

    it('should correctly identify the session organizer', () => {
        const sessionCode = sessionsService.createNewSession('client1', 4, 'game1', 'Classique');
        const session = sessionsService.getSession(sessionCode)!;

        const isOrganizer = sessionsService.isOrganizer(session, 'client1');
        expect(isOrganizer).toBe(true);

        const isNotOrganizer = sessionsService.isOrganizer(session, 'client2');
        expect(isNotOrganizer).toBe(false);
    });
});
