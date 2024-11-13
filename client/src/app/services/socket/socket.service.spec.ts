import { TestBed } from '@angular/core/testing';
import { SocketService } from './socket.service';
import { Socket } from 'socket.io-client';

describe('SocketService', () => {
    let service: SocketService;
    let mockSocket: jasmine.SpyObj<Socket>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [SocketService],
        });

        service = TestBed.inject(SocketService);

        mockSocket = jasmine.createSpyObj<Socket>('Socket', ['on', 'emit', 'off']);
        mockSocket.id = 'testSocketId';

        service.socket = mockSocket;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return socket id', () => {
        const socketId = service.getSocketId();
        expect(socketId).toBe('testSocketId');
    });
});
