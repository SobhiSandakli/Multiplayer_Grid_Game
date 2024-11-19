import { Injectable, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Attribute } from '@app/interfaces/attributes.interface';
import { Game } from '@app/interfaces/game-model.interface';
import { Player } from '@app/interfaces/player.interface';
import { SessionFacadeService } from '@app/services/facade/sessionFacade.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TURN_NOTIF_DURATION } from 'src/constants/game-constants';

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
    playerInventory: string[] = [];
    currentPlayerSocketId$;
    private currentPlayerSocketIdSubject = new BehaviorSubject<string | null>(null);
    private subscriptions: Subscription = new Subscription();
    constructor(
        public router: Router,
        public route: ActivatedRoute,
        public snackBar: MatSnackBar,
        private sessionFacadeService: SessionFacadeService,
    ) {
        this.currentPlayerSocketId$ = this.currentPlayerSocketIdSubject.asObservable();
    }
    get onOrganizerLeft() {
        return this.sessionFacadeService.onOrganizerLeft();
    }
    get onPlayerListUpdate() {
        return this.sessionFacadeService.onPlayerListUpdate();
    }
    get getSocketId() {
        return this.sessionFacadeService.getSocketId();
    }
    get currentPlayerSocketId(): string | null {
        return this.currentPlayerSocketIdSubject.value;
    }
    getCurrentPlayer(): Player | undefined {
        return this.players.find((player) => player.socketId === this.currentPlayerSocketId);
    }
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        if (this.isOrganizer && this.sessionCode) {
            this.sessionFacadeService.leaveSession(this.sessionCode);
        }
    }

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
        this.sessionFacadeService.leaveSession(this.sessionCode);
        if (this.isOrganizer) {
            this.sessionFacadeService.deleteSession(this.sessionCode);
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
        this.onOrganizerLeft.subscribe(() => {
            this.router.navigate(['/home']);
        });
    }
    subscribeToPlayerListUpdate(): void {
        this.onPlayerListUpdate.subscribe((data) => {
            this.players = data.players || [];
            const currentPlayer = this.players.find((p) => p.socketId === this.getSocketId);
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
        this.playerInventory = currentPlayer.inventory;
    }
    updatePlayersList(players: Player[]): void {
        this.players = players;
    }
    updateCurrentPlayerDetails(): void {
        const currentPlayer = this.players.find((p) => p.socketId === this.getSocketId);
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
