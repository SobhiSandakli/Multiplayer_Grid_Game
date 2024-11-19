import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ChatMemoryService {
    private roomMessages: { [roomId: string]: { sender: string; message: string; date: string }[] } = {};

    saveMessage(roomId: string, sender: string, message: string, date: string) {
        if (!this.roomMessages[roomId]) {
            this.roomMessages[roomId] = [];
        }
        this.roomMessages[roomId].push({ sender, message, date });
    }

    getMessages(roomId: string) {
        return this.roomMessages[roomId] ? [...this.roomMessages[roomId]] : [];
    }

    clearMessages(roomId: string) {
        delete this.roomMessages[roomId];
    }
}
