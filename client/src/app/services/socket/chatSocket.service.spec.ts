/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/socket/socket.service';
import { ChatSocket } from './chatSocket.service';

interface HandlerMap {
    [event: string]: ((data: any) => void)[];
}

class MockSocket {
    private handlers: HandlerMap = {};

    emit(event: string, data: any): void {}

    on(event: string, handler: (data: any) => void): void {
        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(handler);
    }

    trigger(event: string, data: any): void {
        if (this.handlers[event]) {
            this.handlers[event].forEach((handler) => handler(data));
        }
    }
}

class MockSocketService {
    socket = new MockSocket();
}

describe('ChatSocket', () => {
    let service: ChatSocket;
    let mockSocketService: MockSocketService;

    beforeEach(() => {
        mockSocketService = new MockSocketService();

        TestBed.configureTestingModule({
            providers: [ChatSocket, { provide: SocketService, useValue: mockSocketService }],
        });

        service = TestBed.inject(ChatSocket);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should emit joinRoom event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const room = 'testRoom';
        const name = 'testUser';
        const showSystemMessage = true;

        service.joinRoom(room, name, showSystemMessage);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('joinRoom', { room, name, showSystemMessage });
    });

    it('should emit roomMessage event with correct data', () => {
        spyOn(mockSocketService.socket, 'emit');
        const room = 'testRoom';
        const message = 'Hello';
        const sender = 'testUser';

        service.sendRoomMessage(room, message, sender);

        expect(mockSocketService.socket.emit).toHaveBeenCalledWith('roomMessage', { room, message, sender });
    });

    it('should receive data from onRoomMessage observable when roomMessage event is triggered', (done) => {
        const testData = 'testData';
        service.onRoomMessage().subscribe((data: any) => {
            expect(data).toBe(testData);
            done();
        });
        mockSocketService.socket.trigger('roomMessage', testData);
    });

    it('should receive data from onMessage observable when message event is triggered', (done) => {
        const testData = 'testData';
        service.onMessage().subscribe((data: any) => {
            expect(data).toBe(testData);
            done();
        });
        mockSocketService.socket.trigger('message', testData);
    });
});
