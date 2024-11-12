import { Component, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Game } from '@app/interfaces/game-model.interface';
import { SessionCreatedData } from '@app/interfaces/socket.interface';
import { GameService } from '@app/services/game/game.service';
import { SessionSocket } from '@app/services/socket/sessionSocket.service';
import { GameValidateService } from '@app/services/validate-game/gameValidate.service';
import { IconDefinition, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { SNACK_BAR_DURATION } from 'src/constants/players-constants';

@Component({
    selector: 'app-create-page',
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
})
export class CreatePageComponent implements OnDestroy {
    faArrowLeft: IconDefinition = faArrowLeft;
    games: Game[] = [];
    selectedGame: Game | null;
    showCharacterCreation: boolean = false;
    errorMessage: string = '';
    sessionCode: string | null = null;
    isCreatingGame: boolean = true;
    private subscriptions: Subscription = new Subscription();

    constructor(
        private gameService: GameService,
        private router: Router,
        private sessionSocket: SessionSocket,
        private snackBar: MatSnackBar,
        private gameValidate: GameValidateService,
    ) {}

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    onGameSelected(game: Game | null) {
        this.selectedGame = game;
    }

    enableValidation(): boolean {
        return this.selectedGame !== null;
    }

    onBackToGameSelection() {
        this.showCharacterCreation = false;
        this.selectedGame = null;
        this.errorMessage = '';
    }

    goHome() {
        this.router.navigate(['/home']);
    }

    validateGameBeforeCreation() {
        if (this.selectedGame) {
            this.gameService.fetchGame(this.selectedGame._id).subscribe({
                next: (game) => {
                    if (!this.isGameValid(game)) {
                        this.handleInvalidGame();
                    } else {
                        const maxPlayers = this.gameValidate.gridMaxPlayers(game);
                        this.handleGameCreation(game, maxPlayers);
                    }
                },
                error: () => this.handleFetchGameError(),
            });
        }
    }

    private isGameValid(game: Game): boolean {
        return game && game.visibility;
    }

    private handleInvalidGame(): void {
        this.errorMessage = 'Le jeu sélectionné a été supprimé ou caché. Veuillez en choisir un autre.';
        this.handleValidationFailure(this.errorMessage);
        this.selectedGame = null;
    }
    private handleGameCreation(game: Game, maxPlayers: number): void {
        this.sessionSocket.createNewSession(maxPlayers, game._id).subscribe({
            next: (data: SessionCreatedData) => {
                this.sessionCode = data.sessionCode;
                this.isCreatingGame = true;
                this.showCharacterCreation = true;
            },
            error: (err) => this.handleSessionCreationError(err),
        });
    }
    private handleSessionCreationError(err: string): void {
        this.errorMessage = 'Une erreur est survenue lors de la création de la session.' + err;
    }

    private handleFetchGameError(): void {
        this.errorMessage = 'Une erreur est survenue lors de la vérification du jeu.';
        this.selectedGame = null;
    }
    private openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: SNACK_BAR_DURATION,
            panelClass: ['custom-snackbar'],
        });
    }
    private handleValidationFailure(errorMessage: string): void {
        this.openSnackBar(errorMessage);
    }
}
