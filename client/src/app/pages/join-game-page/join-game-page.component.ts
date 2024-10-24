import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JoinGameResponse } from '@app/interfaces/socket.interface';
import { SocketService } from '@app/services/socket/socket.service';
import { faArrowLeft, IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-join-game',
    templateUrl: './join-game-page.component.html',
    styleUrls: ['./join-game-page.component.scss'],
})
export class JoinGameComponent {
    faArrowLeft: IconDefinition = faArrowLeft;
    secretCode: string = '';
    errorMessage: string = '';
    showCharacterCreation: boolean = false;
    sessionCode: string | null = null;
    isCreatingGame: boolean = false;

    constructor(
        private socketService: SocketService,
        private snackBar: MatSnackBar,
    ) {}
    onBackToGameSelection(): void {
        this.showCharacterCreation = false;
    }

    onJoinGame(): void {
        if (this.isSecretCodeEmpty()) {
            this.errorMessage = 'Veuillez entrer un code valide.';
            return;
        }

        this.joinGameRequest();
    }

    private isSecretCodeEmpty(): boolean {
        return this.secretCode.trim() === '';
    }

    private joinGameRequest(): void {
        this.socketService.joinGame(this.secretCode).subscribe(
            (response: JoinGameResponse) => this.handleJoinGameResponse(response),
            (error) => this.handleValidationFailure('Erreur lors de la connexion à la partie : ' + error),
        );
    }
    private handleJoinGameResponse(response: JoinGameResponse): void {
        if (response.success) {
            this.setupGameSession();
        } else {
            this.handleJoinGameFailure(response.message);
        }
    }

    private setupGameSession(): void {
        this.showCharacterCreation = true;
        this.sessionCode = this.secretCode;
        this.isCreatingGame = false;
    }

    private handleJoinGameFailure(message: string): void {
        this.showCharacterCreation = false;
        if (message === 'La salle est verrouillée.') {
            this.handleValidationFailure('Impossible de rejoindre la salle, la salle est verrouillée.');
        } else if (message === 'Le nombre maximum de joueurs est atteint.') {
            this.showCharacterCreation = false;
            this.handleValidationFailure('La salle est complète. Le nombre maximum de joueurs est atteint.');
        } else {
            this.handleValidationFailure('Code invalide. Veuillez réessayer.');
        }
    }

    private openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: ['custom-snackbar'],
        });
    }

    private handleValidationFailure(errorMessage: string): void {
        this.openSnackBar(errorMessage);
    }
}
