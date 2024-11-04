import { SessionsGateway } from '@app/gateways/sessions/sessions/sessions.gateway';
import { SessionsService } from '@app/services/sessions//sessions.service';
import { Module } from '@nestjs/common';
import { GameModule} from '@app/game.module'; // Import the GameModule
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { MovementService } from '@app/services/movement/movement.service';
import { TurnService } from '@app/services/turn/turn.service';
import { FightService } from '@app/services/fight/fight.service';
import { CombatTurnService } from '@app/services/combat-turn/combat-turn.service';

@Module({
    imports: [GameModule], // Add GameModule to the imports array
    providers: [SessionsGateway, SessionsService, ChangeGridService, MovementService, TurnService, FightService, CombatTurnService], // Add GameService to the providers array
   
})
export class SessionsModule {}
