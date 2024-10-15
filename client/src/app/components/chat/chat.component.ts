import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { Subscription } from 'rxjs';
import { MAX_LENGTH_MESSAGE } from 'src/constants/chat-constants';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
    messages: { sender: string; message: string; date: string }[] = [];
    message: string = '';
    room: string = '';
    sender: string = '';
    connected: boolean = false;
    activeTab: string = 'chat';
    isHidden: boolean = true;
    private subscriptions:Subscription = new Subscription();

    constructor(private socketService: SocketService) {}

    ngOnInit() {
        const onRoomMessage = this.socketService.onRoomMessage().subscribe((data) => {
            const [sender, message] = (data as string).split(':');
            this.addMessage(sender, message);
        });

        const onMessage = this.socketService.onMessage().subscribe((data) => {
            this.addMessage('System', data as string);
        });
        this.subscriptions.add(onRoomMessage);
        this.subscriptions.add(onMessage);
    }
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    addMessage(sender: string, message: string) {
        const currentDate = new Date();
        const formattedTime = this.formatTime(currentDate);
        this.messages.push({ sender, message, date: formattedTime });
    }

    switchTab(tab: string) {
        this.activeTab = tab;
    }

    closeChat() {
        this.isHidden = true;
    }

    showChat() {
        this.isHidden = false;
    }

    connect() {
        if (this.room.trim() && this.sender.trim()) {
            this.socketService.joinRoom(this.room, this.sender);
            this.connected = true;
        }
    }

    sendMessage() {
        if (this.message.length > MAX_LENGTH_MESSAGE) {
            alert('Message is too long. Please keep it under 200 characters.');
        } else if (this.message.trim() && this.connected) {
            this.socketService.sendRoomMessage(this.room, this.message.trim(), this.sender);
            this.message = '';
        }
    }

    formatTime(date: Date): string {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
}
