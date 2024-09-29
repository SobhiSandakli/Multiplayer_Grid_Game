import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Game } from '@app/game.model';
import { LoggerService } from '@app/services/LoggerService';
import { faArrowLeft, faDownload, faEdit, faEye, faEyeSlash, faTrashAlt, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { GameService } from 'src/app/services/game.service';
@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class AdminPageComponent implements OnInit {
    [x: string]: unknown;
    faTrashAlt = faTrashAlt;
    faEdit: IconDefinition = faEdit;
    faEye: IconDefinition = faEye;
    faArrowLeft: IconDefinition = faArrowLeft;
    faEyeSlash = faEyeSlash;
    faDownload = faDownload;
    games: Game[] = [];
    hoveredGame: string | null = null;
    isGameSetupModalVisible: boolean = false;
    showDeletePopup = false;

    constructor(
        private gameService: GameService,
        private logger: LoggerService,
        private router: Router,
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

    editGame(game: Game): void {
        this.router.navigate(['/edit-page'], { queryParams: { gameId: game._id } });
    }

    downloadGame(game: Game): void {
        const gameData = { ...game };
        const jsonString = JSON.stringify(gameData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${game.name}.json`;
        link.click();
    }

    openGameSetupModal(): void {
        this.isGameSetupModalVisible = true;
    }

    closeGameSetupModal(): void {
        this.isGameSetupModalVisible = false;
    }

    onDeleteConfirm(gameId: string): void {
        this.showDeletePopup = false;
        this.deleteGame(gameId);
    }

    onDeleteCancel(): void {
        this.showDeletePopup = false;
    }
    openDeletePopup(): void {
        this.showDeletePopup = true;
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

    validateGameBeforeDelete(gameId: string) {
        this.gameService.fetchGame(gameId).subscribe({
            next: (game) => {
                if (!game) {
                    window.alert('Ce jeu a déjà été supprimé.');
                } else {
                    // Proceed to delete the game if it exists
                    this.openDeletePopup();
                }
            },
            error: () => {
                this.errorMessage = 'Une erreur est survenue lors de la vérification du jeu.';
            },
        });
    }
}
