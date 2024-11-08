import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ChatMemoryService } from '@app/services/chat/chatMemory.service';
import { EventsService } from '@app/services/events/events.service';
import { SocketService } from '@app/services/socket/socket.service';
import { faCommentAlt, faFilter, faWindowClose } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

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
    filterBySender: boolean = false;
    faFilter = faFilter;
    faWindowClose = faWindowClose;
    faComment = faCommentAlt;
    events: [string, string[], string][] = [];
    private subscriptions: Subscription = new Subscription();

    constructor(
        private socketService: SocketService,
        private chatMemory: ChatMemoryService,
        private eventsService: EventsService,
    ) {}

    get filteredMessages() {
        return this.filterBySender ? this.messages.filter((message) => message.sender === this.sender) : this.messages;
    }

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

        const onEvents = this.eventsService.onNewEvent().subscribe((event) => {
            if (this.shouldDisplayEvent(event)) {
                const formattedTime = this.formatTime(new Date());
                this.events.push([  event[0],  event[1],  formattedTime ]);
            }
        });
        this.subscriptions.add(onEvents);
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
        if (this.message.trim() && this.connected) {
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

    private shouldDisplayEvent(event: [string, string[], string]): boolean {
        const [, recipients] = event;
        return recipients.includes('everyone') || recipients.includes(this.sender);
    }
}
