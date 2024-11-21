import { Module, forwardRef } from '@nestjs/common';
import { DebugModeGateway } from '@app/gateways/debugMode/debugMode.gateway';
import { GridModule } from '@app/modules/grid/grid.module';
import { MovementModule } from '@app/modules/movement/movement.module';
import { SessionsModule } from '@app/modules/sessions/sessions.module';
import { DebugModeService } from '@app/services/debugMode/debugMode.service';
import { TurnModule } from '@app/modules/turn/turn.module';

@Module({
    imports: [forwardRef(() => SessionsModule), forwardRef(() => MovementModule), GridModule, TurnModule],
    providers: [DebugModeGateway, DebugModeService],
    exports: [DebugModeService],
})
export class DebugModeModule {}
