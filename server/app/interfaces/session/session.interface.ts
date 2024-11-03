import { Player } from '@app/interfaces/player/player.interface';
export interface Session {
    organizerId: string;
    locked: boolean;
    maxPlayers: number;
    players: Player[];
    selectedGameID: string;
    grid: { images: string[]; isOccuped: boolean }[][];
    turnOrder: string[]; // Liste des socketId des joueurs dans l'ordre des tours
    currentTurnIndex: number; // Index du joueur actuel dans turnOrder
    currentPlayerSocketId: string; // SocketId du joueur dont c'est le tour
    turnTimer: NodeJS.Timeout | null; // Référence au timer du tour
    timeLeft: number; // Temps restant en secondes pour le tour en cours
    combat: Player[]; // Liste des socketId des joueurs impliqués dans un combat
}
