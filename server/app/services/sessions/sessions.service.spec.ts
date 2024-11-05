import { CharacterData } from '@app/interfaces/character-data/character-data.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { Session } from '@app/interfaces/session/session.interface';
import { TurnService } from '@app/services/turn/turn.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { SessionsService } from './sessions.service';
function createBaseSession(sessionCode: string): Session {
    return {
      organizerId: 'organizer1',
      locked: false,
      maxPlayers: 4,
      players: [],
      selectedGameID: sessionCode,
      grid: [],
      turnOrder: [],
      currentTurnIndex: 0,
      currentPlayerSocketId: null,
      turnTimer: null,
      timeLeft: 0,
      combat: [],
      combatTurnIndex: 0,
      combatTurnTimer: null,
      combatTimeLeft: 0,
    };
  }
  describe('SessionsService', () => {
    let service: SessionsService;
    let mockTurnService: Partial<TurnService>;
    let mockServer: Partial<Server>;
  
    beforeEach(async () => {
      mockTurnService = {
        calculateTurnOrder: jest.fn(),
        startTurn: jest.fn(),
        endTurn: jest.fn(),
      };
  
      mockServer = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn(),
        }),
      };
  
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SessionsService,
          { provide: TurnService, useValue: mockTurnService },
        ],
      }).compile();
  
      service = module.get<SessionsService>(SessionsService);
    });
  
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  
    describe('validateCharacterCreation', () => {
      it('should return an error if the session code is invalid or the session does not exist', () => {
        const characterData: CharacterData = {
          name: 'Player1',
          avatar: 'avatar1.png',
          attributes: {
            speed: { name: 'Speed', description: 'Speed attribute', currentValue: 5, baseValue: 5 },
            life: { name: 'Life', description: 'Life attribute', currentValue: 10, baseValue: 10 },
          },
        };
  
        const result = service.validateCharacterCreation('invalidCode', characterData, mockServer as Server);
        expect(result.error).toBe('Session introuvable ou code de session manquant.');
      });
  
      it('should return an error if the avatar is already taken', () => {
        const sessionCode = service.createNewSession('client1', 4, 'game123');
        const session = service.getSession(sessionCode)!;
        const characterData: CharacterData = {
          name: 'Player1',
          avatar: 'avatar1.png',
          attributes: {
            speed: { name: 'Speed', description: 'Speed attribute', currentValue: 5, baseValue: 5 },
            life: { name: 'Life', description: 'Life attribute', currentValue: 10, baseValue: 10 },
          },
        };
  
        const mockSocket = { id: 'socket1' } as Socket;
        service.addPlayerToSession(session, mockSocket, 'Player1', characterData);
  
        const result = service.validateCharacterCreation(sessionCode, characterData, mockServer as Server);
        expect(result.error).toBe('Avatar déjà pris.');
      });
  
      it('should lock the session and return an error if the session is full', () => {
        const sessionCode = service.createNewSession('client1', 1, 'game123');
        const session = service.getSession(sessionCode)!;
        const characterData: CharacterData = {
          name: 'Player2',
          avatar: 'avatar2.png',
          attributes: {
            speed: { name: 'Speed', description: 'Speed attribute', currentValue: 5, baseValue: 5 },
            life: { name: 'Life', description: 'Life attribute', currentValue: 10, baseValue: 10 },
          },
        };
  
        const mockSocket = { id: 'socket1' } as Socket;
        service.addPlayerToSession(session, mockSocket, 'Player1', {
          name: 'Player1',
          avatar: 'avatar1.png',
          attributes: {
            speed: { name: 'Speed', description: 'Speed attribute', currentValue: 5, baseValue: 5 },
            life: { name: 'Life', description: 'Life attribute', currentValue: 10, baseValue: 10 },
          },
        });
  
        const result = service.validateCharacterCreation(sessionCode, characterData, mockServer as Server);
        expect(result.error).toBe('Le nombre maximum de joueurs est atteint.');
        expect(session.locked).toBe(true);
        expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
        expect(mockServer.to(sessionCode).emit).toHaveBeenCalledWith('roomLocked', { locked: true });
      });
  
      it('should return the session, final name, and game ID if validation is successful', () => {
        const sessionCode = service.createNewSession('client1', 4, 'game123');
        const characterData: CharacterData = {
          name: 'Player1',
          avatar: 'avatar1.png',
          attributes: {
            speed: { name: 'Speed', description: 'Speed attribute', currentValue: 5, baseValue: 5 },
            life: { name: 'Life', description: 'Life attribute', currentValue: 10, baseValue: 10 },
          },
        };
  
        const result = service.validateCharacterCreation(sessionCode, characterData, mockServer as Server);
        expect(result.session).toBeDefined();
        expect(result.finalName).toBe('Player1');
        expect(result.gameId).toBe('game123');
        expect(result.error).toBeUndefined();
      });
    });
  
    describe('Session Management Methods', () => {
      it('should mark the player as having left and update the turn order', () => {
        const session = createBaseSession('game123');
        session.players = [
          { socketId: 'player1', name: 'Player1', avatar: 'avatar1', attributes: {}, position: { row: 0, col: 0 }, accessibleTiles: [], isOrganizer: true } as any,
          { socketId: 'player2', name: 'Player2', avatar: 'avatar2', attributes: {}, position: { row: 0, col: 0 }, accessibleTiles: [], isOrganizer: false } as any,
        ];
        session.turnOrder = ['player1', 'player2'];
        session.currentTurnIndex = 0;
        session.currentPlayerSocketId = 'player1';
  
        const result = service.removePlayerFromSession(session, 'player2');
        expect(result).toBe(true);
        expect(session.players[1].hasLeft).toBe(true);
        expect(session.turnOrder).not.toContain('player2');
        expect(session.currentTurnIndex).toBe(0);
      });
  
      it('should return false if the player is not found', () => {
        const session = createBaseSession('game123');
        session.players = [
          { socketId: 'player1', name: 'Player1', avatar: 'avatar1', attributes: {}, position: { row: 0, col: 0 }, accessibleTiles: [], isOrganizer: true } as any,
        ];
        session.turnOrder = ['player1'];
  
        const result = service.removePlayerFromSession(session, 'player2');
        expect(result).toBe(false);
      });
  
      it('should reset the currentTurnIndex if it exceeds the new turn order length', () => {
        const session = createBaseSession('game123');
        session.players = [
          { socketId: 'player1', name: 'Player1', avatar: 'avatar1', attributes: {}, position: { row: 0, col: 0 }, accessibleTiles: [], isOrganizer: true } as any,
          { socketId: 'player2', name: 'Player2', avatar: 'avatar2', attributes: {}, position: { row: 0, col: 0 }, accessibleTiles: [], isOrganizer: false } as any,
        ];
        session.turnOrder = ['player1', 'player2'];
        session.currentTurnIndex = 1;
        session.currentPlayerSocketId = 'player2';
  
        const result = service.removePlayerFromSession(session, 'player2');
        expect(result).toBe(true);
        expect(session.turnOrder).not.toContain('player2');
        expect(session.currentTurnIndex).toBe(0);
      });
  
      it('should call TurnService.calculateTurnOrder with the session', () => {
        const session = createBaseSession('game123');
        service.calculateTurnOrder(session);
        expect(mockTurnService.calculateTurnOrder).toHaveBeenCalledWith(session);
      });
  
      it('should call TurnService.startTurn with the correct parameters', () => {
        const sessionCode = 'game123';
        service.startTurn(sessionCode, mockServer as Server);
        expect(mockTurnService.startTurn).toHaveBeenCalledWith(sessionCode, mockServer, service['sessions']);
      });

      it('should emit timeLeft event with correct data', () => {
        const session = createBaseSession('game123');
        session.currentPlayerSocketId = 'player1';
        session.timeLeft = 30;
    
        service['sessions']['game123'] = session;
        service.sendTimeLeft('game123', mockServer as Server);
    
        expect(mockServer.to).toHaveBeenCalledWith('game123');
        expect(mockServer.to('game123').emit).toHaveBeenCalledWith('timeLeft', {
          timeLeft: 30,
          playerSocketId: 'player1',
        });
      });
    
      it('should return true if the client is the organizer', () => {
        const session = createBaseSession('game123');
        const result = service.isOrganizer(session, 'organizer1');
        expect(result).toBe(true);
      });
    
      it('should return false if the client is not the organizer', () => {
        const session = createBaseSession('game123');
        const result = service.isOrganizer(session, 'nonOrganizer');
        expect(result).toBe(false);
      });
    
      it('should delete the session when terminateSession is called', () => {
        const sessionCode = 'game123';
        service['sessions'][sessionCode] = createBaseSession(sessionCode);
    
        service.terminateSession(sessionCode);
        expect(service['sessions'][sessionCode]).toBeUndefined();
      });
    
      it('should lock or unlock the session when toggleSessionLock is called', () => {
        const session = createBaseSession('game123');
    
        service.toggleSessionLock(session, true);
        expect(session.locked).toBe(true);
    
        service.toggleSessionLock(session, false);
        expect(session.locked).toBe(false);
      });
    
      it('should update the grid of the session when updateSessionGrid is called', () => {
        const sessionCode = 'game123';
        const newGrid = [[{ images: ['image1.png'], isOccuped: true }]];
    
        service['sessions'][sessionCode] = createBaseSession(sessionCode);
        service.updateSessionGrid(sessionCode, newGrid);
    
        expect(service['sessions'][sessionCode].grid).toBe(newGrid);
      });
    });
    it('should update the session grid when a player leaves', () => {
        const session = createBaseSession('game123');
        const player: Player = {
          socketId: 'player1',
          name: 'Player1',
          avatar: 'avatar1.png',
          attributes: {},
          position: { row: 0, col: 0 },
          accessibleTiles: [],
          isOrganizer: true,
        };
        session.players.push(player);
    
        session.grid = [
          [{ images: ['avatar1.png', 'assets/objects/started-points.png'], isOccuped: true }],
          [{ images: [], isOccuped: false }],
        ];
    
        service.updateSessionGridForPlayerLeft(session, 'player1');
        expect(session.grid[0][0].images).not.toContain('avatar1.png');
        expect(session.grid[0][0].images).not.toContain('assets/objects/started-points.png');
        expect(session.grid[0][0].isOccuped).toBe(false);
      });
    
      it('should not modify the grid if the player is not found', () => {
        const session = createBaseSession('game123');
        session.grid = [
          [{ images: ['avatar1.png', 'assets/objects/started-points.png'], isOccuped: true }],
          [{ images: [], isOccuped: false }],
        ];
    
        service.updateSessionGridForPlayerLeft(session, 'nonExistentPlayer');
        expect(session.grid[0][0].images).toEqual(['avatar1.png', 'assets/objects/started-points.png']);
        expect(session.grid[0][0].isOccuped).toBe(true);
      });
    
      it('should return all avatars taken by players in the session', () => {
        const session = createBaseSession('game123');
        session.players.push(
          { socketId: 'player1', name: 'Player1', avatar: 'avatar1.png', attributes: {}, position: { row: 0, col: 0 }, accessibleTiles: [], isOrganizer: true } as Player,
          { socketId: 'player2', name: 'Player2', avatar: 'avatar2.png', attributes: {}, position: { row: 0, col: 0 }, accessibleTiles: [], isOrganizer: false } as Player
        );
    
        const avatars = service.getTakenAvatars(session);
        expect(avatars).toEqual(['avatar1.png', 'avatar2.png']);
      });
      it('should call TurnService.endTurn with the correct parameters', () => {
        const sessionCode = 'game123';
        service.endTurn(sessionCode, mockServer as Server);
        expect(mockTurnService.endTurn).toHaveBeenCalledWith(sessionCode, mockServer, service['sessions']);
      });
    });