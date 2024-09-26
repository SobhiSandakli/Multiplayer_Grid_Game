import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CharacterCreationComponent } from '@app/components/character-creation/character-creation.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { Game } from '@app/game.model';
import { GameService } from '@app/services/game.service';

@Component({
    selector: 'app-create-page',
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, GameListComponent, CharacterCreationComponent],
})
export class CreatePageComponent implements OnInit {
    games: Game[] = [];
    selectedGame: Game | null = null;
    showCharacterCreation: boolean = false;
    canNavigate: boolean = true;
    errorMessage: string = '';

    constructor(
        private gameService: GameService,
        private router: Router,
    ) {}

    ngOnInit() {
        this.gameService.fetchAllGames().subscribe({
            next: (games) => {
                this.games = games;
            },
        });
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
                        // if the game is not found or hidden
                        this.errorMessage = 'Le jeu sélectionné a été supprimé ou caché. Veuillez en choisir un autre.';
                        this.selectedGame = null;
                    } else {
                        // if the game is found and visible
                        this.showCharacterCreation = true;
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
