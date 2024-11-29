import { VP_COMBAT_MAX_TIME, VP_COMBAT_MIN_TIME } from '@app/constants/fight-constants';
import { ObjectsImages } from '@app/constants/objects-enums-constants';
import { TIME_TO_MOVE, TURN_DURATION } from '@app/constants/turn-constants';
import { CombatGateway } from '@app/gateways/combat/combat.gateway';
import { Player } from '@app/interfaces/player/player.interface';
import { Position } from '@app/interfaces/player/position.interface';
import { Session } from '@app/interfaces/session/session.interface';
import { CombatService } from '@app/services/combat/combat.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { MovementService } from '@app/services/movement/movement.service';
import { TurnService } from '@app/services/turn/turn.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';
import { VirtualPlayerService } from './virtual-player.service';
describe('VirtualPlayerService', () => {
  let service: VirtualPlayerService;
  let movementService: jest.Mocked<MovementService>;
  let combatService: jest.Mocked<CombatService>;
  let turnService: jest.Mocked<TurnService>;
  let combatGateway: jest.Mocked<CombatGateway>;
  let changeGridService: jest.Mocked<ChangeGridService>;
  let server: Partial<Server>;
  let player: Player;
  let targetPlayer: Player;
  let session: Session;

  beforeEach(async () => {
    jest.useFakeTimers();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VirtualPlayerService,
        {
          provide: MovementService,
          useValue: {
            calculateAccessibleTiles: jest.fn(),
            getPathToDestination: jest.fn(),
            processPlayerMovement: jest.fn(),
            isPositionAccessible: jest.fn(),
            handleItemPickup: jest.fn(),
            handleItemDiscard: jest.fn(),
            calculatePathMovementCost: jest.fn(),
            getPathMovementCost: jest.fn(),
          },
        },
        {
          provide: CombatService,
          useValue: {
            initiateCombat: jest.fn(),
          },
        },
        {
          provide: TurnService,
          useValue: {
            endTurn: jest.fn(),
          },
        },
        {
          provide: CombatGateway,
          useValue: {
            handleAttack: jest.fn(),
          },
        },
        {
          provide: ChangeGridService,
          useValue: {
            getAdjacentPositions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VirtualPlayerService>(VirtualPlayerService);
    movementService = module.get(MovementService);
    combatService = module.get(CombatService);
    turnService = module.get(TurnService);
    combatGateway = module.get(CombatGateway);
    changeGridService = module.get(ChangeGridService);
    server = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };
    player = {
        socketId: 'socket-vp',
        name: 'AggressiveVP',
        avatar: 'vp-avatar',
        attributes: {
          speed: {
            name: 'Speed',
            description: 'Determines how fast the player can move.',
            baseValue: 3,
            currentValue: 3,
            dice: '1d6',
            hasGrassBoost: false,
            hasSwordBoost: false,
            hasKeyBoost: false,
          },
          strength: {
            name: 'Strength',
            description: 'Determines the damage the player can inflict.',
            baseValue: 5,
            currentValue: 5,
            dice: '1d8',
            hasGrassBoost: false,
            hasSwordBoost: false,
            hasKeyBoost: false,
          },
        },
        isOrganizer: false,
        position: { row: 0, col: 0 },
        accessibleTiles: [],
        isVirtual: true,
        type: 'Aggressif',
        inventory: [],
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
        initialPosition: { row: 0, col: 0 },
        previousTileType: undefined,
        hasLeft: false,
      }as Player;
    
      targetPlayer = {
        socketId: 'socket-target',
        name: 'TargetPlayer',
        avatar: 'target-avatar',
        attributes: {
          speed: {
            name: 'Speed',
            description: 'Determines how fast the player can move.',
            baseValue: 3,
            currentValue: 3,
            dice: '1d6',
            hasGrassBoost: false,
            hasSwordBoost: false,
            hasKeyBoost: false,
          },
          strength: {
            name: 'Strength',
            description: 'Determines the damage the player can inflict.',
            baseValue: 4,
            currentValue: 4,
            dice: '1d8',
            hasGrassBoost: false,
            hasSwordBoost: false,
            hasKeyBoost: false,
          },
        },
        isOrganizer: false,
        position: { row: 1, col: 0 },
        accessibleTiles: [],
        isVirtual: false,
        inventory: [],
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
        previousTileType: undefined,
        hasLeft: false,
      } as Player;
      session = {
        organizerId: 'socket-vp', 
        locked: false, 
        maxPlayers: 4, 
        players: [player, targetPlayer],
        selectedGameID: 'game-001', 
        grid: [
            [
              { images: [], isOccuped: false },
              { images: ['assets/objects/item1.png'], isOccuped: false },
            ],
            [
              { images: [], isOccuped: false },
              { images: [], isOccuped: false },
            ],
          ],
          turnData: {
            turnOrder: [player.socketId],
            currentTurnIndex: 0,
            currentPlayerSocketId: player.socketId,
            turnTimer: null,
            timeLeft: 60,
        },
        combatData: {
          combatants: [],
          turnIndex: 0,
          turnTimer: null,
          timeLeft: 60,
         
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
        isDebugMode: false,
      };
      jest.spyOn(service as any, 'tryInitiateCombat').mockReturnValue(false);
  jest.spyOn(service as any, 'tryCollectItems').mockReturnValue(false);

  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should call turnService.endTurn after TURN_DURATION if player is not in combat', () => {
    const sessionCode = 'session-123';
    const sessions = { [sessionCode]: session };
    jest.spyOn(service as any, 'isPlayerInCombat').mockReturnValue(false);
    const endTurnSpy = jest.spyOn(turnService, 'endTurn');
    (service as any).endVirtualTurnAfterDelay(sessionCode, server as Server, sessions, player);
    jest.advanceTimersByTime(TURN_DURATION - 1);
    expect(endTurnSpy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(endTurnSpy).toHaveBeenCalledWith(sessionCode, server, sessions);
  });

  it('should not call turnService.endTurn if player is in combat', () => {
    const sessionCode = 'session-123';
    const sessions = { [sessionCode]: session };
    jest.spyOn(service as any, 'isPlayerInCombat').mockReturnValue(true);
    const endTurnSpy = jest.spyOn(turnService, 'endTurn');
    (service as any).endVirtualTurnAfterDelay(sessionCode, server as Server, sessions, player);
    jest.advanceTimersByTime(TURN_DURATION);
    expect(endTurnSpy).not.toHaveBeenCalled();
  });

  it('should return immediately if session is not found', () => {
    const sessionCode = 'invalid-session';
    const sessions = {}; 

    const isPlayerInCombatSpy = jest.spyOn(service as any, 'isPlayerInCombat');
    const endTurnSpy = jest.spyOn(turnService, 'endTurn');
    (service as any).endVirtualTurnAfterDelay(sessionCode, server as Server, sessions, player);
    expect(isPlayerInCombatSpy).not.toHaveBeenCalled();
    expect(endTurnSpy).not.toHaveBeenCalled();
  });
  it('should schedule combat initiation and attack with correct delays', () => {
    const sessionCode = 'session-123';
    const delay = (player.attributes.speed.baseValue + 2) * TIME_TO_MOVE;
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5); 
    const expectedRandomExecutionTime =
      Math.floor(0.5 * VP_COMBAT_MAX_TIME) + VP_COMBAT_MIN_TIME;
    (service as any).scheduleCombat(sessionCode, player, targetPlayer, server as Server);
    jest.advanceTimersByTime(delay - 1);
    expect(combatService.initiateCombat).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(combatService.initiateCombat).toHaveBeenCalledWith(
      sessionCode,
      player,
      targetPlayer,
      server
    );
    jest.advanceTimersByTime(expectedRandomExecutionTime - delay - 1);
    expect(combatGateway.handleAttack).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(combatGateway.handleAttack).toHaveBeenCalledWith(null, {
      sessionCode,
      clientSocketId: player.socketId,
    });

    randomSpy.mockRestore(); 
  });
  it('should call handleAggressivePlayerTurn when player type is Aggressif', () => {

    const sessionCode = 'session-123';
    const sessions: { [key: string]: Session } = {};
    sessions[sessionCode] = session;
  
    player.type = 'Aggressif';
    const aggressiveSpy = jest.spyOn<any, any>(service, 'handleAggressivePlayerTurn').mockImplementation(() => {});
    service.handleVirtualPlayerTurn(sessionCode, server as Server, sessions, player, session);
    expect(aggressiveSpy).toHaveBeenCalledWith(sessionCode, server, player, session, sessions);
  });
  it('should call handleDefensivePlayerTurn when player type is Défensif', () => {

    const sessionCode = 'session-123';
    const sessions: { [key: string]: Session } = {};
    sessions[sessionCode] = session;
  
    player.type = 'Défensif';

    const defensiveSpy = jest.spyOn<any, any>(service, 'handleDefensivePlayerTurn').mockImplementation(() => {});
    service.handleVirtualPlayerTurn(sessionCode, server as Server, sessions, player, session);
    expect(defensiveSpy).toHaveBeenCalledWith(sessionCode, server, player, session, sessions);
  });
  it('should collect items and end turn if tryCollectItems returns true', () => {
    const sessionCode = 'session-456';
    const sessions: { [key: string]: Session } = {};
    sessions[sessionCode] = session;
    player.type = 'Aggressif';
  
    const calculateAccessibleTilesSpy = jest.spyOn(movementService, 'calculateAccessibleTiles');
    const tryInitiateCombatSpy = jest.spyOn(service as any, 'tryInitiateCombat').mockReturnValue(false);
    const tryCollectItemsSpy = jest.spyOn(service as any, 'tryCollectItems').mockReturnValue(true);
    const endVirtualTurnAfterDelaySpy = jest.spyOn(service as any, 'endVirtualTurnAfterDelay');
    (service as any).handleAggressivePlayerTurn(sessionCode, server as Server, player, session, sessions);
    expect(calculateAccessibleTilesSpy).toHaveBeenCalledWith(
      session.grid,
      player,
      player.attributes['speed'].currentValue,
    );
    expect(tryInitiateCombatSpy).toHaveBeenCalledWith(sessionCode, server, player, session);
    expect(tryCollectItemsSpy).toHaveBeenCalledWith(sessionCode, server, player, session);
    expect(endVirtualTurnAfterDelaySpy).toHaveBeenCalledWith(sessionCode, server, sessions, player);
  });
  it('should move to initial position if player has the flag in CTF mode', () => {
    const sessionCode = 'session-789';
    const sessions: { [key: string]: Session } = {};
    sessions[sessionCode] = session;
    player.type = 'Aggressif';
    session.ctf = true;
    player.inventory.push(ObjectsImages.Flag);
  
    const calculateAccessibleTilesSpy = jest.spyOn(movementService, 'calculateAccessibleTiles');
    const tryInitiateCombatSpy = jest.spyOn(service as any, 'tryInitiateCombat').mockReturnValue(false);
    const tryCollectItemsSpy = jest.spyOn(service as any, 'tryCollectItems').mockReturnValue(false);
    const tryMoveToInitialPositionSpy = jest
      .spyOn(service as any, 'tryMoveToInitialPosition')
      .mockReturnValue(true);
    const endVirtualTurnAfterDelaySpy = jest.spyOn(service as any, 'endVirtualTurnAfterDelay');
    (service as any).handleAggressivePlayerTurn(sessionCode, server as Server, player, session, sessions);
    expect(calculateAccessibleTilesSpy).toHaveBeenCalledWith(
      session.grid,
      player,
      player.attributes['speed'].currentValue,
    );
    expect(tryInitiateCombatSpy).toHaveBeenCalledWith(sessionCode, server, player, session);
    expect(tryCollectItemsSpy).toHaveBeenCalledWith(sessionCode, server, player, session);
    expect(tryMoveToInitialPositionSpy).toHaveBeenCalledWith(player, session, server, sessionCode);
    expect(endVirtualTurnAfterDelaySpy).toHaveBeenCalledWith(sessionCode, server, sessions, player);
  });
  describe('getPossibleCombatPositions', () => {
    it('should return possible combat positions correctly', () => {
      const playerAccessibleTiles = [
        { position: { row: 1, col: 1 }, path: [], movementCost: 1 },
        { position: { row: 1, col: 2 }, path: [], movementCost: 1 },
        { position: { row: 2, col: 1 }, path: [], movementCost: 1 },
      ];
      player.accessibleTiles = playerAccessibleTiles;

      targetPlayer.position = { row: 2, col: 2 };
      const adjacentPositions = [
        { row: 2, col: 1 },
        { row: 1, col: 2 },
        { row: 2, col: 3 },
        { row: 3, col: 2 },
      ];
      (changeGridService.getAdjacentPositions as jest.Mock).mockReturnValue(adjacentPositions);
      (movementService.isPositionAccessible as jest.Mock).mockReturnValue(true);
      const result = (service as any).getPossibleCombatPositions(player, targetPlayer, session);
      expect(result).toEqual([
        { row: 2, col: 1 },
        { row: 1, col: 2 },
      ]);
    });
  });
  describe('tryMoveToInitialPosition', () => {
    it('should execute movement and return true if path exists', () => {
      const pathToInitialPosition = { row: 0, col: 0 };
      jest
        .spyOn(service as any, 'getPathToDestination')
        .mockReturnValue(pathToInitialPosition);
      const executeMovementSpy = jest.spyOn(service as any, 'executeMovement');
  
      const result = (service as any).tryMoveToInitialPosition(
        player,
        session,
        server as Server,
        'session-123'
      );
  
      expect(executeMovementSpy).toHaveBeenCalledWith(
        server,
        player,
        session,
        'session-123',
        pathToInitialPosition
      );
      expect(result).toBe(true);
    });
  
    it('should return false if no path exists', () => {
      jest.spyOn(service as any, 'getPathToDestination').mockReturnValue(null);
      const executeMovementSpy = jest.spyOn(service as any, 'executeMovement');
  
      const result = (service as any).tryMoveToInitialPosition(
        player,
        session,
        server as Server,
        'session-123'
      );
  
      expect(executeMovementSpy).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
  describe('getPathToDestination', () => {
    it('should return the last position in the path if path exists', () => {
      const path = [{ row: 0, col: 0 }, { row: 1, col: 1 }];
      movementService.calculateAccessibleTiles.mockImplementation(() => {});
      movementService.getPathToDestination.mockReturnValue(path);
  
      const result = (service as any).getPathToDestination(
        player,
        session,
        { row: 1, col: 1 }
      );
  
      expect(movementService.calculateAccessibleTiles).toHaveBeenCalledWith(
        session.grid,
        player,
        player.attributes['speed'].currentValue
      );
      expect(movementService.getPathToDestination).toHaveBeenCalledWith(
        player,
        { row: 1, col: 1 }
      );
      expect(result).toEqual({ row: 1, col: 1 });
    });
  
    it('should return null if no path exists', () => {
      movementService.calculateAccessibleTiles.mockImplementation(() => {});
      movementService.getPathToDestination.mockReturnValue(null);
  
      const result = (service as any).getPathToDestination(
        player,
        session,
        { row: 1, col: 1 }
      );
  
      expect(movementService.calculateAccessibleTiles).toHaveBeenCalledWith(
        session.grid,
        player,
        player.attributes['speed'].currentValue
      );
      expect(movementService.getPathToDestination).toHaveBeenCalledWith(
        player,
        { row: 1, col: 1 }
      );
      expect(result).toBeNull();
    });
  });
  describe('moveToClosestPlayerIfExists', () => {

  
    it('should not move if no closest player exists', () => {
      jest.spyOn(service as any, 'getClosestPlayer').mockReturnValue(null);
      const moveTheClosestToDestinationSpy = jest.spyOn(
        service as any,
        'moveTheClosestToDestination'
      );
  
      (service as any).moveToClosestPlayerIfExists(
        player,
        session,
        server as Server,
        'session-123'
      );
  
      expect(moveTheClosestToDestinationSpy).not.toHaveBeenCalled();
    });
  });
  describe('filterAccessibleTilesWithItems', () => {
    it('should exclude tiles without items or with non-object images', () => {

      player.accessibleTiles = [
        { position: { row: 0, col: 0 }, path: []}, 
        { position: { row: 0, col: 1 }, path: []}, 
        { position: { row: 0, col: 2 }, path: []}, 
      ];
      session.grid = [
        [
          { images: [], isOccuped: false }, 
          { images: ['assets/terrain/grass.png'], isOccuped: false }, 
          { images: ['assets/objects/started-points.png'], isOccuped: false }, 
        ],
      ];
  
      const result = (service as any).filterAccessibleTilesWithItems(player, session);
  
      expect(result).toEqual([]);
    });
  });
  describe('mapTilesToItems', () => {
    it('should map tiles to their corresponding item images', () => {
      const accessibleTilesWithItems = [
        { position: { row: 0, col: 1 }, path: [], movementCost: 1 },
        { position: { row: 1, col: 1 }, path: [], movementCost: 1 },
      ];
      session.grid = [
        [
          { images: [], isOccuped: false },
          { images: ['assets/objects/item1.png'], isOccuped: false }, 
        ],
        [
          { images: [], isOccuped: false },
          { images: ['assets/objects/item2.png'], isOccuped: false }, 
        ],
      ];
  
      const result = (service as any).mapTilesToItems(accessibleTilesWithItems, session);
  
      expect(result).toEqual([
        {
          tile: { position: { row: 0, col: 1 }, path: [], movementCost: 1 },
          itemImage: 'assets/objects/item1.png',
        },
        {
          tile: { position: { row: 1, col: 1 }, path: [], movementCost: 1 },
          itemImage: 'assets/objects/item2.png',
        },
      ]);
    });
  
    it('should handle tiles with multiple items (choose first valid)', () => {
      const accessibleTilesWithItems = [
        { position: { row: 0, col: 1 }, path: [], movementCost: 1 },
      ];
      session.grid = [
        [
          { images: [], isOccuped: false },
          {
            images: ['assets/objects/item3.png', 'assets/objects/item4.png'],
            isOccuped: false,
          }, 
        ],
      ];
  
      const result = (service as any).mapTilesToItems(accessibleTilesWithItems, session);
  
      expect(result).toEqual([
        {
          tile: { position: { row: 0, col: 1 }, path: [], movementCost: 1 },
          itemImage: 'assets/objects/item3.png',
        },
      ]);
    });
  });
  describe('sortItemsByPriority', () => {
    it('should sort items based on the given priority list', () => {
      const accessibleItems = [
        {
          tile: { position: { row: 0, col: 1 }, path: [], movementCost: 1 },
          itemImage: 'assets/objects/sword.png',
        },
        {
          tile: { position: { row: 1, col: 1 }, path: [], movementCost: 1 },
          itemImage: 'assets/objects/shield.png',
        },
        {
          tile: { position: { row: 2, col: 1 }, path: [], movementCost: 1 },
          itemImage: 'assets/objects/key.png',
        },
      ];
  
      const itemPriorities = [
        'assets/objects/key.png',
        'assets/objects/shield.png',
        'assets/objects/sword.png',
      ];
  
      (service as any).sortItemsByPriority(accessibleItems, itemPriorities);
  
      expect(accessibleItems).toEqual([
        {
          tile: { position: { row: 2, col: 1 }, path: [], movementCost: 1 },
          itemImage: 'assets/objects/key.png',
        },
        {
          tile: { position: { row: 1, col: 1 }, path: [], movementCost: 1 },
          itemImage: 'assets/objects/shield.png',
        },
        {
          tile: { position: { row: 0, col: 1 }, path: [], movementCost: 1 },
          itemImage: 'assets/objects/sword.png',
        },
      ]);
    });
  });
  describe('isPlayerInCombat', () => {
    it('should return true if the player is in combat', () => {
      session.combatData.combatants = [
        { name: 'AggressiveVP' } as Player, 
      ];
      const result = (service as any).isPlayerInCombat(player, session);
      expect(result).toBe(true);
    });
  
    it('should return false if the player is not in combat', () => {
      session.combatData.combatants = [
        { name: 'OtherPlayer' } as Player, 
      ];
      const result = (service as any).isPlayerInCombat(player, session);
      expect(result).toBe(false);
    });
  
    it('should return false if there are no combatants', () => {
      session.combatData.combatants = []; 
      const result = (service as any).isPlayerInCombat(player, session);
      expect(result).toBe(false);
    });
  });
  describe('handleDefensivePlayerTurn', () => {
    it('should collect defensive items and end turn if tryCollectDefensiveItems returns true', () => {
      const sessionCode = 'session-456';
      const sessions: { [key: string]: Session } = {};
      sessions[sessionCode] = session;

      const calculateAccessibleTilesSpy = jest.spyOn(
        movementService,
        'calculateAccessibleTiles',
      );
      const tryCollectDefensiveItemsSpy = jest
        .spyOn(service as any, 'tryCollectDefensiveItems')
        .mockReturnValue(true);
      const endVirtualTurnAfterDelaySpy = jest.spyOn(
        service as any,
        'endVirtualTurnAfterDelay',
      );

      (service as any).handleDefensivePlayerTurn(
        sessionCode,
        server as Server,
        player,
        session,
        sessions,
      );

      expect(calculateAccessibleTilesSpy).toHaveBeenCalledWith(
        session.grid,
        player,
        player.attributes['speed'].currentValue,
      );
      expect(tryCollectDefensiveItemsSpy).toHaveBeenCalledWith(
        sessionCode,
        server,
        player,
        session,
      );
      expect(endVirtualTurnAfterDelaySpy).toHaveBeenCalledWith(
        sessionCode,
        server,
        sessions,
        player,
      );
    });

    it('should move to initial position if player has the flag in CTF mode and tryMoveToInitialPosition returns true', () => {
      const sessionCode = 'session-789';
      const sessions: { [key: string]: Session } = {};
      sessions[sessionCode] = session;
      session.ctf = true;
      player.inventory.push(ObjectsImages.Flag);

      const calculateAccessibleTilesSpy = jest.spyOn(
        movementService,
        'calculateAccessibleTiles',
      );
      const tryCollectDefensiveItemsSpy = jest
        .spyOn(service as any, 'tryCollectDefensiveItems')
        .mockReturnValue(false);
      const tryMoveToInitialPositionSpy = jest
        .spyOn(service as any, 'tryMoveToInitialPosition')
        .mockReturnValue(true);
      const endVirtualTurnAfterDelaySpy = jest.spyOn(
        service as any,
        'endVirtualTurnAfterDelay',
      );

      (service as any).handleDefensivePlayerTurn(
        sessionCode,
        server as Server,
        player,
        session,
        sessions,
      );

      expect(calculateAccessibleTilesSpy).toHaveBeenCalledWith(
        session.grid,
        player,
        player.attributes['speed'].currentValue,
      );
      expect(tryCollectDefensiveItemsSpy).toHaveBeenCalledWith(
        sessionCode,
        server,
        player,
        session,
      );
      expect(tryMoveToInitialPositionSpy).toHaveBeenCalledWith(
        player,
        session,
        server,
        sessionCode,
      );
      expect(endVirtualTurnAfterDelaySpy).toHaveBeenCalledWith(
        sessionCode,
        server,
        sessions,
        player,
      );
    });

    it('should initiate combat and return if tryInitiateCombat returns true', () => {
      const sessionCode = 'session-345';
      const sessions: { [key: string]: Session } = {};
      sessions[sessionCode] = session;

      const calculateAccessibleTilesSpy = jest.spyOn(
        movementService,
        'calculateAccessibleTiles',
      );
      const tryCollectDefensiveItemsSpy = jest
        .spyOn(service as any, 'tryCollectDefensiveItems')
        .mockReturnValue(false);
      const tryInitiateCombatSpy = jest
        .spyOn(service as any, 'tryInitiateCombat')
        .mockReturnValue(true);
      const endVirtualTurnAfterDelaySpy = jest.spyOn(
        service as any,
        'endVirtualTurnAfterDelay',
      );

      (service as any).handleDefensivePlayerTurn(
        sessionCode,
        server as Server,
        player,
        session,
        sessions,
      );

      expect(calculateAccessibleTilesSpy).toHaveBeenCalledWith(
        session.grid,
        player,
        player.attributes['speed'].currentValue,
      );
      expect(tryCollectDefensiveItemsSpy).toHaveBeenCalledWith(
        sessionCode,
        server,
        player,
        session,
      );
      expect(tryInitiateCombatSpy).toHaveBeenCalledWith(
        sessionCode,
        server,
        player,
        session,
      );
      expect(endVirtualTurnAfterDelaySpy).not.toHaveBeenCalled();
    });
  });
  it('should return false when there are no accessible items', () => {
    const sessionCode = 'session-123';
  
    jest.spyOn(service as any, 'getAccessibleItems').mockReturnValue([]);
    const executeMovementSpy = jest.spyOn(service as any, 'executeMovement');
    const handleItemPickupSpy = jest.spyOn(movementService, 'handleItemPickup');
    const handleItemDiscardSpy = jest.spyOn(movementService, 'handleItemDiscard');
  
    const result = (service as any).tryCollectDefensiveItems(
      sessionCode,
      server as Server,
      player,
      session
    );
  
    expect(result).toBe(false);
    expect(executeMovementSpy).not.toHaveBeenCalled();
    expect(handleItemPickupSpy).not.toHaveBeenCalled();
    expect(handleItemDiscardSpy).not.toHaveBeenCalled();
  });
  it('should pick up item and return true when inventory has less than 2 items', () => {
    const sessionCode = 'session-456';
    const accessibleItems = [
      {
        tile: { position: { row: 1, col: 1 }, path: [], movementCost: 1 },
        itemImage: ObjectsImages.Shield,
      },
    ];
  
    jest.spyOn(service as any, 'getAccessibleItems').mockReturnValue(accessibleItems);
    jest.spyOn(service as any, 'determineItemToDiscard').mockReturnValue(null);
  
    const executeMovementSpy = jest.spyOn(service as any, 'executeMovement');
    const handleItemPickupSpy = jest.spyOn(movementService, 'handleItemPickup');
    const handleItemDiscardSpy = jest.spyOn(movementService, 'handleItemDiscard');
    player.inventory = [ObjectsImages.Sword];
  
    const result = (service as any).tryCollectDefensiveItems(
      sessionCode,
      server as Server,
      player,
      session
    );
  
    expect(result).toBe(true);
    expect(executeMovementSpy).toHaveBeenCalledWith(
      server,
      player,
      session,
      sessionCode,
      accessibleItems[0].tile.position
    );
    expect(handleItemPickupSpy).toHaveBeenCalledWith(
      player,
      session,
      accessibleItems[0].tile.position,
      server,
      sessionCode
    );
    expect(handleItemDiscardSpy).not.toHaveBeenCalled();
  });
  it('should discard item, pick up new item, and return true when inventory is full and an item can be discarded', () => {
    const sessionCode = 'session-789';
    const accessibleItems = [
      {
        tile: { position: { row: 1, col: 1 }, path: [], movementCost: 1 },
        itemImage: 'item1',
      },
    ];
  
    jest.spyOn(service as any, 'getAccessibleItems').mockReturnValue(accessibleItems);
    jest.spyOn(service as any, 'determineItemToDiscard').mockReturnValue('itemA');
  
    const executeMovementSpy = jest.spyOn(service as any, 'executeMovement');
    const handleItemPickupSpy = jest.spyOn(movementService, 'handleItemPickup');
    const handleItemDiscardSpy = jest.spyOn(movementService, 'handleItemDiscard');
    player.inventory = [ObjectsImages.Sword, ObjectsImages.Key];
  
    const result = (service as any).tryCollectDefensiveItems(
      sessionCode,
      server as Server,
      player,
      session
    );
  
    expect(result).toBe(true);
    expect(executeMovementSpy).toHaveBeenCalledWith(
      server,
      player,
      session,
      sessionCode,
      accessibleItems[0].tile.position
    );
    expect(handleItemDiscardSpy).toHaveBeenCalledWith(
      player,
      'itemA',
      accessibleItems[0].itemImage,
      server,
      sessionCode
    );
    expect(handleItemPickupSpy).not.toHaveBeenCalled();
  });
  it('should return false when inventory is full and no item should be discarded', () => {
    const sessionCode = 'session-012';
    const accessibleItems = [
      {
        tile: { position: { row: 1, col: 1 }, path: [], movementCost: 1 },
        itemImage: 'item3', 
      },
    ];
  
    jest.spyOn(service as any, 'getAccessibleItems').mockReturnValue(accessibleItems);
    jest.spyOn(service as any, 'determineItemToDiscard').mockReturnValue(null);
  
    const executeMovementSpy = jest.spyOn(service as any, 'executeMovement');
    const handleItemPickupSpy = jest.spyOn(movementService, 'handleItemPickup');
    const handleItemDiscardSpy = jest.spyOn(movementService, 'handleItemDiscard');
    player.inventory = [ObjectsImages.Sword, ObjectsImages.Key]; 
  
    const result = (service as any).tryCollectDefensiveItems(
      sessionCode,
      server as Server,
      player,
      session
    );
  
    expect(result).toBe(false);
    expect(executeMovementSpy).not.toHaveBeenCalled();
    expect(handleItemPickupSpy).not.toHaveBeenCalled();
    expect(handleItemDiscardSpy).not.toHaveBeenCalled();
  });
  describe('getBestPathToAdjacentPosition', () => {
    it('should return null when accessiblePositions is empty', () => {
      const accessiblePositions: Position[] = [];
  
      const result = (service as any).getBestPathToAdjacentPosition(
        player,
        session,
        accessiblePositions
      );
  
      expect(result).toBeNull();
    });
  
    it('should return null when no paths are found to accessiblePositions', () => {
      const accessiblePositions: Position[] = [
        { row: 1, col: 1 },
        { row: 2, col: 2 },
      ];
  
      movementService.getPathToDestination.mockReturnValue(null);
  
      const result = (service as any).getBestPathToAdjacentPosition(
        player,
        session,
        accessiblePositions
      );
  
      expect(movementService.getPathToDestination).toHaveBeenCalledTimes(
        accessiblePositions.length
      );
      expect(result).toBeNull();
    });
  
    it('should return the correct position along the best path based on player speed', () => {
      const accessiblePositions: Position[] = [{ row: 3, col: 3 }];
  
      const fullPath = [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
        { row: 2, col: 2 },
        { row: 3, col: 3 },
      ];
  
      movementService.getPathToDestination.mockReturnValue(fullPath);
      movementService.calculatePathMovementCost.mockReturnValue(4);
  
      movementService.calculateAccessibleTiles.mockImplementation(() => {});
  
      player.attributes.speed.currentValue = 2;
  
      const result = (service as any).getBestPathToAdjacentPosition(
        player,
        session,
        accessiblePositions
      );
  
      expect(result).toEqual(fullPath[2]);
    });
  
    it('should return the destination position when player can reach it within their speed', () => {
      const accessiblePositions: Position[] = [{ row: 1, col: 1 }];
  
      const fullPath = [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
      ];
  
      movementService.getPathToDestination.mockReturnValue(fullPath);
      movementService.calculatePathMovementCost.mockReturnValue(2);
  
      movementService.calculateAccessibleTiles.mockImplementation(() => {});
  
      player.attributes.speed.currentValue = 3;
  
      const result = (service as any).getBestPathToAdjacentPosition(
        player,
        session,
        accessiblePositions
      );
  
      expect(result).toEqual(fullPath[1]);
    });
  
    it('should choose the path with the lowest movement cost', () => {
      const accessiblePositions: Position[] = [
        { row: 2, col: 2 },
        { row: 3, col: 1 },
      ];
  
      const path1 = [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
        { row: 2, col: 2 },
      ];
      const path2 = [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 2, col: 0 },
        { row: 3, col: 1 },
      ];
  
      movementService.getPathToDestination
        .mockReturnValueOnce(path1)
        .mockReturnValueOnce(path2);
  
      movementService.calculatePathMovementCost
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(4);
  
      movementService.calculateAccessibleTiles.mockImplementation(() => {});
  
      player.attributes.speed.currentValue = 2;
  
      const result = (service as any).getBestPathToAdjacentPosition(
        player,
        session,
        accessiblePositions
      );
  
      expect(result).toEqual(path1[2]);
      expect(movementService.getPathToDestination).toHaveBeenCalledTimes(2);
      expect(movementService.calculatePathMovementCost).toHaveBeenCalledTimes(2);
    });
  });
});

