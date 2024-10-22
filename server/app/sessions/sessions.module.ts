import { SessionsGateway } from '@app/gateways/sessions/sessions/sessions.gateway';
import { SessionsService } from '@app/services/sessions//sessions.service';
import { Module } from '@nestjs/common';

@Module({
    providers: [SessionsGateway, SessionsService],
    exports: [SessionsService],
})
export class SessionsModule {}
