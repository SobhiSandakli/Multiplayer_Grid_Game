import { forwardRef, Module } from '@nestjs/common';
import { MovementService } from '@app/services/movement/movement.service';
<<<<<<< HEAD
import { ChangeGridService } from '@app/services/grid/changeGrid.service';


@Module({
    providers: [MovementService, ChangeGridService],
=======
import { SessionsModule } from '@app/modules/sessions/sessions.module';
import { GridModule } from '@app/modules/grid/grid.module';

@Module({
    imports: [GridModule, forwardRef(() => SessionsModule)],
    providers: [MovementService],
>>>>>>> e1a07c3dfd3ce018e0265a55196a06adb8626e75
    exports: [MovementService],
})
export class MovementModule {}
