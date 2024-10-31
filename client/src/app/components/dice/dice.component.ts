import { Component } from '@angular/core';

@Component({
    selector: 'app-dice',
    templateUrl: './dice.component.html',
    styleUrls: ['./dice.component.scss'],
})
export class DiceComponent {
    diceResults: number[] = [1, 1]; // Tableau pour deux dés
    rolling: boolean = false;
    displayRoleDice: boolean = true;

    rollDice() {
        this.rolling = true;
        this.displayRoleDice = true;
        setTimeout(() => {
            this.diceResults = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
            this.rolling = false;
            this.displayRoleDice = false;
        }, 300); // Durée de l'animation, par exemple 1 seconde
    }

    getDiceImage(diceNumber: number): string {
        return `assets/dices/dice${diceNumber}.png`;
    }

    getDiceRollImage(): string {
        return `assets/dices/dice-roll.png`;
    }
}
