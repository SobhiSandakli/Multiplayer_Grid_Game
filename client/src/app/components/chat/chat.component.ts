import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChatSocket } from '@app/services/chat-socket/chatSocket.service';
import { ChatMemoryService } from '@app/services/chat/chatMemory.service';
import { EventsService } from '@app/services/events/events.service';
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
    @ViewChild('eventsContainer') eventsContainerRef: ElementRef;

    messages: { sender: string; message: string; date: string }[] = [];
    message: string = '';
    connected: boolean = false;
    activeTab: string = 'chat';
    isHidden: boolean = false;
    filterBySender: boolean = false;
    faFilter = faFilter;
    faWindowClose = faWindowClose;
    faComment = faCommentAlt;
    events: [event: string, date: string, recp: string[]][] = [];
    private subscriptions: Subscription = new Subscription();

    constructor(
        private chatMemory: ChatMemoryService,
        private eventsService: EventsService,
        private chatSocket: ChatSocket,
    ) {}

    get filteredMessages() {
        if (this.filterBySender) {
            const sender = this.sender.trim().toLowerCase();
            const senderRegex = new RegExp(`\\b${sender}\\b`, 'i');
            const filtered = this.events.filter((event) => {
                const eventString = JSON.stringify(event);
                return senderRegex.test(eventString);
            });
            return filtered;
        } else {
            return this.events;
        }
    }

    ngOnInit() {
        this.messages = this.chatMemory.getMessages(this.room);
        const onRoomMessage = this.chatSocket.onRoomMessage().subscribe((data: string) => {
            const [sender, message] = (data as string).split(':');
            this.addMessage(sender, message);
        });

        const onMessage = this.chatSocket.onMessage().subscribe((data: string) => {
            this.addMessage('Système', data as string);
        });
        this.subscriptions.add(onRoomMessage);
        this.subscriptions.add(onMessage);

        if (this.room && this.sender) {
            this.chatSocket.joinRoom(this.room, this.sender, this.isWaitingPage);
            this.connected = true;
        }

        const onEvents = this.eventsService.onNewEvent().subscribe((eventData) => {
            if (this.shouldDisplayEvent(eventData)) {
                const currentDate = new Date();
                const formattedTime = this.formatTime(currentDate);
                this.events.push([eventData[0], formattedTime, eventData[1]]);
                setTimeout(() => {
                    if (this.eventsContainerRef && this.eventsContainerRef.nativeElement) {
                        this.eventsContainerRef.nativeElement.scrollTop = this.eventsContainerRef.nativeElement.scrollHeight;
                    }
                }, 0);
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
        setTimeout(() => {
            const messagesContainer = document.querySelector('.messages-section');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 0);
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
            this.chatSocket.sendRoomMessage(this.room, this.message.trim(), this.sender);
            this.message = '';
        }
    }

    formatTime(date: Date): string {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    private shouldDisplayEvent(event: [string, string[]]): boolean {
        const [, recipients] = event;
        return recipients.includes('everyone') || recipients.includes(this.sender);
    }
}
