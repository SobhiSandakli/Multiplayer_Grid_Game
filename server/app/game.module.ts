import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameController } from '@app/controllers/game/game.controller';
import { Game, gameSchema } from '@app/model/schema/game.schema';
import { GameService } from '@app/services/game/game.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }])],
    controllers: [GameController],
    providers: [GameService, Logger],
})
export class GameModule {}
