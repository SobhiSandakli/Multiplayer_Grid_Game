import { Player } from '@app/interfaces/player/player.interface';
export interface Session {
    organizerId: string;
    locked: boolean;
    maxPlayers: number;
    players: Player[];
    selectedGameID: string;
    grid: { images: string[]; isOccuped: boolean }[][];
    turnOrder: string[];
    currentTurnIndex: number;
    currentPlayerSocketId: string;
    turnTimer: NodeJS.Timeout | null;
    timeLeft: number;
    combat: Player[];
    combatTurnIndex: number;
    combatTurnTimer: NodeJS.Timeout | null;
    combatTimeLeft: number;
}
