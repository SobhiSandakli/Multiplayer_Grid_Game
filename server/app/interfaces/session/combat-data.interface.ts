import { Player } from '@app/interfaces/player/player.interface';

export interface CombatData {
    combatants: Player[];
    turnIndex: number;
    turnTimer: NodeJS.Timeout | null;
    timeLeft: number;
}
