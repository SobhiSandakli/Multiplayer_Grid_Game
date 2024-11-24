import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    socket: Socket;

    constructor() {
        this.socket = io(environment.serverUrl);
        this.socket.on('disconnect', () => {
            this.socket.connect();
        });
    }

    getSocketId(): string {
        return this.socket.id ?? '';
    }
}
