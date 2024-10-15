import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Game } from '@app/interfaces/game-model.interface';
import { GameService } from '@app/services/game/game.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-list',
    templateUrl: './game-list.component.html',
    styleUrls: ['./game-list.component.scss'],
})
export class GameListComponent implements OnInit {
    @Input() games: Game[] = [];
    @Output() gameSelected = new EventEmitter<Game>();
    selectedGame: Game | null = null;
    private subscriptions = new Subscription();

    constructor(private gameService: GameService) {}

    ngOnInit() {
        const gameSub = this.gameService.fetchAllGames().subscribe({
            next: (games) => (this.games = games),
        });
        this.subscriptions.add(gameSub);
    }
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    selectGame(game: Game) {
        this.selectedGame = game;
        this.gameSelected.emit(game);
    }

    isSelected(game: Game): boolean {
        return this.selectedGame?._id === game._id;
    }
}
