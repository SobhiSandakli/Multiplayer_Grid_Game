import { Module, forwardRef } from '@nestjs/common';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { SessionsGateway } from '@app/gateways/sessions/sessions/sessions.gateway';
import { EventsModule } from '@app/modules/events/events.module';
import { TurnModule } from '@app/modules/turn/turn.module';
import { GridModule } from '@app/modules/grid/grid.module';
import { MovementService } from '@app/services/movement/movement.service';

@Module({
    imports: [forwardRef(() => TurnModule), EventsModule, GridModule],
    providers: [SessionsService, SessionsGateway, MovementService],
    exports: [SessionsService],
})
export class SessionsModule {}
