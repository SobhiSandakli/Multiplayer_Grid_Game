import { Module } from '@nestjs/common';
import { FightService } from '@app/services/fight/fight.service';

@Module({
    providers: [FightService],
    exports: [FightService],
})
export class FightModule {}
