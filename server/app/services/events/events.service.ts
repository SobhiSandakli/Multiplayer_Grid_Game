import { CharacterCreationData } from '@app/interfaces/character-creation-data/character-creation-data.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { Game } from '@app/model/schema/game.schema';
import { CombatTurnService } from '@app/services/combat-turn/combat-turn.service';
import { TurnService } from '@app/services/turn/turn.service';
import { GameService } from '@app/services/game/game.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { MovementService } from '@app/services/movement/movement.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FightService } from '@app/services/fight/fight.service';
const DELAY_BEFORE_NEXT_TURN = 5000; // Délai de 5 secondes (vous pouvez ajuster cette valeur)

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingInterval: 120000, // Ping every 2 minutes
    pingTimeout: 600000, // Disconnect if no response within 10 minutes
})
export class EventsGateway {
    @WebSocketServer()
    private server: Server;

    constructor(
    ) {}

    emitNewEvent(event: [string, string[]]) {
        this.server.emit('newEvent', event); // Emit to all clients
    }

    addEventToSession(sessionCode: string, message: string, names: string[]) {
        const event: [string, string[]] = [message, names];
        this.emitNewEvent(event); 
    }
}