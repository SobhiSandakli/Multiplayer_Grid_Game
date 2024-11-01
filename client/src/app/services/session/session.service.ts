import { Subscription } from 'rxjs';
import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Attribute } from '@app/interfaces/attributes.interface';
import { Game } from '@app/interfaces/game-model.interface';
import { Player } from '@app/interfaces/player.interface';
import { SocketService } from '@app/services/socket/socket.service';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

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
    players: Player[] = [];
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
        private socketService: SocketService,
    ) {}
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        if (this.isOrganizer && this.sessionCode) {
            this.socketService.leaveSession(this.sessionCode);
        }
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
        });
    }

    subscribeToOrganizerLeft(): void {
        this.socketService.onOrganizerLeft().subscribe(() => {
            this.router.navigate(['/home']);
        });
    }
    subscribeToPlayerListUpdate(): void {
        this.socketService.onPlayerListUpdate().subscribe((data) => {
            this.players = data.players;
            const currentPlayer = this.players.find((p) => p.socketId === this.socketService.getSocketId());
            this.isOrganizer = currentPlayer ? currentPlayer.isOrganizer : false;
            if (currentPlayer) {
                this.updatePlayerData(currentPlayer);
            }
            this.updatePlayersList(data.players);
            this.updateCurrentPlayerDetails();
        });
    }
    updatePlayerData(currentPlayer: Player): void {
        this.playerName = currentPlayer.name;
        this.playerAvatar = currentPlayer.avatar;
        this.playerAttributes = currentPlayer.attributes;
    }
    updatePlayersList(players: Player[]): void {
        this.players = players;
    }
    updateCurrentPlayerDetails(): void {
        const currentPlayer = this.players.find((p) => p.socketId === this.socketService.getSocketId());
        this.isOrganizer = currentPlayer ? currentPlayer.isOrganizer : false;
        if (currentPlayer) {
            this.playerName = currentPlayer.name;
            this.playerAttributes = currentPlayer.attributes;
        }
    }
}
