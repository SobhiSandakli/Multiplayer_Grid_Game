/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-lines */
import { Test, TestingModule } from '@nestjs/testing';
import { SessionsGateway } from './sessions.gateway';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { Server, Socket } from 'socket.io';
import { CharacterCreationData } from '@app/interfaces/character-creation-data/character-creation-data.interface';
import { Session } from '@app/interfaces/session/session.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { GridCell } from '@app/interfaces/session/grid.interface';
import { TurnData } from '@app/interfaces/session/turn-data.interface';
import { CombatData } from '@app/interfaces/session/combat-data.interface';

// Définition de l'interface pour le résultat de validation
interface ValidateCharacterCreationResult {
    error?: string;
    session?: Session;
    finalName?: string;
    gameId?: string;
}

describe('SessionsGateway', () => {
    let gateway: SessionsGateway;
    let sessionsService: SessionsService;
    let eventsGateway: EventsGateway;
    let server: Server;
    let clientSocket: Socket;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionsGateway,
                {
                    provide: SessionsService,
                    useValue: {
                        getSession: jest.fn(),
                        createNewSession: jest.fn(),
                        validateCharacterCreation: jest.fn(),
                        addPlayerToSession: jest.fn(),
                        removePlayerFromSession: jest.fn(),
                        isOrganizer: jest.fn(),
                        terminateSession: jest.fn(),
                        toggleSessionLock: jest.fn(),
                        getTakenAvatars: jest.fn(),
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

        gateway = module.get<SessionsGateway>(SessionsGateway);
        sessionsService = module.get<SessionsService>(SessionsService);
        eventsGateway = module.get<EventsGateway>(EventsGateway);

        // Mock du serveur et du client Socket
        server = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            sockets: {
                sockets: new Map(),
            },
        } as unknown as Server;

        clientSocket = {
            id: 'client-socket-id',
            join: jest.fn(),
            leave: jest.fn(),
            emit: jest.fn(),
        } as unknown as Socket;

        gateway['server'] = server;
    });

    describe('handleToggleDoorState', () => {
        it("devrait changer l'état de la porte de fermée à ouverte et émettre les mises à jour", () => {
            const data = {
                sessionCode: 'session1',
                row: 0,
                col: 0,
                newState: 'assets/tiles/Door-Open.png',
            };
            const gridCell: GridCell = {
                images: ['assets/tiles/Door.png'],
                isOccuped: false,
            };
            const session: Session = {
                organizerId: 'organizer-id',
                locked: false,
                maxPlayers: 4,
                players: [],
                selectedGameID: 'game123',
                grid: [[gridCell]],
                turnData: {} as TurnData,
                combatData: {} as CombatData,
            };

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(session);

            gateway.handleToggleDoorState(clientSocket, data);

            expect(server.to).toHaveBeenCalledWith('session1');
            expect(server.emit).toHaveBeenCalledWith('doorStateUpdated', {
                row: 0,
                col: 0,
                newState: 'assets/tiles/Door-Open.png',
            });
            expect(eventsGateway.addEventToSession).toHaveBeenCalledWith('session1', 'Overture de la porte à la ligne 0 colonne 0', ['everyone']);
            expect(session.grid[0][0].images[0]).toBe('assets/tiles/Door-Open.png');
        });

        it("devrait changer l'état de la porte de ouverte à fermée et émettre les mises à jour", () => {
            const data = {
                sessionCode: 'session1',
                row: 0,
                col: 0,
                newState: 'assets/tiles/Door.png',
            };
            const gridCell: GridCell = {
                images: ['assets/tiles/Door-Open.png'],
                isOccuped: false,
            };
            const session: Session = {
                organizerId: 'organizer-id',
                locked: false,
                maxPlayers: 4,
                players: [],
                selectedGameID: 'game123',
                grid: [[gridCell]],
                turnData: {} as TurnData,
                combatData: {} as CombatData,
            };

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(session);

            gateway.handleToggleDoorState(clientSocket, data);

            expect(server.to).toHaveBeenCalledWith('session1');
            expect(server.emit).toHaveBeenCalledWith('doorStateUpdated', {
                row: 0,
                col: 0,
                newState: 'assets/tiles/Door.png',
            });
            expect(eventsGateway.addEventToSession).toHaveBeenCalledWith('session1', 'Fermeture de la porte à la ligne 0 colonne 0', ['everyone']);
            expect(session.grid[0][0].images[0]).toBe('assets/tiles/Door.png');
        });

        it("ne devrait rien faire si la session n'existe pas", () => {
            jest.spyOn(sessionsService, 'getSession').mockReturnValue(undefined);
            const data = {
                sessionCode: 'session1',
                row: 0,
                col: 0,
                newState: 'assets/tiles/Door-Open.png',
            };

            gateway.handleToggleDoorState(clientSocket, data);

            expect(sessionsService.getSession).toHaveBeenCalledWith('session1');
            expect(server.to).not.toHaveBeenCalled();
            expect(server.emit).not.toHaveBeenCalled();
            expect(eventsGateway.addEventToSession).not.toHaveBeenCalled();
        });
    });

    describe('handleCreateNewSession', () => {
        it('devrait créer une nouvelle session et émettre "sessionCreated"', () => {
            const data = { maxPlayers: 4, selectedGameID: 'game123' };
            const sessionCode = 'sessionCode123';

            jest.spyOn(sessionsService, 'createNewSession').mockReturnValue(sessionCode);

            gateway.handleCreateNewSession(clientSocket, data);

            expect(sessionsService.createNewSession).toHaveBeenCalledWith('client-socket-id', 4, 'game123');
            expect(clientSocket.join).toHaveBeenCalledWith(sessionCode);
            expect(clientSocket.emit).toHaveBeenCalledWith('sessionCreated', { sessionCode });
        });
    });

    describe('handleCreateCharacter', () => {
        let mockServerEmit: jest.Mock;
        let mockServerTo: jest.Mock;

        beforeEach(() => {
            // Réinitialiser les mocks avant chaque test
            mockServerEmit = jest.fn();
            mockServerTo = jest.fn().mockReturnValue({ emit: mockServerEmit });
            server.to = mockServerTo;
        });

        it('devrait créer un personnage et émettre "characterCreated"', () => {
            const data: CharacterCreationData = {
                sessionCode: 'session1',
                characterData: {
                    name: 'John',
                    avatar: 'avatar1',
                    attributes: {
                        strength: {
                            name: 'strength',
                            baseValue: 10,
                            currentValue: 10,
                            description: 'Force',
                        },
                    },
                },
            };

            const session: Session = {
                organizerId: 'organizer-id',
                locked: false,
                maxPlayers: 4,
                players: [],
                selectedGameID: 'game123',
                grid: [],
                turnData: {} as TurnData,
                combatData: {} as CombatData,
            };

            const validationResult: ValidateCharacterCreationResult = {
                session,
                finalName: 'John',
                gameId: 'game123',
            };

            jest.spyOn(sessionsService, 'validateCharacterCreation').mockReturnValue(validationResult);
            jest.spyOn(sessionsService, 'addPlayerToSession').mockImplementation((sess, client, name, charData) => {
                sess.players.push({
                    socketId: client.id,
                    name,
                    avatar: charData.avatar,
                    attributes: charData.attributes,
                    isOrganizer: false,
                    position: { row: 0, col: 0 },
                    accessibleTiles: [],
                    inventory: [],
                    isVirtual: false,
                });
            });

            gateway.handleCreateCharacter(clientSocket, data);

            expect(sessionsService.validateCharacterCreation).toHaveBeenCalledWith('session1', data.characterData, server);
            expect(sessionsService.addPlayerToSession).toHaveBeenCalledWith(session, clientSocket, 'John', data.characterData);
            expect(clientSocket.join).toHaveBeenCalledWith('session1');
            expect(clientSocket.emit).toHaveBeenCalledWith('characterCreated', {
                name: 'John',
                sessionCode: 'session1',
                gameId: 'game123',
                attributes: data.characterData.attributes,
            });
            expect(mockServerTo).toHaveBeenCalledWith('session1');
            expect(mockServerEmit).toHaveBeenCalledWith('playerListUpdate', { players: session.players });
        });

        it('ne devrait rien faire si la validation échoue avec une erreur', () => {
            const data: CharacterCreationData = {
                sessionCode: 'session1',
                characterData: {
                    name: 'John',
                    avatar: 'avatar1',
                    attributes: {
                        strength: {
                            name: 'strength',
                            baseValue: 10,
                            currentValue: 10,
                            description: 'Force',
                        },
                    },
                },
            };

            const validationResult: ValidateCharacterCreationResult = {
                error: 'Nom déjà utilisé',
            };

            jest.spyOn(sessionsService, 'validateCharacterCreation').mockReturnValue(validationResult);
            jest.spyOn(sessionsService, 'addPlayerToSession');

            gateway.handleCreateCharacter(clientSocket, data);

            expect(sessionsService.validateCharacterCreation).toHaveBeenCalledWith('session1', data.characterData, server);
            expect(sessionsService.addPlayerToSession).not.toHaveBeenCalled();
            expect(clientSocket.join).not.toHaveBeenCalled();
            expect(clientSocket.emit).not.toHaveBeenCalledWith('characterCreated', expect.anything());
            expect(mockServerTo).not.toHaveBeenCalled();
            expect(mockServerEmit).not.toHaveBeenCalled();
        });
    });

    describe('handleGetTakenAvatars', () => {
        it('devrait émettre les avatars pris si la session existe', () => {
            const data = { sessionCode: 'session1' };
            const player1: Player = {
                socketId: 'socket1',
                name: 'Alice',
                avatar: 'avatar1',
                attributes: {},
                isOrganizer: false,
                position: { row: 0, col: 0 },
                accessibleTiles: [],
                inventory: [],
                isVirtual: false,
            };
            const player2: Player = {
                socketId: 'socket2',
                name: 'Bob',
                avatar: 'avatar2',
                attributes: {},
                isOrganizer: false,
                position: { row: 1, col: 1 },
                accessibleTiles: [],
                inventory: [],
                isVirtual: false,
            };
            const session: Session = {
                organizerId: 'organizer-id',
                locked: false,
                maxPlayers: 4,
                players: [player1, player2],
                selectedGameID: 'game123',
                grid: [],
                turnData: {} as TurnData,
                combatData: {} as CombatData,
            };
            const takenAvatars = ['avatar1', 'avatar2'];

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(session);
            jest.spyOn(sessionsService, 'getTakenAvatars').mockReturnValue(takenAvatars);

            gateway.handleGetTakenAvatars(clientSocket, data);

            expect(clientSocket.emit).toHaveBeenCalledWith('takenAvatars', { takenAvatars, players: session.players });
        });

        it("ne devrait rien faire si la session n'existe pas", () => {
            const data = { sessionCode: 'session1' };

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(undefined);

            gateway.handleGetTakenAvatars(clientSocket, data);

            expect(clientSocket.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleDeleteSession', () => {
        it("devrait supprimer la session si le client est l'organisateur", () => {
            const data = { sessionCode: 'session1' };
            const session: Session = {
                organizerId: 'client-socket-id',
                locked: false,
                maxPlayers: 4,
                players: [],
                selectedGameID: 'game123',
                grid: [],
                turnData: {} as TurnData,
                combatData: {} as CombatData,
            };

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(session);
            jest.spyOn(sessionsService, 'terminateSession');

            gateway.handleDeleteSession(clientSocket, data);

            expect(sessionsService.terminateSession).toHaveBeenCalledWith('session1');
            expect(server.to).toHaveBeenCalledWith('session1');
            expect(server.emit).toHaveBeenCalledWith('sessionDeleted', {
                message: "La session a été supprimée par l'organisateur.",
            });
        });

        it("ne devrait rien faire si le client n'est pas l'organisateur", () => {
            const data = { sessionCode: 'session1' };
            const session: Session = {
                organizerId: 'other-client-id',
                locked: false,
                maxPlayers: 4,
                players: [],
                selectedGameID: 'game123',
                grid: [],
                turnData: {} as TurnData,
                combatData: {} as CombatData,
            };

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(session);

            gateway.handleDeleteSession(clientSocket, data);

            expect(sessionsService.terminateSession).not.toHaveBeenCalled();
            expect(server.to).not.toHaveBeenCalled();
            expect(server.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleLeaveSession', () => {
        it('devrait permettre au joueur de quitter la session et émettre les mises à jour', () => {
            const data = { sessionCode: 'session1' };
            const session: Session = {
                organizerId: 'other-client-id',
                locked: false,
                maxPlayers: 4,
                players: [],
                selectedGameID: 'game123',
                grid: [],
                turnData: {} as TurnData,
                combatData: {} as CombatData,
            };

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(session);
            jest.spyOn(sessionsService, 'removePlayerFromSession').mockReturnValue(true);
            jest.spyOn(sessionsService, 'isOrganizer').mockReturnValue(false);

            gateway.handleLeaveSession(clientSocket, data);

            expect(sessionsService.removePlayerFromSession).toHaveBeenCalled();
            expect(clientSocket.leave).toHaveBeenCalledWith('session1');
            expect(server.to).toHaveBeenCalledWith('session1');
            expect(server.emit).toHaveBeenCalledWith('playerListUpdate', { players: session.players });
            expect(server.emit).toHaveBeenCalledWith('gridArray', {
                sessionCode: 'session1',
                grid: session.grid,
            });
        });

        it("devrait terminer la session si l'organisateur quitte", () => {
            const data = { sessionCode: 'session1' };
            const session: Session = {
                organizerId: 'client-socket-id',
                locked: false,
                maxPlayers: 4,
                players: [],
                selectedGameID: 'game123',
                grid: [],
                turnData: {} as TurnData,
                combatData: {} as CombatData,
            };

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(session);
            jest.spyOn(sessionsService, 'removePlayerFromSession').mockReturnValue(true);
            jest.spyOn(sessionsService, 'isOrganizer').mockReturnValue(true);
            jest.spyOn(sessionsService, 'terminateSession');

            gateway.handleLeaveSession(clientSocket, data);

            expect(sessionsService.terminateSession).toHaveBeenCalledWith('session1');
            expect(server.to).toHaveBeenCalledWith('session1');
            expect(server.emit).toHaveBeenCalledWith('sessionDeleted', {
                message: "L'organisateur a quitté la session, elle est terminée.",
            });
        });

        it("ne devrait rien faire si la session n'existe pas", () => {
            const data = { sessionCode: 'session1' };

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(undefined);

            gateway.handleLeaveSession(clientSocket, data);

            expect(sessionsService.removePlayerFromSession).not.toHaveBeenCalled();
            expect(clientSocket.leave).not.toHaveBeenCalled();
        });
    });

    describe('handleExcludePlayer', () => {
        it('devrait exclure un joueur et émettre les mises à jour', () => {
            const data = { sessionCode: 'session1', playerSocketId: 'excluded-client-id' };
            const player: Player = {
                socketId: 'excluded-client-id',
                name: 'Eve',
                avatar: 'avatar3',
                attributes: {},
                isOrganizer: false,
                position: { row: 2, col: 2 },
                accessibleTiles: [],
                inventory: [],
                isVirtual: false,
            };
            const session: Session = {
                organizerId: 'organizer-id',
                locked: false,
                maxPlayers: 4,
                players: [player],
                selectedGameID: 'game123',
                grid: [],
                turnData: {} as TurnData,
                combatData: {} as CombatData,
            };

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(session);

            const excludedClient = {
                id: 'excluded-client-id',
                leave: jest.fn(),
                emit: jest.fn(),
            } as unknown as Socket;

            server.sockets.sockets.set('excluded-client-id', excludedClient);

            gateway.handleExcludePlayer(clientSocket, data);

            expect(sessionsService.removePlayerFromSession).toHaveBeenCalled();
            expect(session.players).toHaveLength(1);
            expect(server.to).toHaveBeenCalledWith('session1');
            expect(server.emit).toHaveBeenCalledWith('playerListUpdate', { players: session.players });
            expect(excludedClient.leave).toHaveBeenCalledWith('session1');
            expect(excludedClient.emit).toHaveBeenCalledWith('excluded', { message: 'Vous avez été exclu de la session.' });
        });

        it("ne devrait rien faire si la session n'existe pas", () => {
            const data = { sessionCode: 'session1', playerSocketId: 'excluded-client-id' };

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(undefined);

            gateway.handleExcludePlayer(clientSocket, data);

            expect(sessionsService.removePlayerFromSession).not.toHaveBeenCalled();
        });
    });

    describe('handleToggleLock', () => {
        it('devrait changer l\'état de verrouillage de la session et émettre "roomLocked"', () => {
            const data = { sessionCode: 'session1', lock: true };
            const session: Session = {
                organizerId: 'organizer-id',
                locked: false,
                maxPlayers: 4,
                players: [],
                selectedGameID: 'game123',
                grid: [],
                turnData: {} as TurnData,
                combatData: {} as CombatData,
            };

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(session);
            jest.spyOn(sessionsService, 'toggleSessionLock').mockImplementation((sess, lock) => {
                sess.locked = lock;
            });

            gateway.handleToggleLock(clientSocket, data);

            expect(sessionsService.toggleSessionLock).toHaveBeenCalledWith(session, true);
            expect(server.to).toHaveBeenCalledWith('session1');
            expect(server.emit).toHaveBeenCalledWith('roomLocked', { locked: true });
            expect(session.locked).toBe(true);
        });

        it("ne devrait rien faire si la session n'existe pas", () => {
            const data = { sessionCode: 'session1', lock: true };

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(undefined);

            gateway.handleToggleLock(clientSocket, data);

            expect(sessionsService.toggleSessionLock).not.toHaveBeenCalled();
        });
    });

    describe('handleDisconnect', () => {
        it('devrait gérer la déconnexion du client et mettre à jour les sessions', () => {
            const sessionCode = 'session1';
            const session: Session = {
                organizerId: 'client-socket-id',
                locked: false,
                maxPlayers: 4,
                players: [],
                selectedGameID: 'game123',
                grid: [],
                turnData: {} as TurnData,
                combatData: {} as CombatData,
            };

            sessionsService['sessions'] = {
                [sessionCode]: session,
            };

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(session);
            jest.spyOn(sessionsService, 'removePlayerFromSession').mockReturnValue(true);
            jest.spyOn(sessionsService, 'isOrganizer').mockReturnValue(true);
            jest.spyOn(sessionsService, 'terminateSession');

            gateway.handleDisconnect(clientSocket);

            expect(sessionsService.terminateSession).toHaveBeenCalledWith(sessionCode);
            expect(server.to).toHaveBeenCalledWith(sessionCode);
            expect(server.emit).toHaveBeenCalledWith('sessionDeleted', {
                message: "L'organisateur a quitté la session, elle est terminée.",
            });
        });

        it("devrait mettre à jour la liste des joueurs si le client n'est pas l'organisateur", () => {
            const sessionCode = 'session1';
            const session: Session = {
                organizerId: 'other-client-id',
                locked: false,
                maxPlayers: 4,
                players: [],
                selectedGameID: 'game123',
                grid: [],
                turnData: {} as TurnData,
                combatData: {} as CombatData,
            };

            sessionsService['sessions'] = {
                [sessionCode]: session,
            };

            jest.spyOn(sessionsService, 'getSession').mockReturnValue(session);
            jest.spyOn(sessionsService, 'removePlayerFromSession').mockReturnValue(true);
            jest.spyOn(sessionsService, 'isOrganizer').mockReturnValue(false);

            gateway.handleDisconnect(clientSocket);

            expect(sessionsService.terminateSession).not.toHaveBeenCalled();
            expect(server.to).toHaveBeenCalledWith(sessionCode);
            expect(server.emit).toHaveBeenCalledWith('playerListUpdate', { players: session.players });
        });
    });
});
