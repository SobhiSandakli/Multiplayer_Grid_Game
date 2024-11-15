import { Test, TestingModule } from '@nestjs/testing';
import { CombatTurnModule } from './combat-turn.module';
import { CombatTurnService } from '@app/services/combat-turn/combat-turn.service';
import { CombatModule } from '@app/modules/combat/combat.module';
import { FightService } from '@app/services/fight/fight.service';

describe('CombatTurnModule', () => {
    let moduleRef: TestingModule;

    beforeEach(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [CombatTurnModule],
        })
        .overrideProvider(FightService)
        .useValue({}) // Provide an empty mock for FightService
        .compile();
    });

    it('should import CombatModule', () => {
        const importedModules = moduleRef.get<CombatModule>(CombatModule);
        expect(importedModules).toBeDefined();
    });

    it('should provide CombatTurnService', () => {
        const combatTurnService = moduleRef.get<CombatTurnService>(CombatTurnService);
        expect(combatTurnService).toBeDefined();
        expect(combatTurnService).toBeInstanceOf(CombatTurnService);
    });

    it('should export CombatTurnService', () => {
        // Check if CombatTurnService is exported and accessible by other modules
        const exportedCombatTurnService = moduleRef.get<CombatTurnService>(CombatTurnService);
        expect(exportedCombatTurnService).toBeDefined();
    });
});
