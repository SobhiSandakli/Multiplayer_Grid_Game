import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000'); 
  }

  joinRoom(room: string, name: string) {
    this.socket.emit('joinRoom', { room, name });
  }

  sendRoomMessage(room: string, message: string, sender: string) {
    this.socket.emit('roomMessage', { room, message, sender });
  }

  onRoomMessage(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('roomMessage', (data) => {
        observer.next(data);
      });
    });
  }

  onMessage(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('message', (data) => {
        observer.next(data);
      });
    });
  }
}
