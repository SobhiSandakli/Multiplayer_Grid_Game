import { GameModule } from '@app/modules/game/game.module';
import { SessionsGateway } from '@app/gateways/sessions/sessions/sessions.gateway';
import { ActionService } from '@app/services/action/action.service';
import { CombatTurnService } from '@app/services/combat-turn/combat-turn.service';
import { EventsGateway } from '@app/services/events/events.service';
import { FightService } from '@app/services/fight/fight.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { MovementService } from '@app/services/movement/movement.service';
import { SessionsService } from '@app/services/sessions//sessions.service';
import { TurnService } from '@app/services/turn/turn.service';
import { Module } from '@nestjs/common';
import { TurnGateway } from '@app/gateways/turn/turn.gateway';
import { GameGateway } from '@app/gateways/game/game.gateway';

@Module({
    imports: [GameModule],
    providers: [
        SessionsGateway,
        TurnGateway,
        SessionsService,
        ChangeGridService,
        MovementService,
        TurnService,
        FightService,
        CombatTurnService,
        EventsGateway,
        ActionService,
        GameGateway,
    ],
})
export class SessionsModule {}
