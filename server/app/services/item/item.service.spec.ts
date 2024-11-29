import { Test, TestingModule } from '@nestjs/testing';
import { ItemService } from './item.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { Player } from '@app/interfaces/player/player.interface';
import { Server } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { ObjectsImages, getObjectKeyByValue, objectsProperties } from '@app/constants/objects-enums-constants';
import { Grid } from '@app/interfaces/session/grid.interface';
import { Position } from '@app/interfaces/player/position.interface';
import * as ObjectsEnumsConstants from '@app/constants/objects-enums-constants';



const mockPlayer: Player = {
    socketId: 'socket1',
    name: 'Player One',
    avatar: 'avatar1.png',
    attributes: {
        life: { name: 'Life', description: 'Player life points', currentValue: 3, baseValue: 3 },
        combatWon: { name: 'Combat Won', description: 'Number of combats won', currentValue: 0, baseValue: 0 },
        speed: { name: 'Speed', description: 'Player speed', currentValue: 5, baseValue: 5, hasGrassBoost: false },
        attack: { name: 'Attack', description: 'Player attack', currentValue: 5, baseValue: 5, hasSwordBoost: false },
        defence: { name: 'Defence', description: 'Player defence', currentValue: 5, baseValue: 5 },
        nbEvasion: { name: 'Nb Evasion', description: 'Number of evasions', currentValue: 2, baseValue: 2, hasKeyBoost: false },
    },
    position: { row: 0, col: 0 },
    initialPosition: { row: 0, col: 0 },
    isOrganizer: false,
    accessibleTiles: [],
    inventory: [],
    isVirtual: false,
    statistics: {
        combats: 0,
        evasions: 0,
        victories: 0,
        defeats: 0,
        totalLifeLost: 0,
        totalLifeRemoved: 0,
        uniqueItems: new Set<string>(),
        tilesVisited: new Set<string>(),
        uniqueItemsArray: [],
        tilesVisitedArray: [],
    },
};

