import { Player } from '../player/player.interface';

export interface CombatData {
    combatants: Player[];
    turnIndex: number;
    turnTimer: NodeJS.Timeout | null;
    timeLeft: number;
}
