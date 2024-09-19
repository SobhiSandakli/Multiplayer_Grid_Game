import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { GameService } from 'src/app/services/game.service';
import { Game } from '@app/game.model';
import { LoggerService } from '@app/services/LoggerService';
import { faTrashAlt, faEdit,faEye,faEyeSlash,IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class AdminPageComponent implements OnInit {
    faTrashAlt = faTrashAlt;
    faEdit:IconDefinition = faEdit;
    faEye:IconDefinition = faEye;
    faEyeSlash = faEyeSlash;
    [x: string]: unknown;
    games: Game[] = [];
    hoveredGame: string | null = null;

    constructor(
        private gameService: GameService,
        private logger: LoggerService,
        private cdr: ChangeDetectorRef,
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
        game.visibility = !game.visibility;
        this.logger.log(`Visibility updated for game ${game._id}: ${game.visibility}`);
        this.cdr.detectChanges();
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
