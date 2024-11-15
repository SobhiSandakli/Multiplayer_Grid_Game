import { Test, TestingModule } from '@nestjs/testing';
import { TurnModule } from '../turn/turn.module';

jest.mock('@app/modules/turn/turn.module', () => ({
    TurnModule: class {},
}));

describe('SessionstModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [TurnModule],
        }).compile();
    });

    it('should compile the module', () => {
        expect(module).toBeDefined();
    });

});