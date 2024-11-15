import { Socket } from 'socket.io';
import { Player } from '@app/interfaces/player/player.interface';
import { Session } from '@app/interfaces/session/session.interface';

interface MovementData {
    sessionCode: string;
    source: { row: number; col: number };
    destination: { row: number; col: number };
    movingImage: string;
}
export interface PathInterface {
    realPath: { row: number; col: number }[];
    desiredPath: { row: number; col: number }[];
}

export interface MovementContext {
    client: Socket;
    player: Player;
    session: Session;
    movementData: MovementData;
    path:PathInterface;
    slipOccurred: boolean;
    movementCost: number;
    destination: { row: number; col: number };
}
