import { Player } from '@app/interfaces/player/player.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FightService {
    determineFirstAttacker(initiatingPlayer: Player, opponentPlayer: Player): Player {
        const initiatorSpeed = initiatingPlayer.attributes['speed'].baseValue;
        const opponentSpeed = opponentPlayer.attributes['speed'].baseValue;

        // Determine who starts the combat based on speed
        if (initiatorSpeed > opponentSpeed) {
            return initiatingPlayer;
        } else if (opponentSpeed > initiatorSpeed) {
            return opponentPlayer;
        } else {
            // If both speeds are equal, the initiator starts
            return initiatingPlayer;
        }
    }

    calculateEvasion(player: Player): boolean {
        // Check if the player has remaining evasion attempts
        const evasionAttempts = player.attributes['nbEvasion']?.currentValue;
        
        if (evasionAttempts > 0) {
            // Reduce evasion attempts
            player.attributes['nbEvasion'].currentValue -= 1;

            // 40% chance of success
            return Math.random() <= 0.4;
        } else {
            // No remaining evasion attempts
            return false;
        }
    }

// Method to calculate attack outcome
calculateAttack(attacker: Player, defender: Player): { 
    attackBase: number;
    attackRoll: number;  
    defenceBase: number;
    defenceRoll: number;
    success: boolean 
} {
    const attackBase = attacker.attributes['attack'].currentValue;
    const attackDice = attacker.attributes['attack'].dice;
    const attackRoll = this.rollDice(attackDice);
    const totalAttack = attackBase + attackRoll; // Attack base + bonus roll

    const defenceBase = defender.attributes['defence'].currentValue;
    const defenseDice = defender.attributes['defence'].dice;
    const defenceRoll = this.rollDice(defenseDice);
    const totalDefense = defenceBase + defenceRoll; // Defense base + bonus roll

    const success = totalAttack > totalDefense;

    return { attackBase, attackRoll, defenceBase, defenceRoll, success };
}


    // Helper function to roll the specified dice
    private rollDice(diceType: string): number {
        switch (diceType) {
            case 'D6':
                return Math.floor(Math.random() * 6) + 1;
            case 'D4':
                return Math.floor(Math.random() * 4) + 1;
            default:
                return 0; // Default to 0 if dice type is not specified
        }
    }

}