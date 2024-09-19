import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { Game } from '@app/interfaces/game.interface';

@Component({
    selector: 'app-game-list',
    templateUrl: './game-list.component.html',
    styleUrls: ['./game-list.component.scss'],
    standalone: true,
    imports: [CommonModule, GameCardComponent],
})
export class GameListComponent {
    @Input() games: Game[] = [];
    @Output() gameSelected = new EventEmitter<string | null>();

    selectedGame: string | null = null;

    selectGame(gameName: string) {
        if (this.selectedGame === gameName) {
            // if the game is already selected, unselect it
            this.selectedGame = null;
            this.gameSelected.emit(null);
        } else {
            // if the game is not selected, select it
            this.selectedGame = gameName;
            this.gameSelected.emit(gameName);
        }
    }

    isSelected(gameName: string): boolean {
        return this.selectedGame === gameName;
    }
}
