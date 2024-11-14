import { Module, forwardRef } from '@nestjs/common';
import { FightService } from '@app/services/fight/fight.service';
import { CombatTurnModule } from '@app/modules/combat-turn/combat-turn.module';

@Module({
    imports: [forwardRef(() => CombatTurnModule)],
    providers: [FightService],
    exports: [FightService],
})
export class FightModule {}
