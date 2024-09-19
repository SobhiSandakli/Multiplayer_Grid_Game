import { Component, OnInit } from '@angular/core';
import { GameService } from 'src/app/services/game.service';
import { Game } from '@app/game.model';
import { LoggerService } from '@app/services/LoggerService';
import { faTrashAlt, faEdit, faEye, faEyeSlash, IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
})
export class AdminPageComponent implements OnInit {
    [x: string]: unknown;
    faTrashAlt = faTrashAlt;
    faEdit: IconDefinition = faEdit;
    faEye: IconDefinition = faEye;
    faEyeSlash = faEyeSlash;
    games: Game[] = [];
    hoveredGame: string | null = null;

    constructor(
        private gameService: GameService,
        private logger: LoggerService,
    ) {}
    ngOnInit(): void {
        this.loadGames();
    }

    loadGames(): void {
        this.gameService.fetchAllGames().subscribe(
            (games: Game[]) => {
                this.games = games;
            },
            (error) => {
                this.logger.error('Failed to fetch games: ' + error);
            },
        );
    }

    onMouseOver(gameId: string): void {
        this.hoveredGame = gameId;
    }

    onMouseOut(): void {
        this.hoveredGame = null;
    }

    toggleVisibility(game: Game): void {
        const updatedVisibility = !game.visibility;
        this.gameService.toggleVisibility(game._id, updatedVisibility).subscribe(
            () => {
                game.visibility = updatedVisibility;
                this.logger.log(`Visibility updated for game ${game._id}: ${game.visibility}`);
            },
            (error) => {
                this.logger.error(`Failed to update visibility for game ${game._id}: ${error}`);
            },
        );
    }

    deleteGame(gameId: string): void {
        this.gameService.deleteGame(gameId).subscribe(
            () => {
                this.games = this.games.filter((game) => game._id !== gameId);
                this.logger.log('Game deleted successfully');
            },
            (error) => this.logger.error('Failed to delete game:' + error),
        );
    }
}
