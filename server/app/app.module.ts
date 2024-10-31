import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GameModule } from '@app/game.module';
import { ChatGateway } from './gateways/chat/chat.gateway'; // Import the gateway
import { SessionsModule } from './sessions/sessions.module';
import { ChangeGridService } from './services/grid/changeGrid.service';

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
    providers: [ChatGateway, ChangeGridService], // Add the gateway as a provider
})
export class AppModule {}
