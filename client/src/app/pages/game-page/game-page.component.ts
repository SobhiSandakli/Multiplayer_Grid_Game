import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DiceComponent } from '@app/components/dice/dice.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { Player } from '@app/interfaces/player.interface';
import { GameInfo } from '@app/interfaces/socket.interface';
import { SessionService } from '@app/services/session/session.service';
import { SocketService } from '@app/services/socket/socket.service';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { TURN_NOTIF_DURATION } from 'src/constants/game-constants';
// import { EndGameService } from '@app/services/endGame/endGame.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    faChevronDown = faChevronDown;
    faChevronUp = faChevronUp;
    gameInfo: GameInfo = { name: '', size: '' };
    timer: TimerComponent;
    action: number;
    speedPoints: number;
    avatar: string;
    isActive: boolean = false;
    escapeAttempt: number = 2;
    remainingHealth: number = 0;
    timeLeft: number = 0;
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
    combatTimeLeft: any;
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

    @ViewChild(DiceComponent) diceComponent!: DiceComponent;

    private subscriptions: Subscription = new Subscription();

    constructor(
        private socketService: SocketService,
        public sessionService: SessionService,
        private snackBar: MatSnackBar, //private toastr: ToastrService,
        // private endGameService: EndGameService,
        private router: Router,
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
    get displayedCurrentPlayerSocketId(): string | null {
        if (this.isPlayerInCombat || this.isCombatInProgress) {
            return this.combatCurrentPlayerSocketId;
        } else {
            return this.currentPlayerSocketId;
        }
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

    get showEndTurnButton(): boolean {
        return this.isPlayerTurn && !this.isPlayerInCombat && !this.isCombatInProgress;
    }

    ngOnInit(): void {
        // this.reload();
        this.sessionService.leaveSessionPopupVisible = false;
        this.sessionService.initializeGame();
        this.sessionService.subscribeToPlayerListUpdate();
        this.sessionService.subscribeToOrganizerLeft();
        this.speedPoints = this.playerAttributes?.speed.currentValue ?? 0;
        this.remainingHealth = this.playerAttributes?.life?.currentValue ?? 0;
        this.socketService.onGameInfo(this.sessionService.sessionCode).subscribe((data) => {
            if (data) this.gameInfo = data;
        });
        this.handleActionPerformed();
        this.action = 1;

        this.subscriptions.add(
            this.socketService.onTurnStarted().subscribe((data) => {
                this.currentPlayerSocketId = data.playerSocketId;
                this.isPlayerTurn = this.currentPlayerSocketId === this.socketService.getSocketId();
                this.sessionService.setCurrentPlayerSocketId(this.currentPlayerSocketId);
                this.putTimer = this.isPlayerTurn;
            }),
        );

        this.subscriptions.add(
            this.socketService.onNextTurnNotification().subscribe((data) => {
                const playerName = this.getPlayerNameBySocketId(data.playerSocketId);
                this.openSnackBar(`Le tour de ${playerName} commence dans ${data.inSeconds} secondes.`);
            }),
        );

        this.subscriptions.add(
            this.socketService.onTimeLeft().subscribe((data) => {
                if (!this.isPlayerInCombat && !this.isCombatInProgress && data.playerSocketId === this.currentPlayerSocketId) {
                    this.timeLeft = data.timeLeft;
                }
            }),
        );

        this.subscriptions.add(
            this.socketService.onTurnEnded().subscribe(() => {
                this.isPlayerTurn = false;
                this.timeLeft = 0;
                this.putTimer = false;
            }),
        );

        this.subscriptions.add(
            this.socketService.onNoMovementPossible().subscribe((data) => {
                this.openSnackBar(`Aucun mouvement possible pour ${data.playerName} - Le tour de se termine dans 3 secondes.`);
            }),
        );

        // Subscribe to combat notifications (not directly involving this player)
        this.subscriptions.add(
            this.socketService.onCombatNotification().subscribe((data) => {
                if (!this.isPlayerInCombat) {
                    this.isCombatInProgress = data.combat;
                }
            }),
        );

        // Subscribe to combat start events (involving this player)
        this.subscriptions.add(
            this.socketService.onCombatStarted().subscribe((data) => {
                this.isPlayerInCombat = true;
                this.escapeAttempt = 2;
                this.combatOpponentInfo = { name: data.opponentName, avatar: data.opponentAvatar };

                // Display "Vous êtes dans un combat" modal for a few seconds
                setTimeout(() => {
                    this.combatOpponentInfo = null;
                }, 5000); // Close modal after 5 seconds
            }),
        );

        this.subscriptions.add(
            this.socketService.onAttackResult().subscribe((data) => {
                // Pass the dice results to DiceComponent
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
                    this.timeLeft = this.combatTimeLeft;
                } else {
                    this.timeLeft = 0; // Placeholder for players not involved
                }
            }),
        );

        this.subscriptions.add(
            this.socketService.onPlayerListUpdate().subscribe((data) => {
                const currentPlayer = data.players.find((p) => p.name === this.playerName);
                this.escapeAttempt = currentPlayer?.attributes ? currentPlayer.attributes['nbEvasion'].currentValue ?? 0 : 0;
                //console.log('PLAYER', data);
            }),
        );

        this.subscriptions.add(
            this.socketService.onCombatTimeLeft().subscribe((data) => {
                this.combatTimeLeft = data.timeLeft;
                this.timeLeft = this.combatTimeLeft;
            }),
        );

        this.subscriptions.add(
            this.socketService.onCombatTurnEnded().subscribe((data) => {
                // Reset or update the turn information
                //console.log('Combat turn ended for:', data.playerSocketId);
                if (this.isPlayerInCombat) {
                    this.timeLeft = this.combatTimeLeft;
                } else {
                    this.timeLeft = 0; // Placeholder for players not involved
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
                //console.log('Attack and Defense Result:', data);
            }),
        );

        this.subscriptions.add(
            this.socketService.onEvasionResult().subscribe((data) => {
                if (data.success) {
                    this.isFight = false;
                    this.action = 1;

                    this.openSnackBar('Vous avez réussi à vous échapper !');
                    this.socketService.onCombatEnded().subscribe((data) => {
                        this.openSnackBar(data.message);
                    });
                } else {
                    // this.escapeAttempt -= 1;
                    this.openSnackBar("Vous n'avez pas réussi à vous échapper.");
                }
            }),
        );

        this.subscriptions.add(
            this.socketService.onDefeated().subscribe((data) => {
                this.isCombatInProgress = false; // Close combat modal
                this.isPlayerInCombat = false;
                this.isCombatTurn = false;
                this.isFight = false;
                this.action = 1;
                this.combatCurrentPlayerSocketId = null;
                this.snackBar.open(data.message, 'OK', { duration: 3000 });
                //console.log('Defeated:', data);
            }),
        );

        this.subscriptions.add(
            this.socketService.onOpponentDefeated().subscribe((data) => {
                this.isCombatInProgress = false; // Close combat modal
                this.isFight = false;
                this.action = 1;
                this.isPlayerInCombat = false; // Reset combat status
                this.snackBar.open(data.message, 'OK', { duration: 3000 });
                //console.log('Opponent defeated:', data);
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

        // Listen for evasion notification to others
        this.subscriptions.add(
            this.socketService.onOpponentEvaded().subscribe((data) => {
                this.isPlayerInCombat = false; // Reset combat status
                this.isCombatInProgress = false; // Close combat modal
                this.isFight = false;
                this.snackBar.open(`Votre adversaire a réussi à s'échapper du combat.`, 'OK', { duration: 3000 });
            }),
        );

        this.subscriptions.add(
            this.socketService.onGameEnded().subscribe((data) => {
                this.openEndGameModal("DONEE", data.winner);
                setTimeout(() => {
                    this.router.navigate(['/home']);
                }, 5000); // Redirect to home after 5 seconds
            }),
        );
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
    private openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: TURN_NOTIF_DURATION,
            panelClass: ['custom-snackbar'],
        });
    }
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        if (this.sessionService.isOrganizer && this.sessionService.sessionCode) {
            this.socketService.leaveSession(this.sessionService.sessionCode);
        }
    }

    endTurn(): void {
        if (this.isPlayerTurn) {
            this.socketService.endTurn(this.sessionService.sessionCode);
        }
    }

    getPlayerNameBySocketId(socketId: string): string {
        const player = this.sessionService.players.find((p) => p.socketId === socketId);
        return player ? player.name : 'Joueur inconnu';
    }

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
        //console.log('avatar combat terminé', avatar);
        this.isActive = false;
        this.opposentPlayer = avatar;
        this.startCombat();
    }

    chooseAttack() {
        //console.log('chooseAttack', this.isCombatTurn);
        if (this.isCombatTurn) {
            this.socketService.emitAttack(this.sessionService.sessionCode);
            this.isAttackOptionDisabled = true;
            this.isEvasionOptionDisabled = true;
            this.diceComponent.rollDice();
        }
    }

    chooseEvasion() {
        //console.log('chooseEvasion', this.isCombatTurn);
        if (this.isCombatTurn) {
            this.socketService.emitEvasion(this.sessionService.sessionCode);
            this.isAttackOptionDisabled = true;
            this.isEvasionOptionDisabled = true;
        }
    }

    updateDiceResults(attackRoll: number, defenceRoll: number) {
        this.diceComponent.showDiceRoll(attackRoll, defenceRoll);
    }
    // private reload(): void {
    //     const reloaded = localStorage.getItem('reloaded');
    //     if (reloaded) {
    //         localStorage.removeItem('reloaded');
    //         this.router.navigate(['/home']);
    //     } else {
    //         localStorage.setItem('reloaded', 'true');
    //     }
    // }

    onFightStatusChanged($event: boolean) {
        this.isFight = $event;
    }

    openEndGameModal(message: string, winner: string): void {
        this.endGameMessage = message;
        this.winnerName = winner;
    }
}
