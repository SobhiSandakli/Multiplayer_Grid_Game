import { Module , forwardRef} from '@nestjs/common';
import { CombatTurnService } from '@app/services/combat-turn/combat-turn.service';
import { CombatModule } from '../combat/combat.module';

@Module({
    imports: [forwardRef(() => CombatModule)],
    providers: [CombatTurnService],
    exports: [CombatTurnService], 
  })
  export class CombatTurnModule {}
  
