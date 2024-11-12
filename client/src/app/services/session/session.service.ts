import { Injectable, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Attribute } from '@app/interfaces/attributes.interface';
import { Game } from '@app/interfaces/game-model.interface';
import { Player } from '@app/interfaces/player.interface';
import { SocketService } from '@app/services/socket/socket.service';
import { SessionSocket } from '@app/services/socket/sessionSocket.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TURN_NOTIF_DURATION } from 'src/constants/game-constants';
import { PlayerSocket } from '@app/services/socket/playerSocket.service';
import { GameSocket } from '@app/services/socket/gameSocket.service';

@Injectable({
    providedIn: 'root',
})
export class SessionService implements OnDestroy {
    sessionCode: string = '';
    playerName: string = '';
    playerAvatar: string = '';
    selectedGame: Game | undefined;
    players: Player[] = [];
    playerAttributes: { [key: string]: Attribute } | undefined;
    isOrganizer: boolean = false;
    leaveSessionPopupVisible: boolean = false;
    leaveSessionMessage: string;
    gameId: string | null = null;
    playerNames: string[];
    private subscriptions: Subscription = new Subscription();
    private currentPlayerSocketIdSubject = new BehaviorSubject<string | null>(null);

    constructor(
        public router: Router,
        public route: ActivatedRoute,
        public snackBar: MatSnackBar,
        public sessionSocket: SessionSocket,
        private playerSocket: PlayerSocket,
        private gameSocket: GameSocket,
        private socketService: SocketService,
    ) {}
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        if (this.isOrganizer && this.sessionCode) {
            this.sessionSocket.leaveSession(this.sessionCode);
        }
    }
    // eslint-disable-next-line @typescript-eslint/member-ordering
    currentPlayerSocketId$ = this.currentPlayerSocketIdSubject.asObservable();

    setCurrentPlayerSocketId(socketId: string): void {
        this.currentPlayerSocketIdSubject.next(socketId);
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
        this.sessionSocket.leaveSession(this.sessionCode);
        if (this.isOrganizer) {
            this.sessionSocket.deleteSession(this.sessionCode);
        }
        this.router.navigate(['/home']);
        this.leaveSessionPopupVisible = false;
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
        this.gameSocket.onOrganizerLeft().subscribe(() => {
            this.router.navigate(['/home']);
        });
    }
    subscribeToPlayerListUpdate(): void {
        this.playerSocket.onPlayerListUpdate().subscribe((data) => {
            this.players = data.players || [];
            const currentPlayer = this.players.find((p) => p.socketId === this.socketService.getSocketId());
            this.isOrganizer = currentPlayer ? currentPlayer.isOrganizer : false;
            if (currentPlayer) {
                this.updatePlayerData(currentPlayer);
            }
            this.updatePlayersList(data.players);
            this.updateCurrentPlayerDetails();
            this.playerNames = this.players.map((player) => player.name);
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
    openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: TURN_NOTIF_DURATION,
            panelClass: ['custom-snackbar'],
        });
    }
}
