/* eslint-disable  */
// sessions.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { TurnService } from '@app/services/turn/turn.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { CombatService } from '@app/services/combat/combat.service';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { Server, Socket } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { CharacterData } from '@app/interfaces/character-data/character-data.interface';
import { GridCell } from '@app/interfaces/session/grid.interface';
import { AVATARS, INITIAL_ATTRIBUTES } from '@app/constants/avatars-constants';
import { COMBAT_WIN_THRESHOLD, DELAY_BEFORE_NEXT_TURN } from '@app/constants/session-gateway-constants';
import { VIRTUAL_PLAYER_NAMES } from '@app/constants/virtual-players-name.constants';
import { forwardRef } from '@nestjs/common';
import { ObjectsImages } from '@app/constants/objects-enums-constants';

describe('SessionsService', () => {
    let service: SessionsService;
    let turnService: TurnService;
    let changeGridService: ChangeGridService;
    let combatService: CombatService;
    let eventsGateway: EventsGateway;
    let mockServer: Server;
    let mockSocket: Socket;

    // Declare 'player' and 'session' variables
    let player: Player;
    let session: Session;

    beforeEach(async () => {
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as unknown as Server;

        mockSocket = {
            id: 'socket1',
            emit: jest.fn(),
            join: jest.fn(),
        } as unknown as Socket;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionsService,
                {
                    provide: TurnService,
                    useValue: {
                        calculateTurnOrder: jest.fn(),
                        startTurn: jest.fn(),
                        endTurn: jest.fn(),
                    },
                },
                {
                    provide: ChangeGridService,
                    useValue: {
                        removePlayerAvatar: jest.fn(),
                        addItemsToGrid: jest.fn(),
                        findNearestTerrainTiles: jest.fn(),
                    },
                },
                {
                    provide: CombatService,
                    useValue: {
                        finalizeCombat: jest.fn(),
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

        service = module.get<SessionsService>(SessionsService);
        turnService = module.get<TurnService>(TurnService);
        changeGridService = module.get<ChangeGridService>(ChangeGridService);
        combatService = module.get<CombatService>(CombatService);
        eventsGateway = module.get<EventsGateway>(EventsGateway);

        // Mock implementations
        jest.spyOn(changeGridService, 'findNearestTerrainTiles').mockImplementation();
        jest.spyOn(changeGridService, 'addItemsToGrid').mockImplementation();
        jest.spyOn(changeGridService, 'removePlayerAvatar').mockImplementation();
        jest.spyOn(eventsGateway, 'addEventToSession').mockImplementation();

        // Initialize 'player' and 'session' before each test
        player = {
            socketId: 'socket1',
            name: 'Player1',
            position: { row: 0, col: 0 },
            inventory: [],
            attributes: {},
            statistics: {
                combats: 0,
                evasions: 0,
                victories: 0,
                defeats: 0,
                totalLifeLost: 0,
                totalLifeRemoved: 0,
                uniqueItems: new Set(),
                tilesVisited: new Set(),
                uniqueItemsArray: [],
                tilesVisitedArray: [],
            },
        } as unknown as Player;

        session = {
            organizerId: 'socket1',
            locked: false,
            maxPlayers: 4,
            players: [player],
            selectedGameID: 'game1',
            grid: [[{} as GridCell]],
            turnData: {
                turnOrder: ['socket1'],
                currentTurnIndex: 0,
                currentPlayerSocketId: 'socket1',
                turnTimer: null,
                timeLeft: 0,
            },
            combatData: {
                combatants: [],
                turnIndex: 0,
                turnTimer: null,
                timeLeft: 0,
                lastAttackResult: null,
            },
            ctf: false,
            statistics: {
                gameDuration: '00:00',
                totalTurns: 0,
                totalTerrainTiles: 0,
                visitedTerrains: new Set(),
                totalDoors: 0,
                manipulatedDoors: new Set(),
                uniqueFlagHolders: new Set(),
                visitedTerrainsArray: [],
                manipulatedDoorsArray: [],
                uniqueFlagHoldersArray: [],
                startTime: new Date(),
                endTime: new Date(),
            },
            abandonedPlayers: [],
        } as unknown as Session;

        service['sessions'] = { sessionCode: session };
    });

    describe('calculateTurnOrder', () => {
        it('should call turnService.calculateTurnOrder', () => {
            const session = {} as Session;
            service.calculateTurnOrder(session, 'sessionCode', mockServer);
            expect(turnService.calculateTurnOrder).toHaveBeenCalledWith(session, 'sessionCode', mockServer);
        });
    });

    describe('startTurn', () => {
        it('should call turnService.startTurn', () => {
            service['sessions'] = { sessionCode: {} as Session };
            service.startTurn('sessionCode', mockServer);
            expect(turnService.startTurn).toHaveBeenCalledWith('sessionCode', mockServer, service['sessions']);
        });
    });

    describe('endTurn', () => {
        it('should call turnService.endTurn', () => {
            service['sessions'] = { sessionCode: {} as Session };
            service.endTurn('sessionCode', mockServer);
            expect(turnService.endTurn).toHaveBeenCalledWith('sessionCode', mockServer, service['sessions']);
        });
    });

    describe('sendTimeLeft', () => {
        it('should emit timeLeft event if session exists', () => {
            const session = {
                turnData: { timeLeft: 30, currentPlayerSocketId: 'socketId' },
            } as Session;
            service['sessions'] = { sessionCode: session };
            service.sendTimeLeft('sessionCode', mockServer);
            expect(mockServer.to).toHaveBeenCalledWith('sessionCode');
            expect(mockServer.emit).toHaveBeenCalledWith('timeLeft', {
                timeLeft: 30,
                playerSocketId: 'socketId',
            });
        });

        it('should return if session does not exist', () => {
            service['sessions'] = {};
            service.sendTimeLeft('sessionCode', mockServer);
            expect(mockServer.to).not.toHaveBeenCalled();
        });
    });

    describe('findPlayerBySocketId', () => {
        it('should return player if found', () => {
            const player = { socketId: 'socket1' } as Player;
            const session = { players: [player] } as Session;
            const result = service.findPlayerBySocketId(session, 'socket1');
            expect(result).toBe(player);
        });

        it('should return undefined if player not found', () => {
            const player = { socketId: 'socket1' } as Player;
            const session = { players: [player] } as Session;
            const result = service.findPlayerBySocketId(session, 'socket2');
            expect(result).toBeUndefined();
        });
    });

    describe('getSession', () => {
        it('should return session if exists', () => {
            const session = {} as Session;
            service['sessions'] = { sessionCode: session };
            const result = service.getSession('sessionCode');
            expect(result).toBe(session);
        });

        it('should return undefined if session does not exist', () => {
            service['sessions'] = {};
            const result = service.getSession('sessionCode');
            expect(result).toBeUndefined();
        });
    });

    describe('generateUniqueSessionCode', () => {
        it('should generate unique session code', () => {
            service['sessions'] = {};
            const code = service.generateUniqueSessionCode();
            expect(code).toBeDefined();
        });

        it('should avoid duplicate codes', () => {
            service['sessions'] = { '1234': {} as Session };
            jest.spyOn(Math, 'random').mockReturnValue(0);
            const code = service.generateUniqueSessionCode();
            expect(code).not.toBe('1234');
        });
    });

    describe('createNewSession', () => {
        it('should create a new session and return its code', () => {
            jest.spyOn(service, 'generateUniqueSessionCode').mockReturnValue('sessionCode');
            const code = service.createNewSession('clientId', 4, 'gameId', 'Classique');
            expect(code).toBe('sessionCode');
            expect(service['sessions']['sessionCode']).toBeDefined();
        });
    });

    describe('validateCharacterCreation', () => {
        let session: Session;
        let characterData: CharacterData;

        beforeEach(() => {
            characterData = {
                name: 'Player1',
                avatar: 'avatar1',
                attributes: INITIAL_ATTRIBUTES,
            };

            session = {
                players: [],
                maxPlayers: 4,
                selectedGameID: 'gameId',
                locked: false,
            } as unknown as Session;

            service['sessions'] = { sessionCode: session };
        });

        it('should return error if sessionCode is invalid', () => {
            const result = service.validateCharacterCreation('', characterData, mockServer);
            expect(result.error).toBe('Session introuvable ou code de session manquant.');
        });

        it('should return error if session not found', () => {
            const result = service.validateCharacterCreation('invalidCode', characterData, mockServer);
            expect(result.error).toBe('Session introuvable ou code de session manquant.');
        });

        it('should return error if avatar is taken', () => {
            session.players.push({ avatar: 'avatar1' } as Player);
            const result = service.validateCharacterCreation('sessionCode', characterData, mockServer);
            expect(result.error).toBe('Avatar déjà pris.');
        });

        it('should return error if session is full', () => {
            session.players = [{}, {}, {}, {}] as Player[];
            const result = service.validateCharacterCreation('sessionCode', characterData, mockServer);
            expect(result.error).toBe('Le nombre maximum de joueurs est atteint.');
            expect(session.locked).toBe(true);
            expect(mockServer.to).toHaveBeenCalledWith('sessionCode');
            expect(mockServer.emit).toHaveBeenCalledWith('roomLocked', { locked: true });
        });

        it('should return session, finalName, and gameId on success', () => {
            const result = service.validateCharacterCreation('sessionCode', characterData, mockServer);
            expect(result.session).toBe(session);
            expect(result.finalName).toBe('Player1');
            expect(result.gameId).toBe('gameId');
        });
    });

    describe('addPlayerToSession', () => {
        it('should add a new player to the session', () => {
            const session = { players: [] } as unknown as Session;
            const characterData: CharacterData = {
                name: 'Player1',
                avatar: 'avatar1',
                attributes: INITIAL_ATTRIBUTES,
            };

            service.addPlayerToSession(session, mockSocket, 'Player1', characterData);

            expect(session.players.length).toBe(1);
            expect(session.players[0].name).toBe('Player1');
            expect(session.players[0].socketId).toBe('socket1');
        });

        it('should set isOrganizer to true for first player', () => {
            const session = { players: [] } as unknown as Session;
            const characterData: CharacterData = {
                name: 'Player1',
                avatar: 'avatar1',
                attributes: INITIAL_ATTRIBUTES,
            };

            service.addPlayerToSession(session, mockSocket, 'Player1', characterData);

            expect(session.players[0].isOrganizer).toBe(true);
        });
    });

    describe('isSessionFull', () => {
        it('should return true if session is full', () => {
            const session = { players: [{}, {}, {}, {}], maxPlayers: 4 } as Session;
            const result = service.isSessionFull(session);
            expect(result).toBe(true);
        });

        it('should return false if session is not full', () => {
            const session = { players: [{}, {}], maxPlayers: 4 } as Session;
            const result = service.isSessionFull(session);
            expect(result).toBe(false);
        });
    });

    describe('removePlayerFromSession', () => {
        let session: Session;
        let player: Player;

        beforeEach(() => {
            player = {
                socketId: 'socket1',
                name: 'Player1',
                position: { row: 0, col: 0 },
                inventory: [],
                statistics: {
                    uniqueItems: new Set(),
                    tilesVisited: new Set(),
                },
            } as unknown as Player;

            session = {
                players: [player],
                turnData: {
                    turnOrder: ['socket1'],
                    currentPlayerSocketId: 'socket1',
                },
                abandonedPlayers: [],
                grid: [[]],
                combatData: {
                    combatants: [],
                },
            } as unknown as Session;

            service['sessions'] = { sessionCode: session };
        });

        it('should remove player from session', () => {
            const result = service.removePlayerFromSession('socket1', 'sessionCode', mockServer);
            expect(result).toBe(true);
            expect(session.players.length).toBe(0);
            expect(session.abandonedPlayers.length).toBe(1);
            expect(eventsGateway.addEventToSession).toHaveBeenCalledWith('sessionCode', 'Player1 a quitté la session.', ['everyone']);
        });

        it('should end turn if player was current player', () => {
            service.endTurn = jest.fn();
            service.removePlayerFromSession('socket1', 'sessionCode', mockServer);
            expect(service.endTurn).toHaveBeenCalledWith('sessionCode', mockServer);
        });

        it('should call removePlayerFromCombat if player is in combat', () => {
            session.combatData.combatants.push(player);
            service.removePlayerFromCombat = jest.fn();
            service.removePlayerFromSession('socket1', 'sessionCode', mockServer);
            expect(service.removePlayerFromCombat).toHaveBeenCalledWith(session, 'socket1', 'sessionCode', mockServer);
        });

        it('should return false if session or player not found', () => {
            const result = service.removePlayerFromSession('socket2', 'sessionCode', mockServer);
            expect(result).toBe(false);
        });

        it('should return false if player is not found in session', () => {
            // Arrange
            const sessionCode = 'sessionCode';
            const clientId = 'nonexistentSocket';
            
            const session = {
              players: [{ socketId: 'socket1' }, { socketId: 'socket2' }],
              turnData: {
                turnOrder: ['socket1', 'socket2'],
                currentPlayerSocketId: 'socket1',
                currentTurnIndex: 0,
              },
              combatData: {
                combatants: [],
              },
              abandonedPlayers: [],
              grid: [[]],
            } as unknown as Session;
        
            // Inject the session into the service's sessions map
            service['sessions'][sessionCode] = session;
        
            // Act
            const result = service.removePlayerFromSession(clientId, sessionCode, mockServer);
        
            // Assert
            expect(result).toBe(false);
            // Ensure that no player was removed
            expect(session.players.length).toBe(2);
            // Ensure that no events were emitted
            expect(eventsGateway.addEventToSession).not.toHaveBeenCalled();
            expect(changeGridService.removePlayerAvatar).not.toHaveBeenCalled();
          });
    });

    describe('removePlayerFromCombat', () => {
        it('should call combatService.finalizeCombat', () => {
            const session = {
                combatData: {
                    combatants: [{ socketId: 'socket1' } as Player, { socketId: 'socket2' } as Player],
                },
            } as unknown as Session;

            service.removePlayerFromCombat(session, 'socket1', 'sessionCode', mockServer);

            expect(combatService.finalizeCombat).toHaveBeenCalledWith(
                'sessionCode',
                { socketId: 'socket2' },
                { socketId: 'socket1' },
                'win',
                mockServer,
            );
        });
    });

    describe('isOrganizer', () => {
        it('should return true if clientId is organizer', () => {
            const session = { organizerId: 'socket1' } as Session;
            const result = service.isOrganizer(session, 'socket1');
            expect(result).toBe(true);
        });

        it('should return false if clientId is not organizer', () => {
            const session = { organizerId: 'socket1' } as Session;
            const result = service.isOrganizer(session, 'socket2');
            expect(result).toBe(false);
        });
    });

    describe('terminateSession', () => {
        it('should delete session from sessions', () => {
            service['sessions'] = { sessionCode: {} as Session };
            service.terminateSession('sessionCode');
            expect(service.getSession('sessionCode')).toBeUndefined();
        });
    });

    describe('toggleSessionLock', () => {
        it('should toggle session lock', () => {
            const session = { locked: false } as Session;
            service.toggleSessionLock(session, true);
            expect(session.locked).toBe(true);
        });
    });

    describe('updateSessionGrid', () => {
        it('should update session grid', () => {
            const session = { grid: [] } as Session;
            service['sessions'] = { sessionCode: session };
            const newGrid = [[{ images: [], isOccuped: false }]];

            service.updateSessionGrid('sessionCode', newGrid);

            expect(session.grid).toBe(newGrid);
        });
    });

    describe('getTakenAvatars', () => {
        it('should return list of taken avatars', () => {
            const session = {
                players: [{ avatar: 'avatar1' }, { avatar: 'avatar2' }],
            } as unknown as Session;
            const result = service.getTakenAvatars(session);
            expect(result).toEqual(['avatar1', 'avatar2']);
        });
    });

    describe('getAvailableAvatars', () => {
        it('should return list of available avatars', () => {
            const session = {
                players: [{ avatar: 'avatar1' }, { avatar: 'avatar2' }],
            } as unknown as Session;
            const result = service.getAvailableAvatars(session);
            expect(result).toEqual(AVATARS.filter((a) => a !== 'avatar1' && a !== 'avatar2'));
        });
    });

    describe('createVirtualPlayer', () => {
        let session: Session;

        beforeEach(() => {
            session = {
                players: [],
                maxPlayers: 4,
            } as unknown as Session;
            service['sessions'] = { sessionCode: session };
        });

        it('should create a virtual player and add to session', () => {
            jest.spyOn(service as any, 'getUniquePlayerName').mockReturnValue('VirtualPlayer');
            jest.spyOn(service as any, 'getRandomAvailableAvatar').mockReturnValue('avatar1');
            jest.spyOn(service as any, 'getCharacterAttributes').mockReturnValue(INITIAL_ATTRIBUTES);
            jest.spyOn(Date, 'now').mockReturnValue(123456789);

            const result = service.createVirtualPlayer('sessionCode', 'Aggressif');

            expect(result.session).toBe(session);
            expect(result.virtualPlayer.name).toBe('VirtualPlayer');
            expect(result.virtualPlayer.isVirtual).toBe(true);
            expect(session.players.length).toBe(1);
        });

        it('should throw error if session not found', () => {
            expect(() => {
                service.createVirtualPlayer('invalidCode', 'Aggressif');
            }).toThrow('Session introuvable.');
        });

        it('should throw error if session is full', () => {
            session.players = [{}, {}, {}, {}] as Player[];
            expect(() => {
                service.createVirtualPlayer('sessionCode', 'Aggressif');
            }).toThrow('La session est déjà pleine.');
        });

        it('should throw error if no available avatar', () => {
            jest.spyOn(service as any, 'getRandomAvailableAvatar').mockReturnValue(null);
            expect(() => {
                service.createVirtualPlayer('sessionCode', 'Aggressif');
            }).toThrow('Aucun avatar disponible.');
        });
    });

    describe('Private Methods', () => {
        describe('getCharacterAttributes', () => {
            it('should return attributes for Aggressif', () => {
                const result = (service as any).getCharacterAttributes('Aggressif');
                expect(result.attack.dice).toBe('D6');
                expect(result.defence.dice).toBe('D4');
            });

            it('should return attributes for Défensif', () => {
                const result = (service as any).getCharacterAttributes('Défensif');
                expect(result.attack.dice).toBe('D4');
                expect(result.defence.dice).toBe('D6');
            });
        });

        describe('getRandomAvailableAvatar', () => {
            it('should return an available avatar', () => {
                const session = {
                    players: [{ avatar: 'avatar1' }],
                } as unknown as Session;
                const result = (service as any).getRandomAvailableAvatar(session);
                expect(result).toBeDefined();
                expect(result).not.toBe('avatar1');
                expect(AVATARS.includes(result)).toBe(true);
            });

            it('should return null if no avatar available', () => {
                const session = {
                    players: AVATARS.map((avatar) => ({ avatar })),
                } as unknown as Session;
                const result = (service as any).getRandomAvailableAvatar(session);
                expect(result).toBeNull();
            });
        });

        describe('createPlayer', () => {
            it('should create a player', () => {
                jest.spyOn(Date, 'now').mockReturnValue(123456789);
                const attributes = INITIAL_ATTRIBUTES;
                const result = (service as any).createPlayer('Player1', 'avatar1', attributes, 'Aggressif');
                expect(result.name).toBe('Player1');
                expect(result.avatar).toBe('avatar1');
                expect(result.isVirtual).toBe(true);
                expect(result.socketId).toBe('virtual-123456789');
            });
        });

        describe('isAvatarTaken', () => {
            it('should return true if avatar is taken', () => {
                const session = {
                    players: [{ avatar: 'avatar1' }],
                } as unknown as Session;
                const result = (service as any).isAvatarTaken(session, 'avatar1');
                expect(result).toBe(true);
            });

            it('should return false if avatar is not taken', () => {
                const session = {
                    players: [{ avatar: 'avatar1' }],
                } as unknown as Session;
                const result = (service as any).isAvatarTaken(session, 'avatar2');
                expect(result).toBe(false);
            });
        });

        describe('removePlayerFromCombat', () => {
            it('should finalize combat with correct winner and loser when player leaves', () => {
                // Arrange
                const winner = { socketId: 'socket2' } as Player;
                const loser = player;
                session.combatData.combatants = [winner, loser];

                // Act
                service.removePlayerFromCombat(session, 'socket1', 'sessionCode', mockServer);

                // Assert
                expect(combatService.finalizeCombat).toHaveBeenCalledWith('sessionCode', winner, loser, 'win', mockServer);
            });

            it('should handle case when there is no other combatant', () => {
                // Arrange
                session.combatData.combatants = [player];

                // Act
                service.removePlayerFromCombat(session, 'socket1', 'sessionCode', mockServer);

                // Assert
                expect(combatService.finalizeCombat).toHaveBeenCalledWith('sessionCode', undefined, player, 'win', mockServer);
            });
        });

        it('should remove player avatar from the grid when removing a player from the session', () => {
            // Act
            service.removePlayerFromSession('socket1', 'sessionCode', mockServer);

            // Assert
            expect(changeGridService.removePlayerAvatar).toHaveBeenCalledWith(session.grid, player);
        });

        it('should handle player inventory when removing a player from the session', () => {
            // Arrange
            const item1 = { name: 'item1' } as unknown as ObjectsImages;
            const item2 = { name: 'item2' } as unknown as ObjectsImages;
            player.inventory = [item1, item2];
          
            jest.spyOn(changeGridService, 'findNearestTerrainTiles').mockReturnValue([
              { row: 1, col: 1 },
              { row: 1, col: 2 },
            ]);
          
            // Act
            service.removePlayerFromSession('socket1', 'sessionCode', mockServer);
          
            // Assert
            expect(player.inventory).toEqual([]);
            expect(changeGridService.findNearestTerrainTiles).toHaveBeenCalledWith(
              player.position,
              session.grid,
              2, // Number of items to drop
            );
            expect(changeGridService.addItemsToGrid).toHaveBeenCalledWith(
              session.grid,
              [
                { row: 1, col: 1 },
                { row: 1, col: 2 },
              ],
              [item1, item2], // Use the actual items (objects) here
            );
            expect(mockServer.to).toHaveBeenCalledWith('sessionCode');
            expect(mockServer.emit).toHaveBeenCalledWith('gridArray', { sessionCode: 'sessionCode', grid: session.grid });
            expect(mockServer.to).toHaveBeenCalledWith('socket1');
            expect(mockServer.emit).toHaveBeenCalledWith('updateInventory', { inventory: [] });
          });

        describe('getUniquePlayerName', () => {
            it('should return unique name if name is not taken', () => {
                const session = {
                    players: [{ name: 'Player1' }],
                } as unknown as Session;
                const result = (service as any).getUniquePlayerName(session, 'Player2');
                expect(result).toBe('Player2');
            });

            it('should append suffix if name is taken', () => {
                const session = {
                    players: [{ name: 'Player1' }],
                } as unknown as Session;
                const result = (service as any).getUniquePlayerName(session, 'Player1');
                expect(result).toBe('Player1-1');
            });

            it('should increment suffix until unique name is found', () => {
                const session = {
                    players: [{ name: 'Player1' }, { name: 'Player1-1' }],
                } as unknown as Session;
                const result = (service as any).getUniquePlayerName(session, 'Player1');
                expect(result).toBe('Player1-2');
            });
        });

        describe('removePlayerFromCombat', () => {
            it('should call finalizeCombat with correct parameters', () => {
                const player1 = { socketId: 'socket1' } as Player;
                const player2 = { socketId: 'socket2' } as Player;
                const session = {
                    combatData: {
                        combatants: [player1, player2],
                    },
                } as unknown as Session;

                service.removePlayerFromCombat(session, 'socket1', 'sessionCode', mockServer);

                expect(combatService.finalizeCombat).toHaveBeenCalledWith('sessionCode', player2, player1, 'win', mockServer);
            });

            it('should handle scenario when no other combatant exists', () => {
                const player1 = { socketId: 'socket1' } as Player;
                const session = {
                    combatData: {
                        combatants: [player1],
                    },
                } as unknown as Session;

                service.removePlayerFromCombat(session, 'socket1', 'sessionCode', mockServer);

                expect(combatService.finalizeCombat).toHaveBeenCalledWith('sessionCode', undefined, player1, 'win', mockServer);
            });
        });
        it('should finalize combat with correct winner and loser when player leaves among multiple combatants', () => {
            // Arrange
            const winner = { socketId: 'socket2' } as Player;
            const otherCombatant = { socketId: 'socket3' } as Player;
            const loser = player;
            session.combatData.combatants = [winner, otherCombatant, loser];
          
            // Act
            service.removePlayerFromCombat(session, 'socket1', 'sessionCode', mockServer);
          
            // Assert
            expect(combatService.finalizeCombat).toHaveBeenCalledWith(
              'sessionCode',
              winner,
              loser,
              'win',
              mockServer
            );
          });
    });
});
