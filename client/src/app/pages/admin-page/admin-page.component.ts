import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Game } from '@app/interfaces/game-model.interface';
import { GameService } from '@app/services/game/game.service';
import { IconDefinition, faArrowLeft, faDownload, faEdit, faEye, faEyeSlash, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class AdminPageComponent implements OnInit, OnDestroy {
    faTrashAlt = faTrashAlt;
    faEdit: IconDefinition = faEdit;
    faEye: IconDefinition = faEye;
    faArrowLeft: IconDefinition = faArrowLeft;
    faEyeSlash = faEyeSlash;
    faDownload = faDownload;
    games: Game[] = [];
    hoveredGame: string | null = null;
    isGameSetupModalVisible: boolean = false;
    selectedGameId: string | null = null;
    private subscriptions: Subscription = new Subscription();

    constructor(
        private gameService: GameService,
        private snackBar: MatSnackBar,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.loadGames();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadGames(): void {
        const gameSub = this.gameService.fetchAllGames().subscribe(
            (games: Game[]) => {
                this.games = games;
            },
            (error) => {
                this.handleError(error, 'Failed to fetch games');
            },
        );
        this.subscriptions.add(gameSub);
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
            },
            (error) => {
                this.handleError(error, `Failed to update visibility for game ${game._id}`);
            },
        );
    }

    editGame(game: Game): void {
        this.router.navigate(['/edit-page'], { queryParams: { gameId: game._id } });
    }

    openGameSetupModal(): void {
        this.isGameSetupModalVisible = true;
    }

    closeGameSetupModal(): void {
        this.isGameSetupModalVisible = false;
    }

    onDeleteConfirm(): void {
        if (this.selectedGameId) {
            this.deleteGame(this.selectedGameId);
            this.selectedGameId = null;
        }
    }

    onDeleteCancel(): void {
        this.selectedGameId = null;
    }

    deleteGame(gameId: string): void {
        this.gameService.deleteGame(gameId).subscribe(
            () => {
                this.games = this.games.filter((game) => game._id !== gameId);
            },
            (error) => this.handleError(error, 'Failed to delete game'),
        );
    }

    validateGameBeforeDelete(gameId: string): void {
        this.gameService.fetchGame(gameId).subscribe({
            next: (game) => {
                if (!game) {
                    this.handleDeletedGame('Ce jeu a déjà été supprimé.');
                } else {
                    this.selectedGameId = gameId;
                }
            },
            error: (error) => {
                this.handleError(error, 'Une erreur est survenue lors de la vérification du jeu.');
            },
        });
    }
    downloadGame(game: Game): void {
        const { visibility, ...gameData } = game;
        const jsonString = JSON.stringify(gameData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${game.name}.json`;
        link.click();
    }

    private handleError(error: Error, fallbackMessage: string): void {
        const errorMessage = error?.message || fallbackMessage;
        this.openSnackBar(errorMessage);
    }

    private openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: ['custom-snackbar'],
        });
    }
    private handleDeletedGame(errorMessage: string): void {
        this.openSnackBar(errorMessage);
    }
}
