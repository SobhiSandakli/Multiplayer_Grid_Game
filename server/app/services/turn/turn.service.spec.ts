// turn.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TurnService } from './turn.service';
import { MovementService } from '@app/services/movement/movement.service';
import { Server, BroadcastOperator } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { mock, MockProxy } from 'jest-mock-extended';
import { createMockServer, EmitEvents, SocketData} from '@app/utils/test-utils'; 

jest.mock('@app/services/movement/movement.service');

describe('TurnService', () => {
  let service: TurnService;
  let movementService: MovementService;
  let mockServer: MockProxy<Server>;
  let mockBroadcastOperator: MockProxy<BroadcastOperator<EmitEvents, SocketData>>;
  let mockSession: Session;
  let mockPlayer1: Player;
  let mockPlayer2: Player;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnService,
        {
          provide: MovementService,
          useValue: {
            calculateAccessibleTiles: jest.fn((grid, player, speed) => {
              player.accessibleTiles = [
                { position: { row: 1, col: 1 }, path: [] },
                { position: { row: 1, col: 2 }, path: [] },
              ];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TurnService>(TurnService);
    movementService = module.get<MovementService>(MovementService);

    // Créer des mocks de Server et BroadcastOperator
    const mockServerData = createMockServer();
    mockServer = mockServerData.mockServer;
    mockBroadcastOperator = mockServerData.mockBroadcastOperator;

    mockSession = {
      organizerId: '1',
      locked: false,
      maxPlayers: 4,
      players: [],
      selectedGameID: 'game1',
      grid: [[{ images: [], isOccuped: false }]],
      turnOrder: [],
      currentTurnIndex: -1,
      currentPlayerSocketId: '',
      turnTimer: null,
      timeLeft: 0,
    };

    mockPlayer1 = {
      socketId: 'player1',
      name: 'Player 1',
      avatar: 'avatar1',
      attributes: {
        speed: { name: 'Speed', description: 'Speed of the player', baseValue: 5, currentValue: 5 },
      },
      isOrganizer: false,
      position: { row: 0, col: 0 },
      accessibleTiles: [],
    };

    mockPlayer2 = {
      socketId: 'player2',
      name: 'Player 2',
      avatar: 'avatar2',
      attributes: {
        speed: { name: 'Speed', description: '', baseValue: 4, currentValue: 4 },
      },
      isOrganizer: false,
      position: { row: 0, col: 1 },
      accessibleTiles: [],
    };

    mockSession.players.push(mockPlayer1, mockPlayer2);
    mockSession.turnOrder = [mockPlayer1.socketId, mockPlayer2.socketId];
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('startTurn', () => {
    it('should start a new turn and notify players', () => {
      jest.useFakeTimers();

      // Configuration initiale pour que le prochain tour soit 'player2'
      mockSession.currentTurnIndex = 0; // Avant appel startTurn, index est 0
      mockSession.currentPlayerSocketId = mockPlayer1.socketId; // Avant appel startTurn, joueur actuel est 'player1'

      service.startTurn('sessionCode', mockServer, { sessionCode: mockSession });

      // Après appel startTurn, currentTurnIndex devrait être 1 et currentPlayerSocketId 'player2'
      expect(mockSession.currentTurnIndex).toBe(1);
      expect(mockSession.currentPlayerSocketId).toBe('player2');

      // Vérifier les émissions immédiates
      expect(mockBroadcastOperator.emit).toHaveBeenCalledWith('accessibleTiles', {
        accessibleTiles: mockPlayer2.accessibleTiles,
      });

      expect(mockBroadcastOperator.emit).toHaveBeenCalledWith('accessibleTiles', {
        accessibleTiles: [],
      });

      expect(mockBroadcastOperator.emit).toHaveBeenCalledWith('nextTurnNotification', {
        playerSocketId: 'player2',
        inSeconds: 3,
      });

      // 'turnStarted' n'est pas encore émis
      expect(mockBroadcastOperator.emit).not.toHaveBeenCalledWith('turnStarted', {
        playerSocketId: 'player2',
      });

      // Avancer le temps de 3 secondes pour déclencher 'turnStarted'
      jest.advanceTimersByTime(3000);

      // Maintenant, 'turnStarted' devrait avoir été émis
      expect(mockBroadcastOperator.emit).toHaveBeenCalledWith('turnStarted', {
        playerSocketId: 'player2',
      });

      jest.useRealTimers();
    });
  });

  describe('endTurn', () => {
    it('should end the current turn and reset player attributes', () => {
      // Configuration initiale pour que le tour actuel soit 'player2'
      mockSession.currentTurnIndex = 1; // Avant appel endTurn, index est1
      mockSession.currentPlayerSocketId = mockPlayer2.socketId;
      mockPlayer2.attributes.speed.currentValue = 2; // Exemple de réinitialisation

      // Espionner startTurn pour vérifier qu'il est appelé
      jest.spyOn(service, 'startTurn');

      service.endTurn('sessionCode', mockServer, { sessionCode: mockSession });

      // Vérifier que 'turnEnded' a été émis avec 'player2'
      expect(mockBroadcastOperator.emit).toHaveBeenCalledWith('turnEnded', {
        playerSocketId: 'player2',
      });

      // Vérifier que 'playerListUpdate' a été émis avec les joueurs mis à jour
      expect(mockBroadcastOperator.emit).toHaveBeenCalledWith('playerListUpdate', {
        players: mockSession.players,
      });

      // Vérifier que startTurn a été appelé pour commencer le prochain tour
      expect(service.startTurn).toHaveBeenCalledWith('sessionCode', mockServer, { sessionCode: mockSession });
    });
  });

  describe('sendTimeLeft', () => {
    it('should send the remaining time to all players', () => {
      mockSession.timeLeft = 25;

      service.sendTimeLeft('sessionCode', mockServer, { sessionCode: mockSession });

      expect(mockServer.to).toHaveBeenCalledWith('sessionCode');
      expect(mockBroadcastOperator.emit).toHaveBeenCalledWith('timeLeft', {
        timeLeft: 25,
        playerSocketId: mockSession.currentPlayerSocketId,
      });
    });
  });
});
