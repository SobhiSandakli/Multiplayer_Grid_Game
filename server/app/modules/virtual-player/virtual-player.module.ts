import { Module, forwardRef } from '@nestjs/common';
import { VirtualPlayerService } from '@app/services/virtual-player/virtual-player.service';
import { MovementModule } from '../movement/movement.module';
import { CombatModule } from '../combat/combat.module';
import { TurnModule } from '../turn/turn.module';

@Module({
  imports: [
    MovementModule,
    forwardRef(() => CombatModule),
    forwardRef(() => TurnModule),
  ],
  providers: [VirtualPlayerService],
  exports: [VirtualPlayerService],
})
export class VirtualPlayerModule {}