import { Module } from '@nestjs/common';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';

@Module({
    providers: [ChangeGridService],
    exports: [ChangeGridService],
})
export class GridModule {}
