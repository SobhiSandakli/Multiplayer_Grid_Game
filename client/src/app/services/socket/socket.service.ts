import {  Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    public socket: Socket;

    constructor() {
        this.socket = io(environment.serverUrl);
    }

    getSocketId(): string {
        return this.socket.id ?? '';
    }
}
