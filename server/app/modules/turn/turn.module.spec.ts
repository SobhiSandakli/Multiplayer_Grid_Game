/* eslint-disable */

import { Test, TestingModule } from '@nestjs/testing';
import { SessionsModule } from '@app/modules/sessions/sessions.module';

jest.mock('@app/modules/sessions/sessions.module', () => ({
    SessionsModule: class {},
}));

describe('TurnModule', () => {
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
