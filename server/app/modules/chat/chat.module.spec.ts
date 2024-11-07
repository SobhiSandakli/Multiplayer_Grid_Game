import { Test, TestingModule } from '@nestjs/testing';
import { ChatModule } from './chat.module';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';

describe('ChatModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [ChatModule],
        }).compile();
    });

    it('should compile the module', () => {
        expect(module).toBeDefined();
    });

    it('should provide ChatGateway', () => {
        const chatGateway = module.get<ChatGateway>(ChatGateway);
        expect(chatGateway).toBeDefined();
    });
});
