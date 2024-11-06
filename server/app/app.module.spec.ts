import { GameModule } from '@app/game.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './gateways/chat/chat.gateway';
import { GameService } from './services/game/game.service';
import { ChangeGridService } from './services/grid/changeGrid.service';
import { MovementService } from './services/movement/movement.service';
import { SessionsModule } from './sessions/sessions.module';

describe('AppModule', () => {
    let appModule: TestingModule;

    beforeAll(async () => {
        appModule = await Test.createTestingModule({
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
        }).compile();
    });

    it('should compile the module', () => {
        expect(appModule).toBeDefined();
    });

    it('should have GameModule imported', () => {
        const gameModule = appModule.get<GameModule>(GameModule);
        expect(gameModule).toBeInstanceOf(GameModule);
    });

    it('should have ChatGateway provider', () => {
        const chatGateway = appModule.get<ChatGateway>(ChatGateway);
        expect(chatGateway).toBeInstanceOf(ChatGateway);
    });

    it('should have ChangeGridService provider', () => {
        const changeGridService = appModule.get<ChangeGridService>(ChangeGridService);
        expect(changeGridService).toBeInstanceOf(ChangeGridService);
    });

    it('should have MovementService provider', () => {
        const movementService = appModule.get<MovementService>(MovementService);
        expect(movementService).toBeInstanceOf(MovementService);
    });

    it('should have GameService provider', () => {
        const gameService = appModule.get<GameService>(GameService);
        expect(gameService).toBeInstanceOf(GameService);
    });
});
