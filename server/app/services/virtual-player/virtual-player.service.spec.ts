import { VP_COMBAT_MAX_TIME, VP_COMBAT_MIN_TIME } from '@app/constants/fight-constants';
import { AGGRESSIVE_PLAYER_ITEM_PRIORITIES, ObjectsImages } from '@app/constants/objects-enums-constants';
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

  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return immediately if tryInitiateCombat is successful', () => {
    const tryInitiateCombatSpy = jest.spyOn(service as any, 'tryInitiateCombat').mockReturnValue(true);
    const tryCollectItemsSpy = jest.spyOn(service as any, 'tryCollectItems').mockReturnValue(false);
    const endVirtualTurnSpy = jest.spyOn(service as any, 'endVirtualTurnAfterDelay');
    (service as any).handleAggressivePlayerTurn('session-code', server as Server, player, session, {});
    expect(tryInitiateCombatSpy).toHaveBeenCalledWith('session-code', server, player, session);
    expect(tryCollectItemsSpy).not.toHaveBeenCalled(); 
    expect(endVirtualTurnSpy).not.toHaveBeenCalled(); 
});
it('should move the player closer to another player and end the turn if no other actions are taken', () => {
  session.ctf = false; 
  jest.spyOn(service as any, 'tryInitiateCombat').mockReturnValue(false); 
  jest.spyOn(service as any, 'tryCollectItems').mockReturnValue(false); 
  const moveToClosestPlayerSpy = jest.spyOn(service as any, 'moveToClosestPlayerIfExists').mockImplementation();
  const endVirtualTurnSpy = jest.spyOn(service as any, 'endVirtualTurnAfterDelay');
  (service as any).handleAggressivePlayerTurn('session-code', server as Server, player, session, {});

  expect(moveToClosestPlayerSpy).toHaveBeenCalledWith(player, session, server, 'session-code');
  expect(endVirtualTurnSpy).toHaveBeenCalledWith('session-code', server, {}, player);
});
it('should move the player closer to the initial position and end the turn if the flag is in inventory and CTF mode is active', () => {

  session.ctf = true;
  player.inventory.push(ObjectsImages.Flag);
  jest.spyOn(service as any, 'tryMoveToInitialPosition').mockReturnValue(false); 
  const moveTheClosestSpy = jest.spyOn(service as any, 'moveTheClosestToDestination').mockImplementation();
  const endVirtualTurnSpy = jest.spyOn(service as any, 'endVirtualTurnAfterDelay');

  (service as any).handleAggressivePlayerTurn('session-code', server as Server, player, session, {});

  expect(moveTheClosestSpy).toHaveBeenCalledWith(player, session, player.initialPosition, server, 'session-code');
  expect(endVirtualTurnSpy).toHaveBeenCalledWith('session-code', server, {}, player);
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
  it('should find players in accessible tiles and proceed', () => {

    const mockPlayers = [targetPlayer];
    jest.spyOn(service as any, 'findPlayersInAccessibleTiles').mockReturnValue(mockPlayers);
    const getPossibleCombatPositionsSpy = jest.spyOn(service as any, 'getPossibleCombatPositions').mockReturnValue([]);
    const result = (service as any).tryInitiateCombat('session-code', server as Server, player, session);
    expect(service['findPlayersInAccessibleTiles']).toHaveBeenCalledWith(player, session);
    expect(getPossibleCombatPositionsSpy).toHaveBeenCalledWith(player, targetPlayer, session);
    expect(result).toBe(false); 
});

it('should return false if no players are in accessible tiles', () => {
  jest.spyOn(service as any, 'findPlayersInAccessibleTiles').mockReturnValue([]);
  const result = (service as any).tryInitiateCombat('session-code', server as Server, player, session);
  expect(service['findPlayersInAccessibleTiles']).toHaveBeenCalledWith(player, session);
  expect(result).toBe(false);
});
it('should execute movement and schedule combat if possible positions are found', () => {
  const mockPlayers = [targetPlayer];
  const mockPositions = [{ row: 1, col: 1 }];
  jest.spyOn(service as any, 'findPlayersInAccessibleTiles').mockReturnValue(mockPlayers);
  jest.spyOn(service as any, 'getPossibleCombatPositions').mockReturnValue(mockPositions);
  const executeMovementSpy = jest.spyOn(service as any, 'executeMovement').mockImplementation();
  const scheduleCombatSpy = jest.spyOn(service as any, 'scheduleCombat').mockImplementation();
  const result = (service as any).tryInitiateCombat('session-code', server as Server, player, session);
  expect(service['findPlayersInAccessibleTiles']).toHaveBeenCalledWith(player, session);
  expect(service['getPossibleCombatPositions']).toHaveBeenCalledWith(player, targetPlayer, session);
  expect(executeMovementSpy).toHaveBeenCalledWith(server, player, session, 'session-code', mockPositions[0]);
  expect(scheduleCombatSpy).toHaveBeenCalledWith('session-code', player, targetPlayer, server);
  expect(result).toBe(true);
});
it('should return false if no possible combat positions are found', () => {
  const mockPlayers = [targetPlayer];
  jest.spyOn(service as any, 'findPlayersInAccessibleTiles').mockReturnValue(mockPlayers);
  jest.spyOn(service as any, 'getPossibleCombatPositions').mockReturnValue([]);
  const result = (service as any).tryInitiateCombat('session-code', server as Server, player, session);
  expect(service['findPlayersInAccessibleTiles']).toHaveBeenCalledWith(player, session);
  expect(service['getPossibleCombatPositions']).toHaveBeenCalledWith(player, targetPlayer, session);
  expect(result).toBe(false);
});
it('should set item priorities based on inventory', () => {
  player.inventory = []; 
  jest.spyOn(service as any, 'getAccessibleItems').mockReturnValue([]);
  (service as any).tryCollectItems('session-code', server as Server, player, session);
  expect(service['getAccessibleItems']).toHaveBeenCalledWith(player, session, AGGRESSIVE_PLAYER_ITEM_PRIORITIES.noItems);
});
it('should return false if no accessible items are found', () => {
  jest.spyOn(service as any, 'getAccessibleItems').mockReturnValue([]);
  const result = (service as any).tryCollectItems('session-code', server as Server, player, session);
  expect(result).toBe(false);
});
it('should process item collection if accessible items are found', () => {
  const mockItem = {
      tile: { position: { row: 1, col: 1 } },
      itemImage: 'mock-item.png',
  };
  jest.spyOn(service as any, 'getAccessibleItems').mockReturnValue([mockItem]);
  jest.spyOn(service as any, 'determineItemToDiscard').mockReturnValue(undefined); 
  const executeMovementSpy = jest.spyOn(service as any, 'executeMovement').mockImplementation();
  const handleItemPickupSpy = jest.spyOn(movementService, 'handleItemPickup').mockImplementation();
  const result = (service as any).tryCollectItems('session-code', server as Server, player, session);
  expect(service['getAccessibleItems']).toHaveBeenCalled();
  expect(executeMovementSpy).toHaveBeenCalledWith(server, player, session, 'session-code', mockItem.tile.position);
  expect(handleItemPickupSpy).toHaveBeenCalledWith(player, session, mockItem.tile.position, server, 'session-code');
  expect(result).toBe(true);
});
it('should discard an item if inventory is full and a better item is found', () => {
  player.inventory = [ObjectsImages.Sword, ObjectsImages.Key];
  const mockItem = {
      tile: { position: { row: 1, col: 1 } },
      itemImage: 'better-item.png',
  };
  jest.spyOn(service as any, 'getAccessibleItems').mockReturnValue([mockItem]);
  jest.spyOn(service as any, 'determineItemToDiscard').mockReturnValue('item1'); 
  const handleItemDiscardSpy = jest.spyOn(movementService, 'handleItemDiscard').mockImplementation();
  const result = (service as any).tryCollectItems('session-code', server as Server, player, session);
  expect(service['determineItemToDiscard']).toHaveBeenCalledWith(player, expect.anything(), mockItem.itemImage);
  expect(handleItemDiscardSpy).toHaveBeenCalledWith(player, 'item1', mockItem.itemImage, server, 'session-code');
  expect(result).toBe(true);
});
it('should collect an item without discarding if inventory has space', () => {
  player.inventory = []; 
  const mockItem = {
      tile: { position: { row: 1, col: 1 } },
      itemImage: 'new-item.png',
  };
  jest.spyOn(service as any, 'getAccessibleItems').mockReturnValue([mockItem]);
  jest.spyOn(service as any, 'determineItemToDiscard').mockReturnValue(undefined); 
  const executeMovementSpy = jest.spyOn(service as any, 'executeMovement').mockImplementation();
  const handleItemPickupSpy = jest.spyOn(movementService, 'handleItemPickup').mockImplementation();

  const result = (service as any).tryCollectItems('session-code', server as Server, player, session);
  expect(executeMovementSpy).toHaveBeenCalledWith(server, player, session, 'session-code', mockItem.tile.position);
  expect(handleItemPickupSpy).toHaveBeenCalledWith(player, session, mockItem.tile.position, server, 'session-code');
  expect(result).toBe(true);
});
it('should return false if all conditions fail', () => {
  jest.spyOn(service as any, 'getAccessibleItems').mockReturnValue([]);
  jest.spyOn(service as any, 'determineItemToDiscard').mockReturnValue(undefined);
  const result = (service as any).tryCollectItems('session-code', server as Server, player, session);
  expect(result).toBe(false);
});
it('should return null if inventory has less than 2 items', () => {
  player.inventory = [ObjectsImages.Potion]; 
  const itemPriorities = [ObjectsImages.Sword, ObjectsImages.Potion]; 
  const newItem = ObjectsImages.Sword;
  const result = (service as any).determineItemToDiscard(player, itemPriorities, newItem);
  expect(result).toBeNull();
});
it('should return the worst priority item if the new item has a higher priority', () => {
  player.inventory = [ObjectsImages.Potion, ObjectsImages.Shield]; 
  const itemPriorities = [ObjectsImages.Flag, ObjectsImages.Potion, ObjectsImages.Shield]; 
  const newItem = ObjectsImages.Flag; 
  const result = (service as any).determineItemToDiscard(player, itemPriorities, newItem);
  expect(result).toBe(ObjectsImages.Shield); 
});
it('should handle inventory with identical priorities and return the first worst item', () => {
  player.inventory = [ObjectsImages.Potion, ObjectsImages.Potion]; 
  const itemPriorities = [ObjectsImages.Sword, ObjectsImages.Potion];
  const newItem = ObjectsImages.Sword; 
  const result = (service as any).determineItemToDiscard(player, itemPriorities, newItem);
  expect(result).toBe(ObjectsImages.Potion); 
});
it('should return null if inventory items or new item are not in the priority list', () => {
  player.inventory = [ObjectsImages.Wheel, ObjectsImages.FlyingShoe]; 
  const itemPriorities = [ObjectsImages.Sword, ObjectsImages.Potion, ObjectsImages.Shield]; 
  const newItem = ObjectsImages.RandomItems; 
  const result = (service as any).determineItemToDiscard(player, itemPriorities, newItem);
  expect(result).toBeNull();
});
it('should calculate the Manhattan distance between two positions', () => {
  const pos1 = { row: 0, col: 0 };
  const pos2 = { row: 3, col: 4 };
  const result = (service as any).calculateDistance(pos1, pos2);
  expect(result).toBe(7); 
});
it('should return 0 when the positions are the same', () => {
  const pos1 = { row: 5, col: 5 };
  const pos2 = { row: 5, col: 5 };
  const result = (service as any).calculateDistance(pos1, pos2);
  expect(result).toBe(0);
});
it('should return the closest player to the virtual player', () => {
  const virtualPlayer = {
      socketId: 'vp1',
      position: { row: 0, col: 0 },
  } as Player;

  const players = [
      {
          socketId: 'p1',
          position: { row: 3, col: 3 },
      },
      {
          socketId: 'p2',
          position: { row: 1, col: 1 },
      },
  ] as Player[];

  const session = { players } as Session;
  const result = (service as any).getClosestPlayer(session, virtualPlayer);
  expect(result).toBe(players[1]); 
});
it('should return null if there are no other players in the session', () => {
  const virtualPlayer = {
      socketId: 'vp1',
      position: { row: 0, col: 0 },
  } as Player;

  const players = [
      {
          socketId: 'vp1',
          position: { row: 0, col: 0 },
      },
  ] as Player[];

  const session = { players } as Session;
  const result = (service as any).getClosestPlayer(session, virtualPlayer);
  expect(result).toBeNull();
});
it('should return one of the closest players if multiple players are at the same distance', () => {
  const virtualPlayer = {
      socketId: 'vp1',
      position: { row: 0, col: 0 },
  } as Player;

  const players = [
      {
          socketId: 'p1',
          position: { row: 2, col: 2 },
      },
      {
          socketId: 'p2',
          position: { row: 2, col: 2 },
      },
  ] as Player[];

  const session = { players } as Session;
  const result = (service as any).getClosestPlayer(session, virtualPlayer);
  expect([players[0], players[1]]).toContain(result); 
});
it('should exclude the virtual player from the closest player calculation', () => {
  const virtualPlayer = {
      socketId: 'vp1',
      position: { row: 0, col: 0 },
  } as Player;

  const players = [
      {
          socketId: 'vp1',
          position: { row: 0, col: 0 }, 
      },
      {
          socketId: 'p1',
          position: { row: 3, col: 3 },
      },
  ] as Player[];

  const session = { players } as Session;
  const result = (service as any).getClosestPlayer(session, virtualPlayer);
  expect(result).toBe(players[1]); 
});
it('should move the player to the best path adjacent to the destination if accessible positions exist', () => {
  const player = { position: { row: 0, col: 0 } } as Player;
  const destination = { row: 3, col: 3 };
  const session = {
      grid: [
          [{}, {}, {}, {}],
          [{}, {}, {}, {}],
          [{}, {}, {}, {}],
          [{}, {}, {}, {}],
      ],
  } as Session;
  const server = { emit: jest.fn() } as unknown as Server;
  const sessionCode = 'session1';
  const adjacentPositions = [
      { row: 3, col: 2 },
      { row: 2, col: 3 },
  ];
  const accessiblePositions = [{ row: 3, col: 2 }];

  jest.spyOn(service['changeGridService'], 'getAdjacentPositions').mockReturnValue(adjacentPositions);
  jest.spyOn(service['movementService'], 'isPositionAccessible').mockImplementation((pos) =>
      accessiblePositions.some((acc) => acc.row === pos.row && acc.col === pos.col),
  );
  jest.spyOn(service as any, 'getBestPathToAdjacentPosition').mockReturnValue(accessiblePositions[0]);
  const executeMovementSpy = jest.spyOn(service as any, 'executeMovement').mockImplementation();
  (service as any).moveTheClosestToDestination(player, session, destination, server, sessionCode);
  expect(service['changeGridService'].getAdjacentPositions).toHaveBeenCalledWith(destination, session.grid);
  expect(service['movementService'].isPositionAccessible).toHaveBeenCalledTimes(adjacentPositions.length);
  expect(service['getBestPathToAdjacentPosition']).toHaveBeenCalledWith(player, session, accessiblePositions);
  expect(executeMovementSpy).toHaveBeenCalledWith(server, player, session, sessionCode, accessiblePositions[0]);
});
it('should not move the player if no best path is found', () => {
  const player = { position: { row: 0, col: 0 } } as Player;
  const destination = { row: 3, col: 3 };
  const session = { grid: [[]] } as Session;
  const server = { emit: jest.fn() } as unknown as Server;
  const sessionCode = 'session1';
  const adjacentPositions = [
      { row: 3, col: 2 },
      { row: 2, col: 3 },
  ];
  const accessiblePositions = [{ row: 3, col: 2 }];

  jest.spyOn(service['changeGridService'], 'getAdjacentPositions').mockReturnValue(adjacentPositions);
  jest.spyOn(service['movementService'], 'isPositionAccessible').mockImplementation((pos) =>
      accessiblePositions.some((acc) => acc.row === pos.row && acc.col === pos.col),
  );
  jest.spyOn(service as any, 'getBestPathToAdjacentPosition').mockReturnValue(null);
  const executeMovementSpy = jest.spyOn(service as any, 'executeMovement');
  (service as any).moveTheClosestToDestination(player, session, destination, server, sessionCode);
  expect(service['getBestPathToAdjacentPosition']).toHaveBeenCalledWith(player, session, accessiblePositions);
  expect(executeMovementSpy).not.toHaveBeenCalled();
});
it('should move to the closest destination and end the turn if tryMoveToInitialPosition fails', () => {
  const sessionCode = 'session1';
  const server = { emit: jest.fn() } as unknown as Server;
  const session = {
      ctf: true,
      grid: [[]],
      players: [player],
  } as Session;
  const sessions = { [sessionCode]: session };
  player.inventory = [ObjectsImages.Flag];

  jest.spyOn(service as any, 'tryMoveToInitialPosition').mockReturnValue(false);
  const moveTheClosestToDestinationSpy = jest.spyOn(service as any, 'moveTheClosestToDestination').mockImplementation();
  const endVirtualTurnAfterDelaySpy = jest.spyOn(service as any, 'endVirtualTurnAfterDelay').mockImplementation();
  (service as any).handleDefensivePlayerTurn(sessionCode, server, player, session, sessions);

  expect(service['tryMoveToInitialPosition']).toHaveBeenCalledWith(player, session, server, sessionCode);
  expect(moveTheClosestToDestinationSpy).toHaveBeenCalledWith(
      player,
      session,
      player.initialPosition,
      server,
      sessionCode,
  );
  expect(endVirtualTurnAfterDelaySpy).toHaveBeenCalledTimes(1);
  expect(endVirtualTurnAfterDelaySpy).toHaveBeenCalledWith(sessionCode, server, sessions, player);
});
it('should move to the closest player and end the turn if no other actions are taken', () => {
  const sessionCode = 'session1';
  const server = { emit: jest.fn() } as unknown as Server;
  const session = { grid: [[]], players: [player, targetPlayer] } as Session;
  const sessions = { [sessionCode]: session };
  jest.spyOn(service as any, 'tryCollectDefensiveItems').mockReturnValue(false);
  jest.spyOn(service as any, 'tryMoveToInitialPosition').mockReturnValue(false);
  jest.spyOn(service as any, 'tryInitiateCombat').mockReturnValue(false);
  const moveToClosestPlayerSpy = jest.spyOn(service as any, 'moveToClosestPlayerIfExists').mockImplementation();
  const endVirtualTurnAfterDelaySpy = jest.spyOn(service as any, 'endVirtualTurnAfterDelay').mockImplementation();
  (service as any).handleDefensivePlayerTurn(sessionCode, server, player, session, sessions);
  expect(service['tryCollectDefensiveItems']).toHaveBeenCalledWith(sessionCode, server, player, session);
  expect(service['tryMoveToInitialPosition']).not.toHaveBeenCalled(); 
  expect(service['tryInitiateCombat']).toHaveBeenCalledWith(sessionCode, server, player, session);
  expect(moveToClosestPlayerSpy).toHaveBeenCalledWith(player, session, server, sessionCode);
  expect(endVirtualTurnAfterDelaySpy).toHaveBeenCalledWith(sessionCode, server, sessions, player);
});
it('should return an empty array if all accessible items have worse or equal priority', () => {
  const player = { inventory: [ObjectsImages.Sword, ObjectsImages.Shield] } as Player;
  const accessibleItems = [
      { tile: { position: { row: 0, col: 0 } }, itemImage: ObjectsImages.Shield },
  ];
  const itemPriorities = [ObjectsImages.Sword, ObjectsImages.Shield, ObjectsImages.Potion];
  const result = (service as any).filterBetterItems(player, accessibleItems, itemPriorities);
  expect(result).toEqual([]); 
});

it('should filter better items if the player has 2 or more items in inventory', () => {
  const player = { inventory: [ObjectsImages.Shield, ObjectsImages.Potion] } as Player;
  const session = { grid: [[]] } as Session;
  const accessibleTilesWithItems = [
      { position: { row: 0, col: 0 }, itemImage: ObjectsImages.Sword },
      { position: { row: 1, col: 1 }, itemImage: ObjectsImages.Shield },
  ];
  const accessibleItems = [
      { tile: { position: { row: 0, col: 0 } }, itemImage: ObjectsImages.Sword },
      { tile: { position: { row: 1, col: 1 } }, itemImage: ObjectsImages.Shield },
  ];
  const itemPriorities = [ObjectsImages.Sword, ObjectsImages.Shield, ObjectsImages.Potion];

  jest.spyOn(service as any, 'filterAccessibleTilesWithItems').mockReturnValue(accessibleTilesWithItems);
  jest.spyOn(service as any, 'mapTilesToItems').mockReturnValue(accessibleItems);
  jest.spyOn(service as any, 'sortItemsByPriority');
  const filterBetterItemsSpy = jest.spyOn(service as any, 'filterBetterItems').mockReturnValue([
      { tile: { position: { row: 0, col: 0 } }, itemImage: ObjectsImages.Sword },
  ]);
  const result = (service as any).getAccessibleItems(player, session, itemPriorities);
  expect(service['filterAccessibleTilesWithItems']).toHaveBeenCalledWith(player, session);
  expect(service['mapTilesToItems']).toHaveBeenCalledWith(accessibleTilesWithItems, session);
  expect(service['sortItemsByPriority']).toHaveBeenCalledWith(accessibleItems, itemPriorities);
  expect(filterBetterItemsSpy).toHaveBeenCalledWith(player, accessibleItems, itemPriorities);
  expect(result).toEqual([{ tile: { position: { row: 0, col: 0 } }, itemImage: ObjectsImages.Sword }]);
});
it('should call moveTheClosestToDestination if closestPlayer exists', () => {
  const player = { name: 'Player1', position: { row: 1, col: 1 } } as Player;
  const closestPlayer = { name: 'Player2', position: { row: 2, col: 2 } } as Player;
  const session = { players: [player, closestPlayer] } as Session;
  const server = { emit: jest.fn() } as unknown as Server;
  const sessionCode = 'session1';

  jest.spyOn(service as any, 'getClosestPlayer').mockReturnValue(closestPlayer);
  const moveTheClosestToDestinationSpy = jest
      .spyOn(service as any, 'moveTheClosestToDestination')
      .mockImplementation();
  (service as any).moveToClosestPlayerIfExists(player, session, server, sessionCode);
  expect(service['getClosestPlayer']).toHaveBeenCalledWith(session, player);
  expect(moveTheClosestToDestinationSpy).toHaveBeenCalledWith(
      player,
      session,
      closestPlayer.position,
      server,
      sessionCode,
  );
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

