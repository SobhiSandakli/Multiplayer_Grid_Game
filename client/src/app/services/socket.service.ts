import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000'); // Ensure this is the correct backend URL
  }

  // Join a specific room with the user's name
  joinRoom(room: string, name: string) {
    this.socket.emit('joinRoom', { room, name });
  }

  // Send a message to a specific room
  sendRoomMessage(room: string, message: string, sender: string) {
    this.socket.emit('roomMessage', { room, message, sender });
  }

  // Listen for room-specific messages
  onRoomMessage(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('roomMessage', (data) => {
        observer.next(data);
      });
    });
  }

  // Listen for generic messages (like join notifications)
  onMessage(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('message', (data) => {
        observer.next(data);
      });
    });
  }
}
