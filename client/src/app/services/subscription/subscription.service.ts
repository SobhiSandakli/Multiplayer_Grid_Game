import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SocketService } from '@app/services/socket/socket.service';
import { GameInfo } from '@app/interfaces/socket.interface';
import { SessionService } from '../session/session.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TIMER_COMBAT, TURN_NOTIF_DURATION } from 'src/constants/game-constants';
import { DiceComponent } from '@app/components/dice/dice.component';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionService {
    constructor(
        private socketService: SocketService,
        private sessionService: SessionService,
        private snackBar: MatSnackBar,
        private diceComponent: DiceComponent,
    ) {}
    attackBase: number = 0;
    attackRoll: number = 0;
    defenceBase: number = 0;
    defenceRoll: number = 0;
    action: number;
    attackSuccess: boolean;
    isPlayerInCombat: boolean = false;
    isCombatInProgress: boolean = false;
    isCombatTurn: boolean = false;
    isAttackOptionDisabled: boolean = true;
    isEvasionOptionDisabled: boolean = true;
    timeLeft: number = 0; // constant file
    escapeAttempt: number = 2; //constant file
    combatTimeLeft: number;
    endGameMessage: string | null = null;
    winnerName: string | null = null;
    isFight: boolean = false;
    combatOpponentInfo: { name: string; avatar: string } | null = null;

    private subscriptions: Subscription = new Subscription();
    private gameInfoSubject = new BehaviorSubject<GameInfo>({ name: '', size: '' });
    public gameInfo$ = this.gameInfoSubject.asObservable();

    private currentPlayerSocketIdSubject = new BehaviorSubject<string>('');
    public currentPlayerSocketId$ = this.currentPlayerSocketIdSubject.asObservable();

    private isPlayerTurnSubject = new BehaviorSubject<boolean>(false);
    public isPlayerTurn$ = this.isPlayerTurnSubject.asObservable();

    private putTimerSubject = new BehaviorSubject<boolean>(false);
    public putTimer$ = this.putTimerSubject.asObservable();

    get displayedCurrentPlayerSocketId(): string | null {
        if (this.isPlayerInCombat || this.isCombatInProgress) {
            return this.currentPlayerSocketIdSubject.value;
        } else {
            return this.currentPlayerSocketIdSubject.value;
        }
    }
    get playerName(): string {
        return this.sessionService.playerName ?? '';
    }
    get displayedIsPlayerTurn(): boolean {
        if (this.isPlayerInCombat) {
            return this.isCombatTurn;
        } else if (this.isCombatInProgress) {
            return false;
        } else {
            return this.isPlayerTurnSubject.value;
        }
    }
    get showEndTurnButton(): boolean {
        return this.isPlayerTurnSubject.value && !this.isPlayerInCombat && !this.isCombatInProgress;
    }
    public initSubscriptions(): void {
        this.subscribeGameInfo();
        this.subsribeCurrentPlayerSocketId();
        this.subscribeNextTurn();
        this.subscribeTimeLeft();
        this.subscribeTurnEnded();
        this.subscribeNoMovementPossible();
        this.subscribeOnGameEnded();
    }
    private subscribeGameInfo(): void {
        this.subscriptions.add(
            this.socketService.onGameInfo(this.sessionService.sessionCode).subscribe((gameInfo) => {
                if (gameInfo) this.gameInfoSubject.next(gameInfo);
            }),
        );
    }
    private subsribeCurrentPlayerSocketId(): void {
        this.subscriptions.add(
            this.socketService.onTurnStarted().subscribe((data) => {
                if (data) {
                    const currentPlayerSocketId = data.playerSocketId;
                    this.currentPlayerSocketIdSubject.next(currentPlayerSocketId);

                    const isPlayerTurn = currentPlayerSocketId === this.socketService.getSocketId();
                    this.isPlayerTurnSubject.next(isPlayerTurn);

                    this.sessionService.setCurrentPlayerSocketId(currentPlayerSocketId);
                    this.putTimerSubject.next(isPlayerTurn);
                }
            }),
        );
    }
    private subscribeNextTurn(): void {
        this.subscriptions.add(
            this.socketService.onNextTurnNotification().subscribe((data) => {
                const playerName = this.getPlayerNameBySocketId(data.playerSocketId);
                this.openSnackBar(`Le tour de ${playerName} commence dans ${data.inSeconds} secondes.`);
            }),
        );
    }
    private subscribeTimeLeft(): void {
        this.subscriptions.add(
            this.socketService.onTimeLeft().subscribe((data) => {
                if (!this.isPlayerInCombat && !this.isCombatInProgress && data.playerSocketId === this.currentPlayerSocketIdSubject.value) {
                    this.timeLeft = data.timeLeft;
                }
            }),
        );
    }
    private subscribeTurnEnded(): void {
        this.subscriptions.add(
            this.socketService.onTurnEnded().subscribe(() => {
                this.isPlayerTurnSubject.next(false);
                this.timeLeft = 0;
                this.putTimerSubject.next(false);
            }),
        );
    }
    private subscribeNoMovementPossible(): void {
        this.subscriptions.add(
            this.socketService.onNoMovementPossible().subscribe((data) => {
                this.openSnackBar(`Aucun mouvement possible pour ${data.playerName} - Le tour de se termine dans 3 secondes.`);
            }),
        );
    }

    private subscribeOnGameEnded(): void {
        this.subscriptions.add(
            this.socketService.onGameEnded().subscribe((data) => {
                this.openEndGameModal('DONEE', data.winner);
                setTimeout(() => {
                    this.sessionService.router.navigate(['/home']);
                }, TIMER_COMBAT);
            }),
        );
    }
    getPlayerNameBySocketId(socketId: string): string {
        const player = this.sessionService.players.find((p) => p.socketId === socketId);
        return player ? player.name : 'Joueur inconnu';
    }
    endTurn(): void {
        if (this.isPlayerTurnSubject.value) {
            this.socketService.endTurn(this.sessionService.sessionCode);
        }
    }
    unsubscribeAll(): void {
        this.subscriptions.unsubscribe();
    }
    updateDiceResults(attackRoll: number, defenceRoll: number) {
        this.diceComponent.showDiceRoll(attackRoll, defenceRoll);
    }
    private openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: TURN_NOTIF_DURATION,
            panelClass: ['custom-snackbar'],
        });
    }
    private openEndGameModal(message: string, winner: string): void {
            this.endGameMessage = message;
            this.winnerName = winner;
        }
}
