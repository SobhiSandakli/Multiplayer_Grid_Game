import { TestBed } from '@angular/core/testing';
import { ChatMemoryService } from './chatMemory.service';

describe('ChatMemoryService - clearMessages', () => {
    let service: ChatMemoryService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ChatMemoryService],
        });
        service = TestBed.inject(ChatMemoryService);
    });

    it('should clear messages for an existing room', () => {
        const roomId = 'testRoom';
        const sender = 'user1';
        const message = 'Hello';
        const date = new Date().toISOString();

        service.saveMessage(roomId, sender, message, date);

        let messages = service.getMessages(roomId);
        expect(messages.length).toBe(1);
        expect(messages[0]).toEqual({ sender, message, date });

        service.clearMessages(roomId);

        messages = service.getMessages(roomId);
        expect(messages).toEqual([]);
    });

    it('should not throw an error when clearing messages for a non-existing room', () => {
        const roomId = 'nonExistingRoom';

        expect(() => service.clearMessages(roomId)).not.toThrow();

        const messages = service.getMessages(roomId);
        expect(messages).toEqual([]);
    });
    it('should clear messages for a specific room', () => {
        const roomId = 'testRoom';
        const sender = 'user1';
        const message = 'Hello';
        const date = new Date().toISOString();

        service.saveMessage(roomId, sender, message, date);

        let messages = service.getMessages(roomId);
        expect(messages.length).toBe(1);
        expect(messages[0]).toEqual({ sender, message, date });

        service.clearMessages(roomId);

        messages = service.getMessages(roomId);
        expect(messages).toEqual([]);
    });
});
