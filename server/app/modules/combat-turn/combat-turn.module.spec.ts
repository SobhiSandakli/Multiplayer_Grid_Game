import { Test, TestingModule } from '@nestjs/testing';
import { CombatTurnModule } from './combat-turn.module';
import { CombatModule } from '@app/modules/combat/combat.module';
import { FightService } from '@app/services/fight/fight.service';
import { CombatService } from '@app/services/combat/combat.service';
import { VirtualPlayerService } from '@app/services/virtual-player/virtual-player.service';
import { MovementService } from '@app/services/movement/movement.service';
import { TurnService } from '@app/services/turn/turn.service';

describe('CombatTurnModule', () => {
    let moduleRef: TestingModule;

    beforeEach(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [CombatTurnModule],
        })
            .overrideProvider(FightService)
            .useValue({}) // Provide an empty mock for FightService
            .overrideProvider(CombatService)
            .useValue({}) // Provide an empty mock for CombatService
            .overrideProvider(VirtualPlayerService)
            .useValue({}) // Provide an empty mock for VirtualPlayerService
            .overrideProvider(MovementService)
            .useValue({}) // Provide an empty mock for MovementService
            .overrideProvider(TurnService)
            .useValue({}) // Provide an empty mock for TurnService
            .compile();
    });

    it('should import CombatModule', () => {
        const importedModules = moduleRef.get<CombatModule>(CombatModule);
        expect(importedModules).toBeDefined();
    });
});
