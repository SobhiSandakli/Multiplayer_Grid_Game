import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameController } from '@app/controllers/game/game.controller';
import { Game, GameSchema } from '@app/model/schema/game.schema';
import { GameService } from '@app/services/game/game.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }]),
    ],
    controllers: [GameController],
    providers: [GameService, Logger],  // Add Logger here
})
export class GameModule {}
