import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { GameModule } from '@app/modules/game/game.module';
import { SessionsModule } from '@app/modules/sessions/sessions.module';
import { GridModule } from '@app/modules/grid/grid.module';
import { MovementModule } from '@app/modules/movement/movement.module';
import { CombatModule } from '@app/modules/combat/combat.module';

describe('AppModule', () => {
    let appModule: TestingModule;

    beforeAll(async () => {
        appModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
    });

    afterAll(async () => {
        await appModule.close();
    });

    it('should be defined', () => {
        expect(appModule).toBeDefined();
    });

    it('should import ConfigModule as a global module', () => {
        const configModule = appModule.get(ConfigService);
        expect(configModule).toBeDefined();
    });

    it('should import MongooseModule with async configuration', () => {
        const mongooseModule = appModule.get(MongooseModule);
        expect(mongooseModule).toBeDefined();
    });

    it('should include GameModule', () => {
        const gameModule = appModule.get(GameModule);
        expect(gameModule).toBeDefined();
    });

    it('should include SessionsModule', () => {
        const sessionsModule = appModule.get(SessionsModule);
        expect(sessionsModule).toBeDefined();
    });

    it('should include GridModule', () => {
        const gridModule = appModule.get(GridModule);
        expect(gridModule).toBeDefined();
    });

    it('should include MovementModule', () => {
        const movementModule = appModule.get(MovementModule);
        expect(movementModule).toBeDefined();
    });

    it('should include CombatModule', () => {
        const combatModule = appModule.get(CombatModule);
        expect(combatModule).toBeDefined();
    });

    it('should provide ChatGateway', () => {
        const chatGateway = appModule.get(ChatGateway);
        expect(chatGateway).toBeDefined();
    });

    it('should configure Mongoose with DATABASE_CONNECTION_STRING', () => {
        const configService = appModule.get(ConfigService);
        const databaseConnectionString = configService.get<string>('DATABASE_CONNECTION_STRING');
        expect(databaseConnectionString).toBeDefined();
        expect(typeof databaseConnectionString).toBe('string');
    });
});
