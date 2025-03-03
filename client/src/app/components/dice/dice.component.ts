import { Component, Injectable, Input } from '@angular/core';
import { DURATION_ROLL_DICE, DURATION_SHOW_DICE_ROLL } from 'src/constants/dice-constants';

@Injectable({
    providedIn: 'root',
})
@Component({
    selector: 'app-dice',
    templateUrl: './dice.component.html',
    styleUrls: ['./dice.component.scss'],
})
export class DiceComponent {
    @Input() isCombatTurn: boolean = false;
    @Input() attackBase: number | null = null;
    @Input() defenceBase: number | null = null;
    @Input() attackRoll: number = 0;
    @Input() defenceRoll: number = 0;
    @Input() success: boolean | null = null;
    rolling: boolean = false;

    rollDice() {
        this.rolling = true;
        setTimeout(() => {
            this.rolling = false;
        }, DURATION_ROLL_DICE);
    }

    showDiceRoll(attackRoll: number, defenceRoll: number) {
        this.rolling = true;
        setTimeout(() => {
            this.attackRoll = attackRoll;
            this.defenceRoll = defenceRoll;
            this.rolling = false;
        }, DURATION_SHOW_DICE_ROLL);
    }

    getDiceImage(diceNumber: number): string {
        const number = diceNumber ?? 0;
        return `assets/dices/dice${number}.png`;
    }

    getDiceRollImage(): string {
        return 'assets/dices/dice0.png';
    }
}
