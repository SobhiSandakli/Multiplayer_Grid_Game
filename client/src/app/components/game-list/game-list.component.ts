import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Game } from '@app/interfaces/game-model.interface';
import { GameService } from '@app/services/game/game.service';

@Component({
    selector: 'app-game-list',
    templateUrl: './game-list.component.html',
    styleUrls: ['./game-list.component.scss'],
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
