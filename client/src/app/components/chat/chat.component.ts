import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ChatMemoryService } from '@app/services/chat/chatMemory.service';
import { SocketService } from '@app/services/socket/socket.service';
import { Subscription } from 'rxjs';
import { MAX_LENGTH_MESSAGE } from 'src/constants/chat-constants';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
    @Input() room: string;
    @Input() sender: string;
    @Input() isWaitingPage: boolean;

    messages: { sender: string; message: string; date: string }[] = [];
    message: string = '';
    connected: boolean = false;
    activeTab: string = 'chat';
    isHidden: boolean = false;
    private subscriptions: Subscription = new Subscription();

    constructor(
        private socketService: SocketService,
        private chatMemory: ChatMemoryService,
    ) {}

    ngOnInit() {
        this.messages = this.chatMemory.getMessages(this.room);
        const onRoomMessage = this.socketService.onRoomMessage().subscribe((data: string) => {
            const [sender, message] = (data as string).split(':');
            this.addMessage(sender, message);
        });

        const onMessage = this.socketService.onMessage().subscribe((data: string) => {
            this.addMessage('Système', data as string);
        });
        this.subscriptions.add(onRoomMessage);
        this.subscriptions.add(onMessage);

        if (this.room && this.sender) {
            this.socketService.joinRoom(this.room, this.sender, this.isWaitingPage);
            this.connected = true;
        }
    }
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    addMessage(sender: string, message: string) {
        const currentDate = new Date();
        const formattedTime = this.formatTime(currentDate);
        this.messages.push({ sender, message, date: formattedTime });
        this.chatMemory.saveMessage(this.room, sender, message, formattedTime);
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

    sendMessage() {
        if (this.message.length > MAX_LENGTH_MESSAGE) {
            alert('Le message est trop long. Veuillez le limiter à 200 caractères.');
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
