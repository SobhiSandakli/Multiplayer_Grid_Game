import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DiceComponent } from '@app/components/dice/dice.component';
import { Player } from '@app/interfaces/player.interface';
import { SessionService } from '@app/services/session/session.service';
import { CombatSocket } from '@app/services/socket/combatSocket.service';
import { SocketService } from '@app/services/socket/socket.service';
import { Subscription } from 'rxjs';
import { TURN_NOTIF_DURATION } from 'src/constants/game-constants';

@Component({
    selector: 'app-fight',
    templateUrl: './fight.component.html',
    styleUrl: './fight.component.scss',
})
export class FightComponent implements OnInit {
    @ViewChild(DiceComponent) diceComponent!: DiceComponent;
    combatOpponentInfo: Player;
    isPlayerInCombat: boolean = true;
    isActive: boolean;
    combatCurrentPlayerSocketId: string | null = null;
    @Input() isFight: boolean;
    @Input() action:number;
    isCombatTurn: boolean = true;
    isAttackOptionDisabled: boolean = true;
    isEvasionOptionDisabled: boolean = true;
    endGameMessage: string | null = null;
    winnerName: string | null = null;
    isFightActive: boolean = true;
    opposentPlayer: string;
    private subscriptions: Subscription = new Subscription();
    attackBase: number;
    defenceBase: number;
    attackRoll: number;
    defenceRoll: number;
    attackSuccess: boolean;
    escapeAttempt: number = 2;
    isCombatInProgress: boolean;

    get sessionCode() {
        return this.sessionService.sessionCode;
    }
    get playerAvatar(): string {
        return this.sessionService.playerAvatar;
    }

    get playerAttributes() {
        return this.sessionService.playerAttributes;
    }

    get playerName(): string {
        return this.sessionService.playerName ?? '';
    }
    constructor(
        private socketService: SocketService,
        public sessionService: SessionService,
        private snackBar: MatSnackBar,
        private combatSocket: CombatSocket,
    ) {}
    ngOnInit(): void {
        this.subscriptions.add(
            this.combatSocket.onCombatStarted().subscribe((data) => {
                this.escapeAttempt = 2;
                this.isPlayerInCombat = true;
                this.isAttackOptionDisabled = !this.isCombatTurn;
                this.isEvasionOptionDisabled = !this.isCombatTurn;
                this.combatOpponentInfo = data.opponentPlayer;
                this.isCombatTurn = data.startsFirst;
            }),
        );
        this.subscriptions.add(
            this.socketService.onUpdateLifePoints().subscribe((data) => {
                if (this.sessionService.playerAttributes?.life) {
                    this.sessionService.playerAttributes.life.currentValue = data.playerLife;
                }

                if (this.combatOpponentInfo?.attributes?.life) {
                    this.combatOpponentInfo.attributes.life.currentValue = data.opponentLife;
                }
            }),
        );
        this.subscriptions.add(
            this.combatSocket.onCombatNotification().subscribe((data) => {
                if (!this.isPlayerInCombat) {
                    this.isCombatInProgress = data.combat;
                }
            }),
        );
        this.subscriptions.add(
            this.combatSocket.onAttackResult().subscribe((data) => {
                this.updateDiceResults(data.attackRoll, data.defenceRoll);
            }),
        );
        this.subscriptions.add(
            this.combatSocket.onCombatTurnStarted().subscribe((data) => {
                this.isCombatTurn = data.playerSocketId === this.socketService.getSocketId();
                this.isAttackOptionDisabled = !this.isCombatTurn;
                this.isEvasionOptionDisabled = !this.isCombatTurn;
                this.combatCurrentPlayerSocketId = data.playerSocketId;
            }),
        );
        this.subscriptions.add(
            this.combatSocket.onAttackResult().subscribe((data) => {
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
            this.combatSocket.onEvasionResult().subscribe((data) => {
                if (data.success) {
                    this.isFight = false;
                    this.action = 1;

                    this.openSnackBar('Vous avez réussi à vous échapper !');
                    this.combatSocket.onCombatEnded().subscribe((dataEnd) => {
                        this.openSnackBar(dataEnd.message);
                    });
                } else {
                    this.openSnackBar("Vous n'avez pas réussi à vous échapper.");
                }
            }),
        );

        this.subscriptions.add(
            this.combatSocket.onDefeated().subscribe((data) => {
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
            this.combatSocket.onOpponentDefeated().subscribe((data) => {
                this.isCombatInProgress = false;
                this.isFight = false;
                this.action = 1;
                this.isPlayerInCombat = false;
                this.snackBar.open(data.message, 'OK', { duration: 3000 });
            }),
        );

        this.subscriptions.add(
            this.combatSocket.onEvasionSuccess().subscribe((data) => {
                this.isCombatInProgress = false;
                this.isPlayerInCombat = false;
                this.isFight = false;
                this.action = 1;
                this.snackBar.open(data.message, 'OK', { duration: 3000 });
            }),
        );

        this.subscriptions.add(
            this.combatSocket.onOpponentEvaded().subscribe(() => {
                this.isPlayerInCombat = false;
                this.isCombatInProgress = false;
                this.isFight = false;
                this.snackBar.open("Votre adversaire a réussi à s'échapper du combat.", 'OK', { duration: 3000 });
            }),
        );

        this.subscriptions.add(
            this.socketService.onPlayerListUpdate().subscribe((data) => {
                const currentPlayer = data.players.find((p) => p.name === this.playerName);
                this.escapeAttempt = currentPlayer?.attributes ? currentPlayer.attributes['nbEvasion'].currentValue ?? 0 : 0;
            }),
        );
    }

    startCombat() {
        this.combatSocket.emitStartCombat(this.sessionCode, this.playerAvatar, this.opposentPlayer);
    }

    handleDataFromChild(avatar: string) {
        this.isActive = false;
        this.opposentPlayer = avatar;
        this.startCombat();
    }

    chooseAttack() {
        if (this.isCombatTurn) {
            this.combatSocket.emitAttack(this.sessionService.sessionCode);
            this.isAttackOptionDisabled = true;
            this.isEvasionOptionDisabled = true;
            this.diceComponent.rollDice();
        }
    }

    chooseEvasion() {
        if (this.isCombatTurn) {
            this.combatSocket.emitEvasion(this.sessionService.sessionCode);
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
    private openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: TURN_NOTIF_DURATION,
            panelClass: ['custom-snackbar'],
        });
    }
    getHeartsArray(lifePoints: number | undefined): number[] {
        if (!lifePoints || lifePoints <= 0) return [];
        return Array(lifePoints).fill(0);
    }
}
