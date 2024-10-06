import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DELAY_BEFORE_EMITTING_TIME, PRIVATE_ROOM_ID, WORD_MIN_LENGTH } from './chat.gateway.constants';
import { ChatEvents } from './chat.gateway.events';

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:4200', 
        methods: ['GET', 'POST'],
    },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer() private server: Server;
    private readonly logger = new Logger(ChatGateway.name); 
    private readonly room = PRIVATE_ROOM_ID;

    @SubscribeMessage(ChatEvents.JoinRoom)
    joinRoom(socket: Socket, { room, name }: { room: string; name: string }) {
        socket.join(room);
        this.logger.log(`User ${name} with id ${socket.id} joined room ${room}`);
        this.server.to(room).emit('message', `User ${name} has joined the room`);
    }

    @SubscribeMessage(ChatEvents.RoomMessage)
    roomMessage(socket: Socket, { room, message, sender }: { room: string; message: string; sender: string }) {
        if (socket.rooms.has(room)) {
            this.server.to(room).emit(ChatEvents.RoomMessage, `${sender}: ${message}`);
        } else {
            this.logger.warn(`User ${sender} tried to send a message to a room they are not in.`);
        }
    }

    afterInit() {
        setInterval(() => {
            this.emitTime();
        }, DELAY_BEFORE_EMITTING_TIME);
    }

    handleConnection(socket: Socket) {
        this.logger.log(`Connexion par l'utilisateur avec id : ${socket.id}`);
    }

    handleDisconnect(socket: Socket) {
        this.logger.log(`Déconnexion par l'utilisateur avec id : ${socket.id}`);
    }

    private emitTime() {
        this.server.emit(ChatEvents.Clock, new Date().toLocaleTimeString());
    }
}
