import { Player } from '@app/interfaces/player/player.interface';
export interface Session {
    organizerId: string;
    locked: boolean;
    maxPlayers: number;
    players: Player[];
    selectedGameID: string;
}
