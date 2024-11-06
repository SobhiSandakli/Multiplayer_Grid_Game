import { DICE_ROLL_OFFSET, DICE_SIDES_D4, DICE_SIDES_D6, EVASION_SUCCESS_PROBABILITY } from '@app/constants/fight-constants';
import { Player } from '@app/interfaces/player/player.interface';
import { Injectable } from '@nestjs/common';
@Injectable()
export class FightService {
    determineFirstAttacker(initiatingPlayer: Player, opponentPlayer: Player): Player {
        const initiatorSpeed = initiatingPlayer.attributes['speed'].baseValue;
        const opponentSpeed = opponentPlayer.attributes['speed'].baseValue;

        if (initiatorSpeed > opponentSpeed) {
            return initiatingPlayer;
        } else if (opponentSpeed > initiatorSpeed) {
            return opponentPlayer;
        } else {
            return initiatingPlayer;
        }
    }

    calculateEvasion(player: Player): boolean {
        const evasionAttempts = player.attributes['nbEvasion']?.currentValue;

        if (evasionAttempts > 0) {
            player.attributes['nbEvasion'].currentValue -= 1;

            return Math.random() <= EVASION_SUCCESS_PROBABILITY;
        } else {
            return false;
        }
    }

    calculateAttack(
        attacker: Player,
        defender: Player,
    ): {
        attackBase: number;
        attackRoll: number;
        defenceBase: number;
        defenceRoll: number;
        success: boolean;
    } {
        const attackBase = attacker.attributes['attack'].currentValue;
        const attackDice = attacker.attributes['attack'].dice;
        const attackRoll = this.rollDice(attackDice);
        const totalAttack = attackBase + attackRoll;

        const defenceBase = defender.attributes['defence'].currentValue;
        const defenseDice = defender.attributes['defence'].dice;
        const defenceRoll = this.rollDice(defenseDice);
        const totalDefense = defenceBase + defenceRoll;

        const success = totalAttack > totalDefense;

        return { attackBase, attackRoll, defenceBase, defenceRoll, success };
    }

    private rollDice(diceType: string): number {
        switch (diceType) {
            case 'D6':
                return Math.floor(Math.random() * DICE_SIDES_D6) + DICE_ROLL_OFFSET;
            case 'D4':
                return Math.floor(Math.random() * DICE_SIDES_D4) + DICE_ROLL_OFFSET;
            default:
                return 0;
        }
    }
}
