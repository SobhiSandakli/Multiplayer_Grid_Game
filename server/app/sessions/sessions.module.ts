import { SessionsGateway } from '@app/gateways/sessions/sessions/sessions.gateway';
import { SessionsService } from '@app/services/sessions//sessions.service';
import { Module } from '@nestjs/common';
import { GameModule} from '@app/game.module'; // Import the GameModule
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { MovementService } from '@app/services/movement/movement.service';

@Module({
    imports: [GameModule], // Add GameModule to the imports array
    providers: [SessionsGateway, SessionsService, ChangeGridService, MovementService], // Add GameService to the providers array
    exports: [SessionsService],
})
export class SessionsModule {}
