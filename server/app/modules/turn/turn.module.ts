import { Module, forwardRef } from '@nestjs/common';
import { TurnGateway } from '@app/gateways/turn/turn.gateway';
import { TurnService } from '@app/services/turn/turn.service';
import { MovementModule } from '@app/modules/movement/movement.module';
import { EventsModule } from '@app/modules/events/events.module';
import { ActionModule } from '@app/modules/action/action.module';
import { SessionsModule } from '@app/modules/sessions/sessions.module';
import { GridModule } from '@app/modules/grid/grid.module';

@Module({
    imports: [forwardRef(() => SessionsModule), forwardRef(() => MovementModule), GridModule, EventsModule, ActionModule],
    providers: [TurnGateway, TurnService],
    exports: [TurnService, TurnGateway],
})
export class TurnModule {}
