import { Test, TestingModule } from '@nestjs/testing';
import { SessionsModule } from '../sessions/sessions.module';

jest.mock('@app/modules/sessions/sessions.module', () => ({
    SessionsModule: class {},
}));

describe('MovementModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [SessionsModule],
        }).compile();
    });

    it('should compile the module', () => {
        expect(module).toBeDefined();
    });

});