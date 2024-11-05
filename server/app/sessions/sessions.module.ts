import { GameModule } from '@app/game.module'; // Import the GameModule
import { SessionsGateway } from '@app/gateways/sessions/sessions/sessions.gateway';
import { CombatTurnService } from '@app/services/combat-turn/combat-turn.service';
import { FightService } from '@app/services/fight/fight.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { MovementService } from '@app/services/movement/movement.service';
import { SessionsService } from '@app/services/sessions//sessions.service';
import { TurnService } from '@app/services/turn/turn.service';
import { ActionService } from '@app/services/action/action.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [GameModule], // Add GameModule to the imports array
    providers: [SessionsGateway, SessionsService, ChangeGridService, MovementService, TurnService, FightService, CombatTurnService,  ActionService], // Add GameService to the providers array
   
})
export class SessionsModule {}
