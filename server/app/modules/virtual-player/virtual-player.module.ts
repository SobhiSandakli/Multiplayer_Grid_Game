import { Module, forwardRef } from '@nestjs/common';
import { VirtualPlayerService } from '@app/services/virtual-player/virtual-player.service';
import { MovementModule } from '@app/modules/movement/movement.module';
import { CombatModule } from '@app/modules/combat/combat.module';
import { TurnModule } from '@app/modules/turn/turn.module';
import { GridModule } from '@app/modules/grid/grid.module';

@Module({
    imports: [forwardRef(() => MovementModule), forwardRef(() => CombatModule), forwardRef(() => TurnModule), GridModule],
    providers: [VirtualPlayerService],
    exports: [VirtualPlayerService],
})
export class VirtualPlayerModule {}
