import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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

    messages: { sender: string; message: string; date: string }[] = [];
    message: string = '';
    connected: boolean = false;
    activeTab: string = 'chat';
    isHidden: boolean = true;
    private subscriptions: Subscription = new Subscription();

    constructor(private socketService: SocketService) {}

    ngOnInit() {
        const onRoomMessage = this.socketService.onRoomMessage().subscribe((data) => {
            const [sender, message] = (data as string).split(':');
            this.addMessage(sender, message);
        });

        const onMessage = this.socketService.onMessage().subscribe((data) => {
            this.addMessage('Système', data as string);
        });
        this.subscriptions.add(onRoomMessage);
        this.subscriptions.add(onMessage);

        // Se connecter automatiquement au chat avec le nom du joueur et le code de la session
        if (this.room && this.sender) {
            this.socketService.joinRoom(this.room, this.sender);
            this.connected = true;
        } else {
            console.error('Impossible de se connecter au chat : room ou sender est manquant.');
        }
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
