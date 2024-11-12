import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DiceComponent } from '@app/components/dice/dice.component';
import { SessionService } from '@app/services/session/session.service';
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
    combatOpponentInfo: {
        name: string;
        avatar: string;
    } | null = null;
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
    constructor(
        private socketService: SocketService,
        public sessionService: SessionService,
        private snackBar: MatSnackBar,
    ) {}
    ngOnInit(): void {
        this.subscriptions.add(
        this.socketService.onCombatStarted().subscribe((data) => {
            this.isPlayerInCombat = true;
            this.combatOpponentInfo = {
                name: data.opponentName,
                avatar: data.opponentAvatar,
            };
        })
    )
    this.subscriptions.add(
        this.socketService.onCombatTurnStarted().subscribe((data) => {
            this.isCombatTurn = data.playerSocketId === this.socketService.getSocketId();
            this.isAttackOptionDisabled = !this.isCombatTurn;
            this.isEvasionOptionDisabled = !this.isCombatTurn;
        })
    )
    this.subscriptions.add(
        this.socketService.onCombatNotification().subscribe((data) => {
            if (!this.isPlayerInCombat) {
                this.isCombatInProgress = data.combat;
            }
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
            this.combatCurrentPlayerSocketId = data.playerSocketId;
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
    private openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: TURN_NOTIF_DURATION,
            panelClass: ['custom-snackbar'],
        });
    }
}
