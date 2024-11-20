import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { GameModule } from './game.module';
import { Game, gameSchema } from '@app/model/schema/game.schema';

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

    //     it('should provide GameController and GameService', () => {
    //         const gameController = module.get<GameController>(GameController);
    //         const gameService = module.get<GameService>(GameService);
    //         expect(gameController).toBeDefined();
    //         expect(gameService).toBeDefined();
    //     });
});
