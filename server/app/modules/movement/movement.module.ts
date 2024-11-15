import { forwardRef, Module } from '@nestjs/common';
import { MovementService } from '@app/services/movement/movement.service';
import { SessionsModule } from '@app/modules/sessions/sessions.module';
import { GridModule } from '@app/modules/grid/grid.module';

@Module({
    imports: [GridModule, forwardRef(() => SessionsModule)],
    providers: [MovementService],
    exports: [MovementService],
})
export class MovementModule {}
