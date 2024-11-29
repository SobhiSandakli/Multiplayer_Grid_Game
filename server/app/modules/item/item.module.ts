import { forwardRef, Module } from '@nestjs/common';
import { ItemService } from '@app/services/item/item.service';
import { SessionsModule } from '@app/modules/sessions/sessions.module';
import { GridModule } from '@app/modules/grid/grid.module';
import { EventsModule } from '@app/modules/events/events.module';

@Module({
    imports: [GridModule, forwardRef(() => SessionsModule), EventsModule],
    providers: [ItemService],
    exports: [ItemService],
})
export class ItemModule {}
