import { TestBed } from '@angular/core/testing';
import { SocketService } from './socket.service';
import { Socket } from 'socket.io-client';

class MockSocket {
    private events: { [key: string]: Function[] } = {};

    emit(event: string, data?: any) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }

    on(event: string, callback: Function) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event: string) {
        delete this.events[event];
    }
}

describe('SocketService', () => {
    let socketService: SocketService;
    let mockSocket: MockSocket;

    beforeEach(() => {
        mockSocket = new MockSocket(); // Use the mock socket
        TestBed.configureTestingModule({
            providers: [
                SocketService,
                { provide: Socket, useValue: mockSocket as unknown as Socket } // Cast MockSocket as Socket
            ],
        });

        socketService = TestBed.inject(SocketService);
        socketService['socket'] = mockSocket as unknown as Socket; // Cast MockSocket as Socket
    });

    it('should create the SocketService', () => {
        expect(socketService).toBeTruthy();
    });

    it('should join a room', () => {
        const room = 'room1';
        const name = 'user1';
        socketService.joinRoom(room, name);
        mockSocket.emit('joinRoom', { room, name });
    });

    it('should send a room message', () => {
        const room = 'room1';
        const message = 'Hello!';
        const sender = 'user1';
        socketService.sendRoomMessage(room, message, sender);
        mockSocket.emit('roomMessage', { room, message, sender });
    });

    it('should listen for room messages', (done) => {
        const data = { room: 'room1', message: 'Hello!', sender: 'user1' };

        socketService.onRoomMessage().subscribe((receivedData) => {
            expect(receivedData).toEqual(data);
            done(); // Call done to end the test when the observable emits
        });

        mockSocket.emit('roomMessage', data); // Emit the event from the mock socket
    });

    it('should listen for general messages', (done) => {
        const data = { message: 'Hello!', sender: 'user1' };

        socketService.onMessage().subscribe((receivedData) => {
            expect(receivedData).toEqual(data);
            done(); // Call done to end the test when the observable emits
        });

        mockSocket.emit('message', data); // Emit the event from the mock socket
    });
});
