import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { Game } from '@app/game.model';
import { GameService } from '@app/services/game.service';

@Component({
    selector: 'app-game-list',
    templateUrl: './game-list.component.html',
    styleUrls: ['./game-list.component.scss'],
    standalone: true,
    imports: [CommonModule, GameCardComponent],
})
export class GameListComponent implements OnInit {
    @Input() games: Game[] = [];
    @Output() gameSelected = new EventEmitter<Game>();

    selectedGame: Game | null = null;

    constructor(private gameService: GameService) {}

    ngOnInit() {
        this.gameService.fetchAllGames().subscribe({
            next: (games) => (this.games = games),
        });
    }

    selectGame(game: Game) {
        this.selectedGame = game;
        this.gameSelected.emit(game);
    }

    isSelected(game: Game): boolean {
        return this.selectedGame?._id === game._id;
    }
}
