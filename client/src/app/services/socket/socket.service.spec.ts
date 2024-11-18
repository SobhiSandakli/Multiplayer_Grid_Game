import { TestBed } from '@angular/core/testing';
import { Socket } from 'socket.io-client';
import { SocketService } from './socket.service';

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

    it('should return empty string if socket id is undefined', () => {
        mockSocket.id = undefined;
        const socketId = service.getSocketId();
        expect(socketId).toBe('');
    });

    it('should call socket.emit with correct arguments', () => {
        const event = 'testEvent';
        const data = { key: 'value' };
        service.socket.emit(event, data);
        expect(mockSocket.emit).toHaveBeenCalledWith(event, data);
    });

    it('should call socket.on with correct arguments', () => {
        const event = 'testEvent';
        const callback = jasmine.createSpy('callback');
        service.socket.on(event, callback);
        expect(mockSocket.on).toHaveBeenCalledWith(event, callback);
    });

    it('should call socket.off with correct arguments', () => {
        const event = 'testEvent';
        service.socket.off(event);
        expect(mockSocket.off).toHaveBeenCalledWith(event);
    });
});
