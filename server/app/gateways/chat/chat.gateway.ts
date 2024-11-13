import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DELAY_BEFORE_EMITTING_TIME, PRIVATE_ROOM_ID } from './chat.gateway.constants';
import { ChatEvents } from './chat.gateway.events';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer() private server: Server;
    private readonly logger = new Logger(ChatGateway.name);
    private readonly room = PRIVATE_ROOM_ID;
    private chatHistory: { [roomId: string]: { sender: string; message: string; date: string }[] } = {};

    handleConnection(client: Socket) {
        console.log('Client connected', client.id);
    }
    
    @SubscribeMessage(ChatEvents.JoinRoom)
    joinRoom(socket: Socket, { room, name, showSystemMessage }: { room: string; name: string; showSystemMessage: boolean }) {
        socket.join(room);
        this.logger.log(`User ${name} with id ${socket.id} joined room ${room}`);
        const chatHistory = this.getMessages(room);
        socket.emit('roomMessages', chatHistory);
        if (showSystemMessage) {
            this.server.to(room).emit('message', `L'utilisateur ${name} a rejoint la salle`);
        }
    }

    @SubscribeMessage(ChatEvents.RoomMessage)
    roomMessage(socket: Socket, { room, message, sender }: { room: string; message: string; sender: string }) {
        if (socket.rooms.has(room)) {
            this.saveMessage(room, sender, message);
            this.server.to(room).emit(ChatEvents.RoomMessage, `${sender}: ${message}`);
        } else {
            this.logger.warn(`User ${sender} tried to send a message to a room they are not in.`);
        }
    }

    @SubscribeMessage(ChatEvents.GetChatHistory)
    getChatHistory(socket: Socket, { room }: { room: string }) {
        const chatHistory = this.getMessages(room);
        socket.emit('roomMessages', chatHistory);
    }

    afterInit() {
        setInterval(() => {
            this.emitTime();
        }, DELAY_BEFORE_EMITTING_TIME);
    }

    // handleConnection(socket: Socket) {
    //     this.logger.log(`Connexion par l'utilisateur avec id : ${socket.id}`);
    // }

    handleDisconnect(socket: Socket) {
        this.logger.log(`Déconnexion par l'utilisateur avec id : ${socket.id}`);
    }

    private emitTime() {
        this.server.emit(ChatEvents.Clock, new Date().toLocaleTimeString());
    }

    private saveMessage(roomId: string, sender: string, message: string) {
        if (!this.chatHistory[roomId]) {
            this.chatHistory[roomId] = [];
        }
        const formattedTime = new Date().toLocaleTimeString();
        this.chatHistory[roomId].push({ sender, message, date: formattedTime });
    }
    private getMessages(roomId: string) {
        return this.chatHistory[roomId] ? [...this.chatHistory[roomId]] : [];
    }
}
