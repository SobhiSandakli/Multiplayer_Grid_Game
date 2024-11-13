import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameController } from '@app/controllers/game/game.controller';
import { Game, gameSchema } from '@app/model/schema/game.schema';
import { GameService } from '@app/services/game/game.service';
import { GridModule } from '../grid/grid.module';
import { GameGateway } from '@app/gateways/game/game.gateway';
import { SessionsModule } from '../sessions/sessions.module';
import { MovementModule } from '../movement/movement.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }]), GridModule, SessionsModule, MovementModule],
    controllers: [GameController],
    providers: [GameService, Logger, GameGateway],
    exports: [GameService],
})
export class GameModule {}
