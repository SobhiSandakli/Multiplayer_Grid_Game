import { Test, TestingModule } from '@nestjs/testing';
import { GridModule } from './grid.module';
import { EventsGateway } from '@app/gateways/events/events.gateway';

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