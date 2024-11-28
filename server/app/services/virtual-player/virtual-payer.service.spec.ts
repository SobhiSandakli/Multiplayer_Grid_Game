import { CombatGateway } from '@app/gateways/combat/combat.gateway';
import { CombatService } from '@app/services/combat/combat.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { MovementService } from '@app/services/movement/movement.service';
import { TurnService } from '@app/services/turn/turn.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';
import { VirtualPlayerService } from './virtual-player.service';

describe('VirtualPlayerService', () => {
  let service: VirtualPlayerService;
  let server: Partial<Server>;

  beforeEach(async () => {
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
    server = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});