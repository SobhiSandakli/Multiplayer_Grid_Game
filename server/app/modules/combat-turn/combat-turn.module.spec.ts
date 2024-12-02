import { CombatModule } from '@app/modules/combat/combat.module';
import { CombatService } from '@app/services/combat/combat.service';
import { FightService } from '@app/services/fight/fight.service';
import { MovementService } from '@app/services/movement/movement.service';
import { TurnService } from '@app/services/turn/turn.service';
import { VirtualPlayerService } from '@app/services/virtual-player/virtual-player.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CombatTurnModule } from './combat-turn.module';

describe('CombatTurnModule', () => {
    let moduleRef: TestingModule;

    beforeEach(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [CombatTurnModule],
        })
            .overrideProvider(FightService)
            .useValue({}) 
            .overrideProvider(CombatService)
            .useValue({}) 
            .overrideProvider(VirtualPlayerService)
            .useValue({}) 
            .overrideProvider(MovementService)
            .useValue({}) 
            .overrideProvider(TurnService)
            .useValue({}) 
            .compile();
    });

    it('should import CombatModule', () => {
        const importedModules = moduleRef.get<CombatModule>(CombatModule);
        expect(importedModules).toBeDefined();
    });
});
