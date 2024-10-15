import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Game } from '@app/interfaces/game-model.interface';
import { GameService } from '@app/services/game/game.service';
import { SocketService } from '@app/services/socket/socket.service';
import { IconDefinition, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-create-page',
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
})
export class CreatePageComponent implements OnInit, OnDestroy {
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
        private socketService: SocketService,
    ) {}

    ngOnInit() {
        const gameSub = this.gameService.fetchAllGames().subscribe({
            next: (games) => {
                this.games = games;
            },
        });
        this.subscriptions.add(gameSub);
    }
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
                    if (!game || !game.visibility) {
                        this.errorMessage = 'Le jeu sélectionné a été supprimé ou caché. Veuillez en choisir un autre.';
                        this.selectedGame = null;
                    } else {
                        this.socketService.createNewSession(4, game._id).subscribe({
                            next: (data: any) => {
                                this.sessionCode = data.sessionCode;
                                this.isCreatingGame = true;
                                console.log('Nouvelle session créée avec le code :', this.sessionCode);
                                this.showCharacterCreation = true;
                            },
                            error: (err) => {
                                console.error('Erreur lors de la création de la session:', err);
                                this.errorMessage = 'Une erreur est survenue lors de la création de la session.';
                            },
                        });

                        this.errorMessage = '';
                    }
                },
                error: () => {
                    this.errorMessage = 'Une erreur est survenue lors de la vérification du jeu.';
                    this.selectedGame = null;
                },
            });
        }
    }
}
