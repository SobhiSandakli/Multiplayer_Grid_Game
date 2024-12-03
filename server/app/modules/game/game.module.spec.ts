import { Game, gameSchema } from '@app/model/schema/game.schema';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { GameModule } from './game.module';

describe('GameModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }]), GameModule],
        })
            .overrideProvider(getModelToken(Game.name))
            .useValue(jest.fn())
            .compile();
    });

    it('should compile the module', async () => {
        expect(module).toBeDefined();
    });
});
