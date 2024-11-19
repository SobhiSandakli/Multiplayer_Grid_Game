import { Module } from '@nestjs/common';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';

@Module({
    providers: [ChatGateway],
})
export class ChatModule {}
