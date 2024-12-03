import { CombatGateway } from '@app/gateways/combat/combat.gateway';
import { CombatTurnModule } from '@app/modules/combat-turn/combat-turn.module';
import { EventsModule } from '@app/modules/events/events.module';
import { FightModule } from '@app/modules/fight/fight.module';
import { GridModule } from '@app/modules/grid/grid.module';
import { SessionsModule } from '@app/modules/sessions/sessions.module';
import { TurnModule } from '@app/modules/turn/turn.module';
import { CombatService } from '@app/services/combat/combat.service';
import { FightService } from '@app/services/fight/fight.service';
import { MovementService } from '@app/services/movement/movement.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { TurnService } from '@app/services/turn/turn.service';
import { VirtualPlayerService } from '@app/services/virtual-player/virtual-player.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CombatModule } from './combat.module';

describe('CombatModule', () => {
    let module: TestingModule;
    let combatGateway: CombatGateway;
    let combatService: CombatService;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [CombatModule, SessionsModule, CombatTurnModule, FightModule, EventsModule, TurnModule, GridModule],
        })
            .overrideProvider(SessionsService)
            .useValue({})
            .overrideProvider(FightService)
            .useValue({})
            .overrideProvider(TurnService)
            .useValue({})
            .overrideProvider(MovementService)
            .useValue({})
            .overrideProvider(VirtualPlayerService)
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
