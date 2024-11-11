import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SocketService } from '@app/services/socket/socket.service';
import { GameInfo } from '@app/interfaces/socket.interface';
import { SessionService } from '../session/session.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TIMER_COMBAT, TURN_NOTIF_DURATION } from 'src/constants/game-constants';
import { DiceComponent } from '@app/components/dice/dice.component';
import { SessionSocket } from '../socket/sessionSocket.service';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionService {
    constructor(
        private socketService: SocketService,
        private sessionService: SessionService,
        private snackBar: MatSnackBar,
        private diceComponent: DiceComponent,
        private sessionSocket: SessionSocket,
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
        this.subscribeToCombatStarted();
        this.subscribeCombatNotification();
        this.subscribeCombatTurn();
        this.subscribeUpdateDiceRoll();
        this.subscribeToEscapeAttempt();
        this.subscribeCombatTimeLeft();
        this.subscribeCombatTurnEnded();
        this.subscribeAttackResult();
        this.subscribeEvansionResult();
        this.subscribeOnOpponentDefeated();
        this.subscribeOnEvasionSuccess();
        this.subscribeOnOpponentEvaded();
        this.subscribeOnGameEnded();
    }
    private subscribeGameInfo(): void {
        this.subscriptions.add(
            this.sessionSocket.onGameInfo(this.sessionService.sessionCode).subscribe((gameInfo) => {
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

                    const isPlayerTurn = currentPlayerSocketId === this.sessionSocket.getSocketId();
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

    private subscribeToCombatStarted(): void {
        this.subscriptions.add(
            this.socketService.onCombatStarted().subscribe((data) => {
                this.isPlayerInCombat = true;
                this.escapeAttempt = 2;
                this.combatOpponentInfo = { name: data.opponentName, avatar: data.opponentAvatar };

                setTimeout(() => {
                    this.combatOpponentInfo = null;
                }, TIMER_COMBAT);
            }),
        );
    }
    private subscribeCombatNotification(): void {
        this.subscriptions.add(
            this.socketService.onCombatNotification().subscribe((data) => {
                if (!this.isPlayerInCombat) {
                    this.isCombatInProgress = data.combat;
                }
            }),
        );
    }
    private subscribeCombatTurn(): void {
        this.subscriptions.add(
            this.socketService.onCombatTurnStarted().subscribe((data) => {
                this.isCombatTurn = data.playerSocketId === this.sessionSocket.getSocketId();
                this.isAttackOptionDisabled = !this.isCombatTurn;
                this.isEvasionOptionDisabled = !this.isCombatTurn;
                this.combatTimeLeft = data.timeLeft;
                this.currentPlayerSocketIdSubject.next(data.playerSocketId);

                if (this.isPlayerInCombat) {
                    this.timeLeft = this.combatTimeLeft;
                } else {
                    this.timeLeft = 0;
                }
            }),
        );
    }
    private subscribeToEscapeAttempt(): void {
        this.subscriptions.add(
            this.sessionSocket.onPlayerListUpdate().subscribe((data) => {
                const currentPlayer = data.players.find((p) => p.name === this.playerName);
                this.escapeAttempt = currentPlayer?.attributes ? currentPlayer.attributes['nbEvasion'].currentValue ?? 0 : 0;
            }),
        );
    }
    private subscribeCombatTimeLeft(): void {
        this.subscriptions.add(
            this.socketService.onCombatTimeLeft().subscribe((data) => {
                this.combatTimeLeft = data.timeLeft;
                this.timeLeft = this.combatTimeLeft;
            }),
        );
    }
    private subscribeUpdateDiceRoll(): void {
        this.subscriptions.add(
            this.socketService.onAttackResult().subscribe((data) => {
                this.sessionService.updateDiceResults(data.attackRoll, data.defenceRoll);
            }),
        );
    }
    private subscribeCombatTurnEnded(): void {
        this.subscriptions.add(
            this.socketService.onCombatTurnEnded().subscribe(() => {
                if (this.isPlayerInCombat) {
                    this.timeLeft = this.combatTimeLeft;
                } else {
                    this.timeLeft = 0;
                }
            }),
        );
    }
    private subscribeAttackResult(): void {
        this.subscriptions.add(
            this.socketService.onAttackResult().subscribe((data) => {
                this.attackBase = data.attackBase;
                this.attackRoll = data.attackRoll;
                this.defenceBase = data.defenceBase;
                this.defenceRoll = data.defenceRoll;
                this.attackSuccess = data.success;
                this.diceComponent.rollDice();
                this.diceComponent.showDiceRoll(data.attackRoll, data.defenceRoll);
            }),
        );
    }
    private subscribeEvansionResult(): void {
        this.subscriptions.add(
            this.socketService.onEvasionResult().subscribe((data) => {
                if (data.success) {
                    this.isFight = false;
                    this.action = 1;

                    this.openSnackBar('Vous avez réussi à vous échapper !');
                    this.socketService.onCombatEnded().subscribe((dataEnd) => {
                        this.openSnackBar(dataEnd.message);
                    });
                } else {
                    this.openSnackBar("Vous n'avez pas réussi à vous échapper.");
                }
            }),
        );
    }
    private subscribeOnOpponentDefeated(): void {
        this.subscriptions.add(
            this.socketService.onOpponentDefeated().subscribe((data) => {
                this.isCombatInProgress = false;
                this.isFight = false;
                this.action = 1;
                this.isPlayerInCombat = false;
                this.snackBar.open(data.message, 'OK', { duration: 3000 });
            }),
        );
    }
    private subscribeOnEvasionSuccess(): void {
        this.subscriptions.add(
            this.socketService.onEvasionSuccess().subscribe((data) => {
                this.isCombatInProgress = false;
                this.isPlayerInCombat = false;
                this.isFight = false;
                this.action = 1;
                this.snackBar.open(data.message, 'OK', { duration: 3000 });
            }),
        );
    }
    private subscribeOnOpponentEvaded(): void {
        this.subscriptions.add(
            this.socketService.onOpponentEvaded().subscribe(() => {
                this.isPlayerInCombat = false;
                this.isCombatInProgress = false;
                this.isFight = false;
                this.snackBar.open("Votre adversaire a réussi à s'échapper du combat.", 'OK', { duration: 3000 });
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
