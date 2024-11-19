// combat.module.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { CombatModule } from './combat.module';
import { CombatGateway } from '@app/gateways/combat/combat.gateway';
import { CombatService } from '@app/services/combat/combat.service';
import { SessionsModule } from '@app/modules/sessions/sessions.module';
import { CombatTurnModule } from '@app/modules/combat-turn/combat-turn.module';
import { FightModule } from '@app/modules/fight/fight.module';
import { EventsModule } from '@app/modules/events/events.module';
import { TurnModule } from '@app/modules/turn/turn.module';
import { GridModule } from '@app/modules/grid/grid.module';

describe('CombatModule', () => {
    let module: TestingModule;
    let combatGateway: CombatGateway;
    let combatService: CombatService;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [CombatModule, SessionsModule, CombatTurnModule, FightModule, EventsModule, TurnModule, GridModule],
        })
            .overrideProvider(SessionsModule)
            .useValue({})
            .overrideProvider(CombatTurnModule)
            .useValue({})
            .overrideProvider(FightModule)
            .useValue({})
            .overrideProvider(EventsModule)
            .useValue({})
            .overrideProvider(TurnModule)
            .useValue({})
            .overrideProvider(GridModule)
            .useValue({})
            .compile();

        combatGateway = module.get<CombatGateway>(CombatGateway);
        combatService = module.get<CombatService>(CombatService);
    });

    it('should compile the CombatModule', () => {
        expect(module).toBeDefined();
    });

    it('should have CombatGateway defined', () => {
        expect(combatGateway).toBeDefined();
    });

    it('should have CombatService defined', () => {
        expect(combatService).toBeDefined();
    });
});
