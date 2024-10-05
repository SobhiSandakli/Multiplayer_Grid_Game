import { Component, OnInit } from '@angular/core';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  messages: { sender: string, message: string }[] = [];
  message: string = '';
  room: string = '';
  sender: string = '';
  connected: boolean = false;

  constructor(private socketService: SocketService) {}

  ngOnInit() {
    // Listen for incoming room-specific messages
    this.socketService.onRoomMessage().subscribe((data) => {
      const [sender, message] = data.split(': ');
      this.messages.push({ sender, message });
    });

    // Listen for generic messages (like join notifications)
    this.socketService.onMessage().subscribe((data) => {
      this.messages.push({ sender: 'System', message: data });
    });
  }

  // Connect to a room
  connect() {
    if (this.room && this.sender) {
      this.socketService.joinRoom(this.room, this.sender);
      this.connected = true;
    }
  }

  // Send a message to the room
  sendMessage() {
    if (this.message.trim() && this.connected) {
      this.socketService.sendRoomMessage(this.room, this.message, this.sender); // Send message to the room
      this.message = ''; // Clear the message input
    }
  }
}
