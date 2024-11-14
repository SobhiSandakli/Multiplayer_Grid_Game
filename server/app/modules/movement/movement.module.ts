import { Module } from '@nestjs/common';
import { MovementService } from '@app/services/movement/movement.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';


@Module({
    providers: [MovementService, ChangeGridService],
    exports: [MovementService],
})
export class MovementModule {}
