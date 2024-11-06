import { GameModule } from '@app/game.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './gateways/chat/chat.gateway';
import { GameService } from './services/game/game.service';
import { ChangeGridService } from './services/grid/changeGrid.service';
import { MovementService } from './services/movement/movement.service';
import { SessionsModule } from './sessions/sessions.module';

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
    ],
    providers: [ChatGateway, ChangeGridService, MovementService, GameService],
})
export class AppModule {}
