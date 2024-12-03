import { forwardRef, Module } from '@nestjs/common';
import { MovementService } from '@app/services/movement/movement.service';
import { SessionsModule } from '@app/modules/sessions/sessions.module';
import { GridModule } from '@app/modules/grid/grid.module';
import { EventsModule } from '@app/modules/events/events.module';
import { ItemModule } from '@app/modules/item/item.module';

@Module({
    imports: [GridModule, forwardRef(() => SessionsModule), EventsModule, ItemModule],
    providers: [MovementService],
    exports: [MovementService],
})
export class MovementModule {}
