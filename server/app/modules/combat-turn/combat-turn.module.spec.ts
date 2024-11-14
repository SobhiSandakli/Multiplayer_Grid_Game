import { Test, TestingModule } from '@nestjs/testing';
import { CombatTurnModule } from '@app/modules/combat-turn/combat-turn.module';
import { CombatTurnService } from '@app/services/combat-turn/combat-turn.service';
import { CombatModule } from '@app/modules/combat/combat.module';
import { CombatService } from '@app/services/combat/combat.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { FightService } from '@app/services/fight/fight.service';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { TurnService } from '@app/services/turn/turn.service';

describe('CombatTurnModule', () => {
    let module: TestingModule;
    let combatTurnService: CombatTurnService;

    beforeEach(async () => {
        // Create mock implementations for all dependencies of CombatService
        const mockSessionsService = {
            // Add mock methods if CombatService uses them
            // e.g., getSession: jest.fn(),
        };

        const mockCombatService = {
            // Mock any methods used by CombatTurnService
            // e.g., initiateCombat: jest.fn(),
        };

        const mockFightService = {
            // Add mock methods if needed
            // e.g., startFight: jest.fn(),
        };

        const mockEventsGateway = {
            // Add mock methods if needed
            // e.g., emitEvent: jest.fn(),
        };

        const mockChangeGridService = {
            // Add mock methods if needed
            // e.g., updateGrid: jest.fn(),
        };

        const mockTurnService = {
            // Add mock methods if needed
            // e.g., getCurrentTurn: jest.fn(),
        };

        module = await Test.createTestingModule({
            imports: [
                CombatTurnModule,
                CombatModule, // Import CombatModule to satisfy forwardRef
            ],
            providers: [
                {
                    provide: SessionsService,
                    useValue: mockSessionsService,
                },
                {
                    provide: CombatService,
                    useValue: mockCombatService,
                },
                {
                    provide: FightService,
                    useValue: mockFightService,
                },
                {
                    provide: EventsGateway,
                    useValue: mockEventsGateway,
                },
                {
                    provide: ChangeGridService,
                    useValue: mockChangeGridService,
                },
                {
                    provide: TurnService,
                    useValue: mockTurnService,
                },
            ],
        })
            .overrideProvider(CombatService)
            .useValue(mockCombatService) // Ensure CombatService uses the mock
            .compile();

        combatTurnService = module.get<CombatTurnService>(CombatTurnService);
    });

    it('should compile the CombatTurnModule', () => {
        expect(module).toBeDefined();
    });

    it('should have CombatTurnService defined', () => {
        expect(combatTurnService).toBeDefined();
    });
});
