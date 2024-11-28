import { Component, Input, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DiceComponent } from '@app/components/dice/dice.component';
import { Player } from '@app/interfaces/player.interface';
import { SessionService } from '@app/services/session/session.service';
import { CombatSocket } from '@app/services/combat-socket/combatSocket.service';
import { PlayerSocket } from '@app/services/player-socket/playerSocket.service';
import { SocketService } from '@app/services/socket/socket.service';
import { Subscription } from 'rxjs';
import { TURN_NOTIF_DURATION } from 'src/constants/game-constants';

@Component({
    selector: 'app-fight',
    templateUrl: './fight.component.html',
    styleUrl: './fight.component.scss',
})
export class FightComponent implements OnInit, OnDestroy {
    @ViewChild(DiceComponent) diceComponent!: DiceComponent;
    @Input() isFight: boolean;
    @Input() action: number;

    combatOpponentInfo: Player;
    isCombatTurn: boolean = true;
    isAttackOptionDisabled: boolean = true;
    isEvasionOptionDisabled: boolean = true;
    attackBase: number;
    defenceBase: number;
    attackRoll: number;
    defenceRoll: number;
    attackSuccess: boolean;
    escapeAttempt: number;
    private subscriptions: Subscription = new Subscription();
    constructor(
        public sessionService: SessionService,
        private socketService: SocketService,
        private snackBar: MatSnackBar,
        public combatSocket: CombatSocket,
        private playerSocket: PlayerSocket,
    ) {}

    get playerAvatar(): string {
        return this.sessionService.playerAvatar;
    }

    get playerName(): string {
        return this.sessionService.playerName ?? '';
    }

    ngOnInit(): void {
        this.subscriptions.add(
            this.combatSocket.onCombatStarted().subscribe((data) => {
                this.isAttackOptionDisabled = !this.isCombatTurn;
                this.isEvasionOptionDisabled = !this.isCombatTurn;
                this.combatOpponentInfo = data.opponentPlayer;
                this.isCombatTurn = data.startsFirst;
            }),
        );
        this.subscriptions.add(
            this.playerSocket.onUpdateLifePoints().subscribe((data) => {
                if (this.sessionService.playerAttributes?.life) {
                    this.sessionService.playerAttributes.life.currentValue = data.playerLife;
                }

                if (this.combatOpponentInfo?.attributes?.life) {
                    this.combatOpponentInfo.attributes.life.currentValue = data.opponentLife;
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
                this.isCombatTurn = false;
                this.isFight = false;
                this.action = 1;
                this.snackBar.open(data.message, 'OK', { duration: 3000 });
            }),
        );

        this.subscriptions.add(
            this.combatSocket.onOpponentDefeated().subscribe((data) => {
                this.isFight = false;
                this.action = 1;
                this.snackBar.open(data.message, 'OK', { duration: 3000 });
            }),
        );

        this.subscriptions.add(
            this.combatSocket.onEvasionSuccess().subscribe((data) => {
                this.isFight = false;
                this.action = 1;
                this.snackBar.open(data.message, 'OK', { duration: 3000 });
            }),
        );

        this.subscriptions.add(
            this.combatSocket.onOpponentEvaded().subscribe(() => {
                this.isFight = false;
                this.snackBar.open("Votre adversaire a réussi à s'échapper du combat.", 'OK', { duration: 3000 });
            }),
        );

        this.subscriptions.add(
            this.playerSocket.onPlayerListUpdate().subscribe((data) => {
                const currentPlayer = data.players.find((p) => p.name === this.playerName);
                this.escapeAttempt = currentPlayer?.attributes ? currentPlayer.attributes['nbEvasion'].currentValue ?? 0 : 0;
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
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
    getHeartsArray(lifePoints: number | undefined): number[] {
        if (!lifePoints || lifePoints <= 0) return [];
        return Array(lifePoints).fill(0);
    }
    openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: TURN_NOTIF_DURATION,
            panelClass: ['custom-snackbar'],
        });
    }
}
