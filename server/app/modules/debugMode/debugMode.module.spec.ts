import { DebugModeGateway } from '@app/gateways/debugMode/debugMode.gateway';
import { DebugModeService } from '@app/services/debugMode/debugMode.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { MovementService } from '@app/services/movement/movement.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { TurnService } from '@app/services/turn/turn.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DebugModeModule } from './debugMode.module';

describe('DebugModeModule', () => {
    let moduleRef: TestingModule;

    beforeEach(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [DebugModeModule],
        })
            .overrideProvider(SessionsService)
            .useValue({}) 
            .overrideProvider(MovementService)
            .useValue({}) 
            .overrideProvider(ChangeGridService)
            .useValue({}) 
            .overrideProvider(TurnService)
            .useValue({}) 
            .compile();
    });

    it('should provide DebugModeGateway', () => {
        const debugModeGateway = moduleRef.get<DebugModeGateway>(DebugModeGateway);
        expect(debugModeGateway).toBeDefined();
        expect(debugModeGateway).toBeInstanceOf(DebugModeGateway);
    });

    it('should provide DebugModeService', () => {
        const debugModeService = moduleRef.get<DebugModeService>(DebugModeService);
        expect(debugModeService).toBeDefined();
        expect(debugModeService).toBeInstanceOf(DebugModeService);
    });

    it('should export DebugModeService', () => {
        const exportedDebugModeService = moduleRef.get<DebugModeService>(DebugModeService);
        expect(exportedDebugModeService).toBeDefined();
    });
});
