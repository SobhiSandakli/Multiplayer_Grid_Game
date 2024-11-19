import { Module, forwardRef } from '@nestjs/common';
import { DebugModeGateway } from '@app/gateways/debugMode/debugMode.gateway';
import { ActionModule } from '../action/action.module';
import { EventsModule } from '../events/events.module';
import { GridModule } from '../grid/grid.module';
import { MovementModule } from '../movement/movement.module';
import { SessionsModule } from '../sessions/sessions.module';
import { DebugModeService } from '@app/services/debugMode/debugMode.service';
import { TurnModule } from '../turn/turn.module';


@Module({
    imports: [forwardRef(() => SessionsModule), forwardRef(() => MovementModule), GridModule, EventsModule, ActionModule,TurnModule],
    providers: [DebugModeGateway, DebugModeService],
    exports: [DebugModeService],
})
export class DebugModeModule {}
