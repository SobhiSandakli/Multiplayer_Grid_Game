import { Module, forwardRef } from '@nestjs/common';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { SessionsGateway } from '@app/gateways/sessions/sessions/sessions.gateway';
import { EventsModule } from '@app/modules/events/events.module';
import { TurnModule } from '@app/modules/turn/turn.module';
import { GridModule } from '@app/modules/grid/grid.module';
import { CombatModule } from '@app/modules/combat/combat.module';

@Module({
    imports: [forwardRef(() => TurnModule), forwardRef(() => CombatModule), EventsModule, GridModule],
    providers: [SessionsService, SessionsGateway],
    exports: [SessionsService],
})
export class SessionsModule {}
