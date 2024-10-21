import { SessionsGateway } from '@app/gateways/sessions/sessions/sessions.gateway';
import { Module } from '@nestjs/common';

@Module({
    providers: [SessionsGateway],
})
export class SessionsModule {}
