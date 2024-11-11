import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DiceComponent } from '@app/components/dice/dice.component';
import { Attribute } from '@app/interfaces/attributes.interface';
import { Game } from '@app/interfaces/game-model.interface';
import { Player } from '@app/interfaces/player.interface';
import { SocketService } from '@app/services/socket/socket.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SessionSocket } from '../socket/sessionSocket.service';

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
        private socketService: SocketService,
        private diceComponent: DiceComponent,
        private sessionSocket: SessionSocket,
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
        this.socketService.onOrganizerLeft().subscribe(() => {
            this.router.navigate(['/home']);
        });
    }
    subscribeToPlayerListUpdate(): void {
        this.sessionSocket.onPlayerListUpdate().subscribe((data) => {
            this.players = data.players || [];
            const currentPlayer = this.players.find((p) => p.socketId === this.sessionSocket.getSocketId());
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
    updateDiceResults(attackRoll: number, defenceRoll: number) {
        this.diceComponent.showDiceRoll(attackRoll, defenceRoll);
    }
    updateCurrentPlayerDetails(): void {
        const currentPlayer = this.players.find((p) => p.socketId === this.sessionSocket.getSocketId());
        this.isOrganizer = currentPlayer ? currentPlayer.isOrganizer : false;
        if (currentPlayer) {
            this.playerName = currentPlayer.name;
            this.playerAttributes = currentPlayer.attributes;
        }
    }
}
