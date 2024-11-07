import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { DiceComponent } from '@app/components/dice/dice.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { Player } from '@app/interfaces/player.interface';
// import { GameInfo } from '@app/interfaces/socket.interface';
import { SessionService } from '@app/services/session/session.service';
import { SocketService } from '@app/services/socket/socket.service';
import { SubscriptionService } from '@app/services/subscription/subscription.service';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { TIMER_COMBAT, TURN_NOTIF_DURATION } from 'src/constants/game-constants';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss', './game-page2.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    @ViewChild(DiceComponent) diceComponent!: DiceComponent;
    faChevronDown = faChevronDown;
    faChevronUp = faChevronUp;
    // gameInfo: GameInfo = { name: '', size: '' };
    timer: TimerComponent;
    action: number;
    speedPoints: number;
    avatar: string;
    isActive: boolean = false;
    escapeAttempt: number = 2;
    remainingHealth: number = 0;
    // timeLeft: number = 0;
    putTimer: boolean = false;
    isExpanded: boolean = false;
    isPlayerTurn: boolean = false;
    currentPlayerSocketId: string;
    isInvolvedInFight: boolean = false;
    opposentPlayer: string;
    isCombatInProgress: boolean = false;
    isPlayerInCombat: boolean = false;
    isCombatTurn: boolean = false;
    combatOpponentInfo: { name: string; avatar: string } | null = null;
    isAttackOptionDisabled: boolean = true;
    isEvasionOptionDisabled: boolean = true;
    combatTimeLeft: number;
    isFight: boolean = false;
    combatCurrentPlayerSocketId: string | null = null;

    attackBase: number = 0;
    attackRoll: number = 0;
    defenceBase: number = 0;
    defenceRoll: number = 0;
    attackSuccess: boolean;

    endGameMessage: string | null = null;
    winnerName: string | null = null;
    evasionSuccess: boolean | null = null;

    private subscriptions: Subscription = new Subscription();

    constructor(
        private router: Router,
        private snackBar: MatSnackBar,
        private socketService: SocketService,
        public subscriptionService: SubscriptionService,
        public sessionService: SessionService,
    ) {}

    get sessionCode() {
        return this.sessionService.sessionCode;
    }

    get gameName(): string {
        return this.sessionService.selectedGame?.name ?? '';
    }

    get gameDescription(): string {
        return this.sessionService.selectedGame?.description ?? '';
    }

    get gameSize(): string {
        return this.sessionService.selectedGame?.size ?? '';
    }

    get playerCount(): number {
        return this.sessionService.players.length;
    }

    get playerName(): string {
        return this.sessionService.playerName ?? '';
    }
    get playerAvatar(): string {
        return this.sessionService.playerAvatar;
    }

    get playerAttributes() {
        return this.sessionService.playerAttributes;
    }

    get leaveSessionPopupVisible(): boolean {
        return this.sessionService.leaveSessionPopupVisible;
    }

    get leaveSessionMessage(): string {
        return this.sessionService.leaveSessionMessage;
    }

    get isOrganizer(): boolean {
        return this.sessionService.isOrganizer;
    }
    get players(): Player[] {
        return this.sessionService.players;
    }
    get displayedIsPlayerTurn(): boolean {
        if (this.isPlayerInCombat) {
            return this.isCombatTurn;
        } else if (this.isCombatInProgress) {
            return false;
        } else {
            return this.isPlayerTurn;
        }
    }

    public gameInfo$ = this.subscriptionService.gameInfo$;
    public currentPlayerSocketId$ = this.subscriptionService.currentPlayerSocketId$;
    public isPlayerTurn$ = this.subscriptionService.isPlayerTurn$;
    public putTimer$ = this.subscriptionService.putTimer$;

    ngOnInit(): void {
        this.sessionService.leaveSessionPopupVisible = false;
        this.sessionService.initializeGame();
        this.sessionService.subscribeToPlayerListUpdate();
        this.sessionService.subscribeToOrganizerLeft();
        this.subscriptionService.subscribeGameInfo();
        this.subscriptionService.subsribeCurrentPlayerSocketId();
        this.subscriptionService.subscribeNextTurn();
        this.subscriptionService.subscribeTimeLeft();
        this.subscriptionService.subscribeTurnEnded();
        this.subscriptionService.subscribeNoMovementPossible();
        this.speedPoints = this.playerAttributes?.speed.currentValue ?? 0;
        this.remainingHealth = this.playerAttributes?.life?.currentValue ?? 0;

        this.handleActionPerformed();
        this.action = 1;


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

        this.subscriptions.add(
            this.socketService.onAttackResult().subscribe((data) => {
                this.updateDiceResults(data.attackRoll, data.defenceRoll);
            }),
        );

        this.subscriptions.add(
            this.socketService.onCombatTurnStarted().subscribe((data) => {
                this.isCombatTurn = data.playerSocketId === this.socketService.getSocketId();
                this.isAttackOptionDisabled = !this.isCombatTurn;
                this.isEvasionOptionDisabled = !this.isCombatTurn;
                this.combatTimeLeft = data.timeLeft;
                this.combatCurrentPlayerSocketId = data.playerSocketId;

                if (this.isPlayerInCombat) {
                    this.subscriptionService.timeLeft = this.combatTimeLeft;
                } else {
                    this.subscriptionService.timeLeft = 0;
                }
            }),
        );

        this.subscriptions.add(
            this.socketService.onPlayerListUpdate().subscribe((data) => {
                const currentPlayer = data.players.find((p) => p.name === this.playerName);
                this.escapeAttempt = currentPlayer?.attributes ? currentPlayer.attributes['nbEvasion'].currentValue ?? 0 : 0;
            }),
        );

        this.subscriptions.add(
            this.socketService.onCombatTimeLeft().subscribe((data) => {
                this.combatTimeLeft = data.timeLeft;
                this.subscriptionService.timeLeft = this.combatTimeLeft;
            }),
        );

        this.subscriptions.add(
            this.socketService.onCombatTurnEnded().subscribe(() => {
                if (this.isPlayerInCombat) {
                    this.subscriptionService.timeLeft = this.combatTimeLeft;
                } else {
                    this.subscriptionService.timeLeft = 0;
                }
            }),
        );

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

        this.subscriptions.add(
            this.socketService.onDefeated().subscribe((data) => {
                this.isCombatInProgress = false;
                this.isPlayerInCombat = false;
                this.isCombatTurn = false;
                this.isFight = false;
                this.action = 1;
                this.combatCurrentPlayerSocketId = null;
                this.snackBar.open(data.message, 'OK', { duration: 3000 });
            }),
        );

        this.subscriptions.add(
            this.socketService.onOpponentDefeated().subscribe((data) => {
                this.isCombatInProgress = false;
                this.isFight = false;
                this.action = 1;
                this.isPlayerInCombat = false;
                this.snackBar.open(data.message, 'OK', { duration: 3000 });
            }),
        );

        this.subscriptions.add(
            this.socketService.onEvasionSuccess().subscribe((data) => {
                this.isCombatInProgress = false;
                this.isPlayerInCombat = false;
                this.isFight = false;
                this.action = 1;
                this.snackBar.open(data.message, 'OK', { duration: 3000 });
            }),
        );

        this.subscriptions.add(
            this.socketService.onOpponentEvaded().subscribe(() => {
                this.isPlayerInCombat = false;
                this.isCombatInProgress = false;
                this.isFight = false;
                this.snackBar.open("Votre adversaire a réussi à s'échapper du combat.", 'OK', { duration: 3000 });
            }),
        );

        this.subscriptions.add(
            this.socketService.onGameEnded().subscribe((data) => {
                this.openEndGameModal('DONEE', data.winner);
                setTimeout(() => {
                    this.router.navigate(['/home']);
                }, TIMER_COMBAT);
            }),
        );

        this.subscriptions.add(
            this.socketService.onGameEnded().subscribe((data) => {
                this.openEndGameModal('DONEE', data.winner);
                setTimeout(() => {
                    this.router.navigate(['/home']);
                }, TIMER_COMBAT);
            }),
        );
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        if (this.sessionService.isOrganizer && this.sessionService.sessionCode) {
            this.socketService.leaveSession(this.sessionService.sessionCode);
        }
    }
    handleActionPerformed(): void {
        this.action = 0;
        this.isActive = false;
        this.subscriptions.add(
            this.socketService.onTurnEnded().subscribe(() => {
                this.action = 1;
                this.isActive = false;
            }),
        );
    }

    // endTurn(): void {
    //     if (this.isPlayerTurn) {
    //         this.socketService.endTurn(this.sessionService.sessionCode);
    //     }
    // }

    // getPlayerNameBySocketId(socketId: string): string {
    //     const player = this.sessionService.players.find((p) => p.socketId === socketId);
    //     return player ? player.name : 'Joueur inconnu';
    // }

    leaveSession(): void {
        this.sessionService.leaveSession();
    }

    confirmLeaveSession(): void {
        this.sessionService.confirmLeaveSession();
    }

    cancelLeaveSession(): void {
        this.sessionService.cancelLeaveSession();
    }

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }

    toggleActive() {
        this.isActive = !this.isActive;
    }

    startCombat() {
        this.socketService.emitStartCombat(this.sessionCode, this.playerAvatar, this.opposentPlayer);
    }

    handleDataFromChild(avatar: string) {
        this.isActive = false;
        this.opposentPlayer = avatar;
        this.startCombat();
    }

    chooseAttack() {
        if (this.isCombatTurn) {
            this.socketService.emitAttack(this.sessionService.sessionCode);
            this.isAttackOptionDisabled = true;
            this.isEvasionOptionDisabled = true;
            this.diceComponent.rollDice();
        }
    }

    chooseEvasion() {
        if (this.isCombatTurn) {
            this.socketService.emitEvasion(this.sessionService.sessionCode);
            this.isAttackOptionDisabled = true;
            this.isEvasionOptionDisabled = true;
        }
    }

    updateDiceResults(attackRoll: number, defenceRoll: number) {
        this.diceComponent.showDiceRoll(attackRoll, defenceRoll);
    }

    onFightStatusChanged($event: boolean) {
        this.isFight = $event;
    }

    openEndGameModal(message: string, winner: string): void {
        this.endGameMessage = message;
        this.winnerName = winner;
    }
    private openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: TURN_NOTIF_DURATION,
            panelClass: ['custom-snackbar'],
        });
    }
}
