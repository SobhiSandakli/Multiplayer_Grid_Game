import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatEvents } from './chat.gateway.events';
import { DELAY_BEFORE_EMITTING_TIME, PRIVATE_ROOM_ID } from './chat.gateway.constants';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    let server: Server;
    let socket: Socket;
    let logger: Logger;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ChatGateway],
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);

        server = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as unknown as Server;

        socket = {
            id: 'socket-id',
            join: jest.fn(),
            emit: jest.fn(),
            rooms: new Set(),
        } as unknown as Socket;

        logger = {
            log: jest.fn(),
            warn: jest.fn(),
        } as unknown as Logger;

        // Inject mocks
        (gateway as unknown as { server: Server }).server = server;
        (gateway as unknown as { logger: Logger }).logger = logger;
    });

    it('joinRoom() should join the socket room', () => {
        gateway.joinRoom(socket, { room: PRIVATE_ROOM_ID, name: 'testUser', showSystemMessage: true });
        expect(socket.join).toHaveBeenCalledWith(PRIVATE_ROOM_ID);
        expect(server.to).toHaveBeenCalledWith(PRIVATE_ROOM_ID);
        expect(server.emit).toHaveBeenCalledWith('message', "L'utilisateur testUser a rejoint la salle");
    });
    

    it('afterInit() should emit time after 1s', () => {
        jest.useFakeTimers();
        gateway.afterInit();
        jest.advanceTimersByTime(DELAY_BEFORE_EMITTING_TIME);
        expect(server.emit).toHaveBeenCalledWith(ChatEvents.Clock, expect.any(String));
    });

    it('hello message should be sent on connection', () => {
        gateway.handleConnection(socket);
        expect(logger.log).toHaveBeenCalledWith(`Connexion par l'utilisateur avec id : ${socket.id}`);
    });

    it('socket disconnection should be logged', () => {
        gateway.handleDisconnect(socket);
        expect(logger.log).toHaveBeenCalledWith(`Déconnexion par l'utilisateur avec id : ${socket.id}`);
    });

    it('roomMessage() should emit message if socket is in the room', () => {
        socket.rooms.add('testRoom');
        gateway.roomMessage(socket, { room: 'testRoom', message: 'Hello', sender: 'testUser' });
        expect(server.to).toHaveBeenCalledWith('testRoom');
        expect(server.emit).toHaveBeenCalledWith(ChatEvents.RoomMessage, 'testUser: Hello');
    });

    it('roomMessage() should warn if socket is not in the room', () => {
        gateway.roomMessage(socket, { room: 'testRoom', message: 'Hello', sender: 'testUser' });
        expect(logger.warn).toHaveBeenCalledWith('User testUser tried to send a message to a room they are not in.');
    });
});
