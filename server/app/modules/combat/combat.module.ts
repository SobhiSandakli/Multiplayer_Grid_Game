import { Module, forwardRef } from '@nestjs/common';
import { CombatGateway } from '@app/gateways/combat/combat.gateway';
import { CombatService } from '@app/services/combat/combat.service';
import { TurnModule } from '@app/modules/turn/turn.module';
import { EventsModule } from '@app/modules/events/events.module';
import { SessionsModule } from '@app/modules/sessions/sessions.module';
import { FightModule } from '@app/modules/fight/fight.module';
import { CombatTurnModule } from '@app/modules/combat-turn/combat-turn.module';
import { GridModule } from '../grid/grid.module';
import { SessionsService } from '@app/services/sessions/sessions.service';

@Module({
  imports: [
    forwardRef(() => SessionsModule),
    forwardRef(() =>CombatTurnModule),
    FightModule,
    EventsModule,
    TurnModule,
    GridModule,
  ],
  providers: [
    CombatGateway,
    CombatService,
  ],
  exports: [
    CombatGateway,
    CombatService,
  ],
})
export class CombatModule {}
