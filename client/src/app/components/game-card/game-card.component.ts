import { Component, Input } from '@angular/core';
import { Game } from '@app/interfaces/game.interface';

@Component({
    selector: 'app-game-card',
    templateUrl: './game-card.component.html',
    styleUrls: ['./game-card.component.scss'],
    standalone: true,
})
export class GameCardComponent {
    @Input() game: Game;
    @Input() isSelected: boolean = false;
}
