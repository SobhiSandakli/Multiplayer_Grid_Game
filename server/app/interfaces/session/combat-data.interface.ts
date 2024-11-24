import { Player } from '@app/interfaces/player/player.interface';

export interface CombatData {
    combatants: Player[]; // List of players in combat
    turnIndex: number; // Index of the current player's turn
    turnTimer: NodeJS.Timeout | null; // Timer for the turn
    timeLeft: number; // Remaining time for the turn
    lastAttackResult?: {
        success: boolean; // Whether the last attack was successful
        target: Player; // The player who was attacked
        attacker: Player; // The player who performed the attack
    }; // Tracks the last attack result
}
