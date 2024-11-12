import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ChatSocket {
    constructor(private socketService: SocketService) {}

    joinRoom(room: string, name: string, showSystemMessage: boolean) {
        this.socketService.socket.emit('joinRoom', { room, name, showSystemMessage });
    }
    sendRoomMessage(room: string, message: string, sender: string) {
        this.socketService.socket.emit('roomMessage', { room, message, sender });
    }

    onRoomMessage(): Observable<string> {
        return new Observable((observer) => {
            this.socketService.socket.on('roomMessage', (data) => {
                observer.next(data);
            });
        });
    }

    onMessage(): Observable<string> {
        return new Observable((observer) => {
            this.socketService.socket.on('message', (data) => {
                observer.next(data);
            });
        });
    }
}
