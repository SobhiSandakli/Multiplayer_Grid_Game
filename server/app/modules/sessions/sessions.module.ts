import { MovementModule } from '@app/modules/movement/movement.module';
import { SessionsService } from '@app/services/sessions//sessions.service';
import { SessionsGateway } from '@app/gateways/sessions/sessions/sessions.gateway';
import { Module, forwardRef } from '@nestjs/common';
import { EventsModule } from '@app/modules/events/events.module';
import { TurnModule } from '@app/modules/turn/turn.module';
import { GridModule } from '@app/modules/grid/grid.module';

@Module({
    imports: [forwardRef(() => MovementModule), forwardRef(() => TurnModule), EventsModule, GridModule],
    providers: [SessionsService, SessionsGateway],
    exports: [SessionsService],
})
export class SessionsModule {}
