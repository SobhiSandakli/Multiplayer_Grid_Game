// join-game.component.ts
import { Component } from '@angular/core';
import { SocketService } from '@app/services/socket.service';
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

    constructor(private socketService: SocketService) {}

    onJoinGame(): void {
        if (this.secretCode.trim() === '') {
            this.errorMessage = 'Veuillez entrer un code valide.';
            return;
        }

        this.socketService.joinGame(this.secretCode).subscribe(
            (response: any) => {
                if (response.success) {
                    this.showCharacterCreation = true;
                    this.sessionCode = this.secretCode;
                } else {
                    this.errorMessage = 'Code invalide. Veuillez réessayer.';
                }
            },
            (error) => {
                this.errorMessage = 'Erreur lors de la connexion à la partie.';
            },
        );
    }
}
