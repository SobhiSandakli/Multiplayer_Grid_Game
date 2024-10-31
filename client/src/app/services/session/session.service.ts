import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Attribute } from '@app/interfaces/attributes.interface';
import { Game } from '@app/interfaces/game-model.interface';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { SocketService } from '@app/services/socket/socket.service';
import { GameValidateService } from '@app/services/validate-game/gameValidate.service';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SessionService implements OnDestroy {
    isInvolvedInFight: boolean = false;
    showCreationPopup: boolean = false;
    sessionCode: string = '';
    playerName: string = '';
    playerAvatar: string = '';
    maxPlayers: number;
    selectedGame: Game | undefined;
    games: Game[] = [];
    playerAttributes: { [key: string]: Attribute } | undefined;
    isOrganizer: boolean = false;
    faChevronDown = faChevronDown;
    faChevronUp = faChevronUp;
    isExpanded = false;
    leaveSessionPopupVisible: boolean = false;
    leaveSessionMessage: string;
    gameId: string | null = null;
    private subscriptions: Subscription = new Subscription();
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private gameFacade: GameFacadeService,
        private gameValidate: GameValidateService,
        private socketService: SocketService,
    ) {}
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        if (this.isOrganizer && this.sessionCode) {
            this.socketService.leaveSession(this.sessionCode);
        }
    }

    loadGame(gameId: string): void {
        this.gameId = gameId;
        const gameFetch = this.gameFacade.fetchGame(gameId).subscribe({
            next: (game: Game) => {
                this.selectedGame = game;
                this.maxPlayers = this.gameValidate.gridMaxPlayers(game);
                this.playerName = this.playerName || '';
            },
        });
        this.subscriptions.add(gameFetch);
    }
    leaveSession(): void {
        if (this.isOrganizer) {
            this.leaveSessionMessage = "En tant qu'organisateur, quitter la partie entraînera sa suppression. Voulez-vous vraiment continuer ?";
        } else {
            this.leaveSessionMessage = 'Voulez-vous vraiment quitter la partie ?';
        }
        this.leaveSessionPopupVisible = true;
    }
    confirmLeaveSession(): void {
        this.socketService.leaveSession(this.sessionCode);
        if (this.isOrganizer) {
            this.socketService.deleteSession(this.sessionCode);
        }
        this.router.navigate(['/home']);
    }

    cancelLeaveSession(): void {
        this.leaveSessionPopupVisible = false;
    }
    initializeGame(): void {
        this.route.queryParamMap.subscribe((params) => {
            this.sessionCode = params.get('sessionCode') || '';
            this.gameId = params.get('gameId') || '';
            if (this.gameId) {
                this.loadGame(this.gameId);
            }
        });
    }
    initializePlayer(): void {
        this.route.queryParamMap.subscribe((params) => {
            this.playerName = params.get('playerName') || '';
            this.playerAvatar = params.get('playerAvatar') || '';
            this.isOrganizer = params.get('isOrganizer') === 'true';
            const playerAttributesParam = params.get('playerAttributes');
            try {
                this.playerAttributes = playerAttributesParam ? JSON.parse(playerAttributesParam) : {};
            } catch (error) {
                this.playerAttributes = {};
            }
        });
    }
    subscribeToOrganizerLeft(): void {
        this.socketService.onOrganizerLeft().subscribe(() => {
            this.router.navigate(['/home']);
        });
    }
}
