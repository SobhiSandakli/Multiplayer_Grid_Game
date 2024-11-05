import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-dice',
    templateUrl: './dice.component.html',
    styleUrls: ['./dice.component.scss'],
})
export class DiceComponent {
    @Input() isCombatTurn: boolean = false; // Add input to control highlight
    @Input() attackBase: number | null = null;
    @Input() defenceBase: number | null = null;
    @Input() attackRoll: number = 0;
    @Input() defenceRoll: number = 0;
    @Input() success: boolean | null = null;

    diceResults: number[] = [this.attackRoll, this.defenceRoll];
    rolling: boolean = false;
    displayRoleDice: boolean = true;

    rollDice() {
        this.rolling = true;
        setTimeout(() => {
            this.rolling = false;
        }, 500); // Duration for the dice roll effect
    }

    showDiceRoll(attackRoll: number, defenceRoll: number) {
        this.rolling = true;
        setTimeout(() => {
            this.attackRoll = attackRoll;
            this.defenceRoll = defenceRoll;
            this.rolling = false;
        }, 300);
    }

    getDiceImage(diceNumber: number): string {
        return `assets/dices/dice${diceNumber}.png`;
    }

    getDiceRollImage(): string {
        return 'assets/dices/dice0.png';
    }
}
