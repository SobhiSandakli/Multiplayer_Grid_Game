import { Module } from '@nestjs/common';
import { MovementService } from '@app/services/movement/movement.service';

@Module({
    providers: [MovementService],
    exports: [MovementService],
})
export class MovementModule {}
