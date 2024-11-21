import { Test, TestingModule } from '@nestjs/testing';
import { DebugModeModule } from './debugMode.module';
import { DebugModeGateway } from '@app/gateways/debugMode/debugMode.gateway';
import { DebugModeService } from '@app/services/debugMode/debugMode.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { MovementService } from '@app/services/movement/movement.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { TurnService } from '@app/services/turn/turn.service';

describe('DebugModeModule', () => {
    let moduleRef: TestingModule;

    beforeEach(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [DebugModeModule],
        })
            .overrideProvider(SessionsService)
            .useValue({}) // Provide an empty mock for SessionsService
            .overrideProvider(MovementService)
            .useValue({}) // Provide an empty mock for MovementService
            .overrideProvider(ChangeGridService)
            .useValue({}) // Provide an empty mock for ChangeGridService
            .overrideProvider(TurnService)
            .useValue({}) // Provide an empty mock for TurnService
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
        // Check if DebugModeService is exported and accessible by other modules
        const exportedDebugModeService = moduleRef.get<DebugModeService>(DebugModeService);
        expect(exportedDebugModeService).toBeDefined();
    });
});
