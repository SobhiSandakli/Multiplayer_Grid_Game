import { GameModule } from '@app/modules/game/game.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from '../../gateways/chat/chat.gateway';
import { ChangeGridService } from '../../services/grid/changeGrid.service';
import { MovementService } from '../../services/movement/movement.service';
import { SessionsModule } from '../sessions/sessions.module';
import { GridModule } from '../grid/grid.module';
import { MovementModule } from '../movement/movement.module';
import { CombatModule } from '../combat/combat.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'),
            }),
        }),
        GameModule,
        SessionsModule,
        GridModule,
        MovementModule,
        CombatModule,
    ],
    providers: [ChatGateway],
})
export class AppModule {}
