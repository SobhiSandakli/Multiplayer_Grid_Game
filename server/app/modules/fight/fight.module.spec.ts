// fight.module.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { FightModule } from './fight.module';
import { FightService } from '@app/services/fight/fight.service';

describe('FightModule', () => {
    let module: TestingModule;
    let fightService: FightService;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [FightModule],
        }).compile();

        fightService = module.get<FightService>(FightService);
    });

    it('should compile the FightModule', () => {
        expect(module).toBeDefined();
    });

    it('should have FightService defined', () => {
        expect(fightService).toBeDefined();
    });
});
