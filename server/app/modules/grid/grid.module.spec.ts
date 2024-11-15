import { Test, TestingModule } from '@nestjs/testing';
import { GridModule } from './grid.module';

describe('EventsModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [GridModule],
        }).compile();
    });

    it('should compile the module', () => {
        expect(module).toBeDefined();
    });
});
