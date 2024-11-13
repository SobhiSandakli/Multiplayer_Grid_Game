import { Module } from '@nestjs/common';
import { ActionService } from '@app/services/action/action.service';

@Module({
    providers: [ActionService],
    exports: [ActionService],
})
export class ActionModule {}
