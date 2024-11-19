import { GameModule } from '@app/modules/game/game.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { SessionsModule } from '@app/modules/sessions/sessions.module';
import { GridModule } from '@app/modules/grid/grid.module';
import { MovementModule } from '@app/modules/movement/movement.module';
import { CombatModule } from '@app/modules/combat/combat.module';
import { DebugModeModule } from '../debugMode/debugMode.module';

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
        DebugModeModule,
    ],
    providers: [ChatGateway],
})
export class AppModule {}
