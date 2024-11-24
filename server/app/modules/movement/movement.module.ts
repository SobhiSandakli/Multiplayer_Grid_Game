import { forwardRef, Module } from '@nestjs/common';
import { MovementService } from '@app/services/movement/movement.service';
import { SessionsModule } from '@app/modules/sessions/sessions.module';
import { GridModule } from '@app/modules/grid/grid.module';
import { EventsModule } from '@app/modules/events/events.module';

@Module({
    imports: [GridModule, forwardRef(() => SessionsModule), EventsModule],
    providers: [MovementService],
    exports: [MovementService],
})
export class MovementModule {}
