/* eslint-disable */

import { Test, TestingModule } from '@nestjs/testing';
import { CombatTurnModule } from '@app/modules//combat-turn/combat-turn.module';

jest.mock('@app/modules/combat-turn/combat-turn.module', () => ({
    CombatTurnModule: class {},
}));

describe('FightModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [CombatTurnModule],
        }).compile();
    });

    it('should compile the module', () => {
        expect(module).toBeDefined();
    });
});