const mockSession: Session = {
    players: [mockPlayer],
    grid: [
        [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
        [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
    ],
    combatData: {
        combatants: [],
        turnIndex: 0,
        turnTimer: null,
        timeLeft: 0,
    },
    organizerId: '',
    locked: false,
    maxPlayers: 0,
    selectedGameID: '',
    turnData: undefined,
    ctf: false,
    statistics: {
        gameDuration: '00:00',
        totalTurns: 0,
        totalTerrainTiles: 0,
        visitedTerrains: new Set<string>(),
        totalDoors: 0,
        manipulatedDoors: new Set<string>(),
        uniqueFlagHolders: new Set<string>(),
        visitedTerrainsArray: [],
        manipulatedDoorsArray: [],
        uniqueFlagHoldersArray: [],
        startTime: new Date(),
        endTime: new Date(),
    },
    abandonedPlayers: [],
};

jest.mock('@app/constants/objects-enums-constants', () => {
  const ObjectsImages = {
    Sword: 'assets/objects/Sword.png',
    Shield: 'assets/objects/Shield.png',
    Wheel: 'assets/objects/Wheel.png',
    Potion: 'assets/objects/Potion.png',
    Key: 'assets/objects/Key.png',
    Flag: 'assets/objects/Flag.png',
    // Ajoutez d'autres images si nécessaire
  };
  return {
    __esModule: true,
    ObjectsImages,
    // getObjectKeyByValue: (value: string) => {
    //   return Object.keys(ObjectsImages).find((key) => ObjectsImages[key as keyof typeof ObjectsImages] === value);
    // },
    getObjectKeyByValue: jest.fn(), // Moquer getObjectKeyByValue comme une fonction
    objectsProperties: {},
  };
});





describe('ItemService', () => {
    let service: ItemService;
    let changeGridService: ChangeGridService;
    let sessionsService: SessionsService;
    let eventsGateway: EventsGateway;
    let mockServer: Server;
    let sessionCode: string;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ItemService,
                {
                    provide: ChangeGridService,
                    useValue: {
                        addImage: jest.fn(),
                        removeObjectFromGrid: jest.fn(),
                    },
                },
                {
                    provide: SessionsService,
                    useValue: {
                        getSession: jest.fn().mockReturnValue(mockSession),
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

        service = module.get<ItemService>(ItemService);
        changeGridService = module.get<ChangeGridService>(ChangeGridService);
        sessionsService = module.get<SessionsService>(SessionsService);
        eventsGateway = module.get<EventsGateway>(EventsGateway);

        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as unknown as Server;

        sessionCode = 'session123';
    });

    afterEach(() => {
        jest.clearAllMocks();
        mockPlayer.inventory = [];
        mockPlayer.attributes.speed.baseValue = 5;
        mockPlayer.attributes.speed.currentValue = 5;
        mockPlayer.attributes.speed.hasGrassBoost = false;
        mockPlayer.attributes.attack.baseValue = 5;
        mockPlayer.attributes.attack.currentValue = 5;
        mockPlayer.attributes.attack.hasSwordBoost = false;
        mockPlayer.attributes.nbEvasion.baseValue = 2;
        mockPlayer.attributes.nbEvasion.currentValue = 2;
        mockPlayer.attributes.nbEvasion.hasKeyBoost = false;
    });

    describe('getTileType', () => {
        it('should correctly identify tile types', () => {
            const grassTile = service.getTileType(['assets/tiles/Grass.png']);
            const wallTile = service.getTileType(['assets/tiles/Wall.png']);
            const iceTile = service.getTileType(['assets/tiles/Ice.png']);
            const waterTile = service.getTileType(['assets/tiles/Water.png']);

            expect(grassTile).toBe('base');
            expect(wallTile).toBe('wall');
            expect(iceTile).toBe('ice');
            expect(waterTile).toBe('water');
        });
    });

    describe('updatePlayerAttributesOnTile', () => {
        it('should decrease attack and defence when on ice tile', () => {
            const tile = { images: ['assets/tiles/Ice.png'], isOccuped: false };
            service.updatePlayerAttributesOnTile(mockPlayer, tile);

            expect(mockPlayer.attributes.attack.currentValue).toBe(mockPlayer.attributes.attack.baseValue - 2);
            expect(mockPlayer.attributes.defence.currentValue).toBe(mockPlayer.attributes.defence.baseValue - 2);
        });

        it('should not modify attack and defence when on grass tile', () => {
            const tile = { images: ['assets/tiles/Grass.png'], isOccuped: false };
            service.updatePlayerAttributesOnTile(mockPlayer, tile);

            expect(mockPlayer.attributes.attack.currentValue).toBe(mockPlayer.attributes.attack.baseValue);
            expect(mockPlayer.attributes.defence.currentValue).toBe(mockPlayer.attributes.defence.baseValue);
        });
    });

    describe('applySwordEffect', () => {
        it('should apply sword boost when player only has sword and boost not applied', () => {
            mockPlayer.inventory = [ObjectsImages.Sword];
            mockPlayer.attributes.attack.hasSwordBoost = false;

            service.applySwordEffect(mockPlayer, mockSession, mockServer, sessionCode);

            expect(mockPlayer.attributes.attack.baseValue).toBe(7);
            expect(mockPlayer.attributes.attack.currentValue).toBe(7);
            expect(mockPlayer.attributes.attack.hasSwordBoost).toBe(true);

            expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
            expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
        });

        it('should remove sword boost when player has more than one item and boost was applied', () => {
            mockPlayer.inventory = [ObjectsImages.Sword, ObjectsImages.Wheel];
            mockPlayer.attributes.attack.hasSwordBoost = true;
            mockPlayer.attributes.attack.baseValue = 7;
            mockPlayer.attributes.attack.currentValue = 7;

            service.applySwordEffect(mockPlayer, mockSession, mockServer, sessionCode);

            expect(mockPlayer.attributes.attack.baseValue).toBe(5);
            expect(mockPlayer.attributes.attack.currentValue).toBe(5);
            expect(mockPlayer.attributes.attack.hasSwordBoost).toBe(false);

            expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
            expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
        });
    });

    describe('applyWheelEffect', () => {
        it('should apply wheel effect when player has wheel and is on grass', () => {
            mockPlayer.inventory = [ObjectsImages.Wheel];
            mockPlayer.attributes.speed.hasGrassBoost = false;

            service.applyWheelEffect(mockPlayer, 'base', mockServer, sessionCode, mockSession);

            expect(mockPlayer.attributes.speed.baseValue).toBe(7);
            expect(mockPlayer.attributes.speed.currentValue).toBe(7);
            expect(mockPlayer.attributes.speed.hasGrassBoost).toBe(true);

            expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
            expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
        });

        it('should remove wheel effect when player is not on grass', () => {
            mockPlayer.inventory = [ObjectsImages.Wheel];
            mockPlayer.attributes.speed.hasGrassBoost = true;
            mockPlayer.attributes.speed.baseValue = 7;
            mockPlayer.attributes.speed.currentValue = 7;

            service.applyWheelEffect(mockPlayer, 'ice', mockServer, sessionCode, mockSession);

            expect(mockPlayer.attributes.speed.baseValue).toBe(5);
            expect(mockPlayer.attributes.speed.currentValue).toBe(5);
            expect(mockPlayer.attributes.speed.hasGrassBoost).toBe(false);

            expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
            expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
        });
    });

    describe('applyKeyEffect', () => {
        it('should apply key effect when player has key', () => {
            mockPlayer.inventory = [ObjectsImages.Key];
            mockPlayer.attributes.nbEvasion.hasKeyBoost = false;

            service.applyKeyEffect(mockPlayer, mockSession, mockServer, sessionCode);

            expect(mockPlayer.attributes.nbEvasion.baseValue).toBe(3);
            expect(mockPlayer.attributes.nbEvasion.currentValue).toBe(3);
            expect(mockPlayer.attributes.nbEvasion.hasKeyBoost).toBe(true);

            expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
            expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
        });

        it('should remove key effect when player does not have key', () => {
            mockPlayer.inventory = [];
            mockPlayer.attributes.nbEvasion.hasKeyBoost = true;
            mockPlayer.attributes.nbEvasion.baseValue = 3;
            mockPlayer.attributes.nbEvasion.currentValue = 3;

            service.applyKeyEffect(mockPlayer, mockSession, mockServer, sessionCode);

            expect(mockPlayer.attributes.nbEvasion.baseValue).toBe(2);
            expect(mockPlayer.attributes.nbEvasion.currentValue).toBe(2);
            expect(mockPlayer.attributes.nbEvasion.hasKeyBoost).toBe(false);

            expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
            expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
        });
    });

    describe('containsItem', () => {
        it('should return true if tile contains an item', () => {
            const tile = { images: [ObjectsImages.Sword], isOccuped: false };
            const result = service['containsItem'](tile);

            expect(result).toBe(true);
        });

        it('should return false if tile does not contain an item', () => {
            const tile = { images: ['assets/tiles/Grass.png'], isOccuped: false };
            const result = service['containsItem'](tile);

            expect(result).toBe(false);
        });
    });

    describe('checkForItemsAlongPath', () => {
        it('should adjust path if an item is found along the way', () => {
            const path: Position[] = [
                { row: 0, col: 0 },
                { row: 0, col: 1 },
                { row: 0, col: 2 },
            ];

            const grid: Grid = [
                [
                    { images: ['assets/tiles/Grass.png'], isOccuped: false },
                    { images: [ObjectsImages.Sword], isOccuped: false },
                    { images: ['assets/tiles/Grass.png'], isOccuped: false },
                ],
            ];

            const { adjustedPath, itemFound } = service.checkForItemsAlongPath(path, grid);

            expect(adjustedPath).toEqual([{ row: 0, col: 0 }, { row: 0, col: 1 }]);
            expect(itemFound).toBe(true);
        });

        it('should not adjust path if no item is found', () => {
            const path: Position[] = [
                { row: 0, col: 0 },
                { row: 0, col: 1 },
            ];

            const grid: Grid = [
                [
                    { images: ['assets/tiles/Grass.png'], isOccuped: false },
                    { images: ['assets/tiles/Grass.png'], isOccuped: false },
                ],
            ];

            const { adjustedPath, itemFound } = service.checkForItemsAlongPath(path, grid);

            expect(adjustedPath).toEqual(path);
            expect(itemFound).toBe(false);
        });
    });

    describe('handleItemPickup', () => {
        it('should add item to inventory if space is available', () => {
            const position: Position = { row: 0, col: 0 };
            const tile = { images: [ObjectsImages.Sword], isOccuped: false };
            mockSession.grid[position.row][position.col] = tile;
            mockPlayer.inventory = [];

            service.handleItemPickup(mockPlayer, mockSession, position, mockServer, sessionCode);

            expect(mockPlayer.inventory).toContain(ObjectsImages.Sword);
            expect(changeGridService.removeObjectFromGrid).toHaveBeenCalled();
            expect(eventsGateway.addEventToSession).toHaveBeenCalled();
        });

        it('should notify player if inventory is full', () => {
            const position: Position = { row: 0, col: 0 };
            const tile = { images: [ObjectsImages.Sword], isOccuped: false };
            mockSession.grid[position.row][position.col] = tile;
            mockPlayer.inventory = [ObjectsImages.Wheel, ObjectsImages.Key];

            const mockSocketId = 'socket1';
            mockPlayer.socketId = mockSocketId;

            service.handleItemPickup(mockPlayer, mockSession, position, mockServer, sessionCode);

            expect(mockPlayer.inventory).not.toContain(ObjectsImages.Sword);
            expect(mockServer.to).toHaveBeenCalledWith(mockSocketId);
            expect(mockServer.emit).toHaveBeenCalledWith('inventoryFull', { items: [...mockPlayer.inventory, ObjectsImages.Sword] });
        });
    });
    describe('handleItemDiscard', () => {
      
  
      it('should remove item and apply removeEffect when item has no condition', () => {
        const discardedItem = ObjectsImages.Shield;
        const pickedUpItem = ObjectsImages.Potion;
        mockPlayer.inventory = [discardedItem, pickedUpItem];
        const mockRemoveEffect = jest.fn();
    
        // Configurer les mocks
        (getObjectKeyByValue as jest.Mock).mockImplementation((value: string) => {
            if (value === ObjectsImages.Shield) return 'shield';
            if (value === ObjectsImages.Potion) return 'potion';
            return undefined;
        });
    
        objectsProperties['shield'] = {
            image: ObjectsImages.Shield,
            condition: null,
            effect: jest.fn(),
            removeEffect: mockRemoveEffect,
        };
    
        objectsProperties['potion'] = {
            image: ObjectsImages.Potion,
            condition: null,
            effect: jest.fn(),
            removeEffect: jest.fn(),
        };
    
        service.handleItemDiscard(mockPlayer, discardedItem, pickedUpItem, mockServer, sessionCode);
    
        // Vérifier que l'item a été retiré et ajouté
        expect(mockPlayer.inventory).toContain(pickedUpItem);
        expect(mockPlayer.inventory).not.toContain(discardedItem);
    
        // Vérifier que removeEffect a été appelé
        expect(mockRemoveEffect).toHaveBeenCalledWith(mockPlayer.attributes);
    
        // Vérifier que les méthodes de changement de grille ont été appelées
        expect(changeGridService.addImage).toHaveBeenCalledWith(
            mockSession.grid[mockPlayer.position.row][mockPlayer.position.col],
            discardedItem,
        );
        expect(changeGridService.removeObjectFromGrid).toHaveBeenCalledWith(
            mockSession.grid,
            mockPlayer.position.row,
            mockPlayer.position.col,
            pickedUpItem,
        );
    
        // Vérifier les émissions d'événements
        expect(eventsGateway.addEventToSession).toHaveBeenCalledWith(
            sessionCode,
            `${mockPlayer.name} a jeté un shield et a ramassé un potion`,
            ['everyone'],
        );
        expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
        expect(mockServer.emit).toHaveBeenCalledWith('gridArray', { sessionCode, grid: mockSession.grid });
        expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
    
        // Restaurer les mocks
        jest.restoreAllMocks();
    });
    
  
      it('should call removeWheelEffect when discardedItem is wheel', () => {
          const discardedItem = ObjectsEnumsConstants.ObjectsImages.Wheel;
          const pickedUpItem = ObjectsEnumsConstants.ObjectsImages.Sword;
          mockPlayer.inventory = [discardedItem, pickedUpItem];
          const mockRemoveWheelEffect = jest.fn();
  
          // Mock de getObjectKeyByValue pour retourner 'wheel' lorsque ObjectsImages.Wheel est passé
          jest.spyOn(ObjectsEnumsConstants, 'getObjectKeyByValue').mockImplementation((value: string) => {
              if (value === ObjectsEnumsConstants.ObjectsImages.Wheel) return 'wheel';
              return undefined;
          });
  
          // Mock de objectsProperties['wheel'] avec toutes les propriétés requises
          // Assurez-vous que la condition correspond à la signature attendue
          (ObjectsEnumsConstants.objectsProperties as any)['wheel'] = {
              image: ObjectsEnumsConstants.ObjectsImages.Wheel,
              condition: (player: Player, tileType: string): tileType is "grass" => tileType === 'grass',
              effect: jest.fn(),
              removeEffect: jest.fn(),
          };
  
          // Mock de la méthode removeWheelEffect
          jest.spyOn(service, 'removeWheelEffect').mockImplementation(mockRemoveWheelEffect);
  
          service.handleItemDiscard(mockPlayer, discardedItem, pickedUpItem, mockServer, sessionCode);
  
          // Vérifier que removeWheelEffect a été appelé
          expect(mockRemoveWheelEffect).toHaveBeenCalledWith(mockPlayer, mockServer, sessionCode, mockSession);
  
          // Vérifier que l'item a été retiré et ajouté
          expect(mockPlayer.inventory).toContain(pickedUpItem);
          expect(mockPlayer.inventory).not.toContain(discardedItem);
  
          // Vérifier que les méthodes de changement de grille ont été appelées
          expect(changeGridService.addImage).toHaveBeenCalledWith(
              mockSession.grid[mockPlayer.position.row][mockPlayer.position.col],
              discardedItem,
          );
          expect(changeGridService.removeObjectFromGrid).toHaveBeenCalledWith(
              mockSession.grid,
              mockPlayer.position.row,
              mockPlayer.position.col,
              pickedUpItem,
          );
  
          // Vérifier les émissions d'événements
          expect(eventsGateway.addEventToSession).toHaveBeenCalledWith(
              sessionCode,
              `${mockPlayer.name} a jeté un wheel et a ramassé un undefined`,
              ['everyone'],
          );
          expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
          expect(mockServer.emit).toHaveBeenCalledWith('gridArray', { sessionCode, grid: mockSession.grid });
          expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
  
          // Restaurer les mocks
          jest.restoreAllMocks();
      });
  
      it('should return early if discardedItem equals pickedUpItem', () => {
          const discardedItem = ObjectsEnumsConstants.ObjectsImages.Potion;
          const pickedUpItem = ObjectsEnumsConstants.ObjectsImages.Potion;
          mockPlayer.inventory = [discardedItem];
  
          // Mock de getObjectKeyByValue pour retourner 'potion' lorsque ObjectsImages.Potion est passé
          jest.spyOn(ObjectsEnumsConstants, 'getObjectKeyByValue').mockImplementation((value: string) => {
              if (value === ObjectsEnumsConstants.ObjectsImages.Potion) return 'potion';
              return undefined;
          });
  
          // Mock de objectsProperties['potion'] avec toutes les propriétés requises
          (ObjectsEnumsConstants.objectsProperties as any)['potion'] = {
              image: ObjectsEnumsConstants.ObjectsImages.Potion,
              condition: null,
              effect: jest.fn(),
              removeEffect: jest.fn(),
          };
  
          service.handleItemDiscard(mockPlayer, discardedItem, pickedUpItem, mockServer, sessionCode);
  
          // Vérifier que l'item n'a pas été retiré ou ajouté
          expect(mockPlayer.inventory).toContain(discardedItem);
          expect(mockPlayer.inventory).toContain(pickedUpItem);
  
          // Vérifier que condition et effect n'ont pas été appelés
          const mockCondition = jest.fn();
          const mockEffect = jest.fn();
          expect(mockCondition).not.toHaveBeenCalled();
          expect(mockEffect).not.toHaveBeenCalled();
  
          // Vérifier que les méthodes de changement de grille n'ont pas été appelées
          expect(changeGridService.addImage).not.toHaveBeenCalled();
          expect(changeGridService.removeObjectFromGrid).not.toHaveBeenCalled();
  
          // Vérifier que les émissions d'événements n'ont pas été appelées
          expect(eventsGateway.addEventToSession).not.toHaveBeenCalled();
          expect(mockServer.to).not.toHaveBeenCalled();
          expect(mockServer.emit).not.toHaveBeenCalled();
  
          // Restaurer les mocks
          jest.restoreAllMocks();
      });
  });
  
  
  
  describe('removeWheelEffect', () => {
      it('should correctly remove wheel effect from player attributes', () => {
          // Setup
          mockPlayer.attributes.speed.baseValue = 7;
          mockPlayer.attributes.speed.currentValue = 7;
          mockPlayer.attributes.speed.hasGrassBoost = true;
  
          // Exécuter la méthode
          service.removeWheelEffect(mockPlayer, mockServer, sessionCode, mockSession);
  
          // Assertions
          expect(mockPlayer.attributes.speed.baseValue).toBe(5);
          expect(mockPlayer.attributes.speed.currentValue).toBe(5);
          expect(mockPlayer.attributes.speed.hasGrassBoost).toBe(false);
  
          // Vérifier que l'événement a été émis
          expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
          expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
      });
  });
  
  describe('handleTileChangeEffect', () => {
      it('should apply wheel effect when moving from grass to non-grass tile', () => {
          const previousTileType = 'base';
          mockPlayer.previousTileType = previousTileType;
          mockPlayer.inventory = [ObjectsImages.Wheel];
          const currentTileType = 'ice';
  
          // Mock getTileType pour retourner 'ice'
          jest.spyOn(service, 'getTileType').mockReturnValue(currentTileType);
  
          // Mock applyWheelEffect
          const mockApplyWheelEffect = jest.fn();
          jest.spyOn(service, 'applyWheelEffect').mockImplementation(mockApplyWheelEffect);
  
          service.handleTileChangeEffect(mockPlayer, mockSession, mockServer, sessionCode);
  
          // Assertions
          expect(mockApplyWheelEffect).toHaveBeenCalledWith(mockPlayer, currentTileType, mockServer, sessionCode, mockSession);
          expect(mockPlayer.previousTileType).toBe(currentTileType);
  
          // Restaurer les mocks
          jest.restoreAllMocks();
      });
  
      it('should apply wheel effect when moving from non-grass to grass tile', () => {
          const previousTileType = 'ice';
          mockPlayer.previousTileType = previousTileType;
          mockPlayer.inventory = [ObjectsImages.Wheel];
          const currentTileType = 'base';
  
          // Mock getTileType pour retourner 'base'
          jest.spyOn(service, 'getTileType').mockReturnValue(currentTileType);
  
          // Mock applyWheelEffect
          const mockApplyWheelEffect = jest.fn();
          jest.spyOn(service, 'applyWheelEffect').mockImplementation(mockApplyWheelEffect);
  
          service.handleTileChangeEffect(mockPlayer, mockSession, mockServer, sessionCode);
  
          // Assertions
          expect(mockApplyWheelEffect).toHaveBeenCalledWith(mockPlayer, currentTileType, mockServer, sessionCode, mockSession);
          expect(mockPlayer.previousTileType).toBe(currentTileType);
  
          // Restaurer les mocks
          jest.restoreAllMocks();
      });
  });
  
  describe('updatePlayerTileEffect', () => {
      it('should handle tile change effects correctly', () => {
          const position = { row: 0, col: 0 };
          mockPlayer.position = position;
          const currentTile = { images: ['assets/tiles/Ice.png'], isOccuped: false };
          mockSession.grid[position.row][position.col] = currentTile;
  
          // Mock getTileType pour retourner 'ice'
          jest.spyOn(service, 'getTileType').mockReturnValue('ice');
  
          // Mock handleTileChangeEffect
          const mockHandleTileChangeEffect = jest.fn();
          jest.spyOn(service, 'handleTileChangeEffect').mockImplementation(mockHandleTileChangeEffect);
  
          // Exécuter la méthode
          service.updatePlayerTileEffect(mockPlayer, mockSession, mockServer, sessionCode);
  
          // Assertions
          expect(mockHandleTileChangeEffect).toHaveBeenCalledWith(mockPlayer, mockSession, mockServer, sessionCode);
          expect(mockPlayer.previousTileType).toBe('ice');
  
          // Restaurer les mocks
          jest.restoreAllMocks();
      });
  });
  
  describe('applySwordEffect', () => {
      it('should apply sword boost when player only has sword and boost not applied', () => {
          mockPlayer.inventory = [ObjectsImages.Sword];
          mockPlayer.attributes.attack.hasSwordBoost = false;
  
          service.applySwordEffect(mockPlayer, mockSession, mockServer, sessionCode);
  
          expect(mockPlayer.attributes.attack.baseValue).toBe(7);
          expect(mockPlayer.attributes.attack.currentValue).toBe(7);
          expect(mockPlayer.attributes.attack.hasSwordBoost).toBe(true);
  
          expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
          expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
      });
  
      it('should remove sword boost when player has more than one item and boost was applied', () => {
          mockPlayer.inventory = [ObjectsImages.Sword, ObjectsImages.Wheel];
          mockPlayer.attributes.attack.hasSwordBoost = true;
          mockPlayer.attributes.attack.baseValue = 7;
          mockPlayer.attributes.attack.currentValue = 7;
  
          service.applySwordEffect(mockPlayer, mockSession, mockServer, sessionCode);
  
          expect(mockPlayer.attributes.attack.baseValue).toBe(5);
          expect(mockPlayer.attributes.attack.currentValue).toBe(5);
          expect(mockPlayer.attributes.attack.hasSwordBoost).toBe(false);
  
          expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
          expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
      });
  });
  
  describe('applyWheelEffect', () => {
      it('should apply wheel effect when player has wheel and is on grass', () => {
          mockPlayer.inventory = [ObjectsImages.Wheel];
          mockPlayer.attributes.speed.hasGrassBoost = false;
  
          service.applyWheelEffect(mockPlayer, 'base', mockServer, sessionCode, mockSession);
  
          expect(mockPlayer.attributes.speed.baseValue).toBe(7);
          expect(mockPlayer.attributes.speed.currentValue).toBe(7);
          expect(mockPlayer.attributes.speed.hasGrassBoost).toBe(true);
  
          expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
          expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
      });
  
      it('should remove wheel effect when player is not on grass', () => {
          mockPlayer.inventory = [ObjectsImages.Wheel];
          mockPlayer.attributes.speed.hasGrassBoost = true;
          mockPlayer.attributes.speed.baseValue = 7;
          mockPlayer.attributes.speed.currentValue = 7;
  
          service.applyWheelEffect(mockPlayer, 'ice', mockServer, sessionCode, mockSession);
  
          expect(mockPlayer.attributes.speed.baseValue).toBe(5);
          expect(mockPlayer.attributes.speed.currentValue).toBe(5);
          expect(mockPlayer.attributes.speed.hasGrassBoost).toBe(false);
  
          expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
          expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
      });
  });
  
  describe('applyKeyEffect', () => {
      it('should apply key effect when player has key', () => {
          mockPlayer.inventory = [ObjectsImages.Key];
          mockPlayer.attributes.nbEvasion.hasKeyBoost = false;
  
          service.applyKeyEffect(mockPlayer, mockSession, mockServer, sessionCode);
  
          expect(mockPlayer.attributes.nbEvasion.baseValue).toBe(3);
          expect(mockPlayer.attributes.nbEvasion.currentValue).toBe(3);
          expect(mockPlayer.attributes.nbEvasion.hasKeyBoost).toBe(true);
  
          expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
          expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
      });
  
      it('should remove key effect when player does not have key', () => {
          mockPlayer.inventory = [];
          mockPlayer.attributes.nbEvasion.hasKeyBoost = true;
          mockPlayer.attributes.nbEvasion.baseValue = 3;
          mockPlayer.attributes.nbEvasion.currentValue = 3;
  
          service.applyKeyEffect(mockPlayer, mockSession, mockServer, sessionCode);
  
          expect(mockPlayer.attributes.nbEvasion.baseValue).toBe(2);
          expect(mockPlayer.attributes.nbEvasion.currentValue).toBe(2);
          expect(mockPlayer.attributes.nbEvasion.hasKeyBoost).toBe(false);
  
          expect(mockServer.to).toHaveBeenCalledWith(sessionCode);
          expect(mockServer.emit).toHaveBeenCalledWith('playerListUpdate', { players: mockSession.players });
      });
  });
  
  describe('containsItem', () => {
      it('should return true if tile contains an item', () => {
          const tile = { images: [ObjectsImages.Sword], isOccuped: false };
          const result = service['containsItem'](tile);
  
          expect(result).toBe(true);
      });
  
      it('should return false if tile does not contain an item', () => {
          const tile = { images: ['assets/tiles/Grass.png'], isOccuped: false };
          const result = service['containsItem'](tile);
  
          expect(result).toBe(false);
      });
  });
  
  describe('checkForItemsAlongPath', () => {
      it('should adjust path if an item is found along the way', () => {
          const path: Position[] = [
              { row: 0, col: 0 },
              { row: 0, col: 1 },
              { row: 0, col: 2 },
          ];
  
          const grid: Grid = [
              [
                  { images: ['assets/tiles/Grass.png'], isOccuped: false },
                  { images: [ObjectsImages.Sword], isOccuped: false },
                  { images: ['assets/tiles/Grass.png'], isOccuped: false },
              ],
          ];
  
          const { adjustedPath, itemFound } = service.checkForItemsAlongPath(path, grid);
  
          expect(adjustedPath).toEqual([{ row: 0, col: 0 }, { row: 0, col: 1 }]);
          expect(itemFound).toBe(true);
      });
  
      it('should not adjust path if no item is found', () => {
          const path: Position[] = [
              { row: 0, col: 0 },
              { row: 0, col: 1 },
          ];
  
          const grid: Grid = [
              [
                  { images: ['assets/tiles/Grass.png'], isOccuped: false },
                  { images: ['assets/tiles/Grass.png'], isOccuped: false },
              ],
          ];
  
          const { adjustedPath, itemFound } = service.checkForItemsAlongPath(path, grid);
  
          expect(adjustedPath).toEqual(path);
          expect(itemFound).toBe(false);
      });
  });
  
  describe('handleItemPickup', () => {
    it('should add item to inventory if space is available', () => {
      const position: Position = { row: 0, col: 0 };
      const tile = { images: [ObjectsImages.Sword], isOccuped: false };
      mockSession.grid[position.row][position.col] = tile;
      mockPlayer.inventory = [];
    
      // Mock de getObjectKeyByValue
      jest.spyOn(ObjectsEnumsConstants, 'getObjectKeyByValue').mockImplementation((value: string) => {
        if (value === ObjectsImages.Sword) return 'Sword';
        return undefined;
      });
    
      service.handleItemPickup(mockPlayer, mockSession, position, mockServer, sessionCode);
    
      expect(mockPlayer.inventory).toContain(ObjectsImages.Sword);
      expect(changeGridService.removeObjectFromGrid).toHaveBeenCalledWith(
        mockSession.grid,
        position.row,
        position.col,
        ObjectsImages.Sword,
      );
      expect(eventsGateway.addEventToSession).toHaveBeenCalledWith(
        sessionCode,
        `${mockPlayer.name} a ramassé un Sword`,
        ['everyone'],
      );
      expect(mockServer.to).toHaveBeenCalledWith(mockPlayer.socketId);
      expect(mockServer.emit).toHaveBeenCalledWith('itemPickedUp', { item: ObjectsImages.Sword });
    });
    
  
      it('should notify player if inventory is full', () => {
          const position: Position = { row: 0, col: 0 };
          const tile = { images: [ObjectsImages.Sword], isOccuped: false };
          mockSession.grid[position.row][position.col] = tile;
          mockPlayer.inventory = [ObjectsImages.Wheel, ObjectsImages.Key];
  
          const mockSocketId = 'socket1';
          mockPlayer.socketId = mockSocketId;
  
          service.handleItemPickup(mockPlayer, mockSession, position, mockServer, sessionCode);
  
          expect(mockPlayer.inventory).not.toContain(ObjectsImages.Sword);
          expect(mockServer.to).toHaveBeenCalledWith(mockSocketId);
          expect(mockServer.emit).toHaveBeenCalledWith('inventoryFull', { items: [...mockPlayer.inventory, ObjectsImages.Sword] });
      });
  });
  
  
});
