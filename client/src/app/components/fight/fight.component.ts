import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DiceComponent } from '@app/components/dice/dice.component';
import { SessionService } from '@app/services/session/session.service';
import { SocketService } from '@app/services/socket/socket.service';

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
        attack: number;
        defense: number;
        life: number;
    } | null = null;
    isPlayerInCombat: boolean = true;
    isActive: boolean;
    @Input() isFight: boolean;
    isCombatTurn: boolean = true;
    isAttackOptionDisabled: boolean;
    isEvasionOptionDisabled: boolean;
    endGameMessage: string | null = null;
    winnerName: string | null = null;
    isFightActive: boolean = true;
    opposentPlayer: string;

    attackBase: number;
    defenceBase: number;
    attackRoll: number;
    defenceRoll: number;
    attackSuccess: boolean;
    escapeAttempt: number = 2;

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
    ) {}
    ngOnInit(): void {
        this.socketService.onCombatStarted().subscribe((data) => {
            console.log('SALUT', data.opponentAttributes);
            this.isPlayerInCombat = true;
            this.combatOpponentInfo = {
                name: data.opponentName,
                avatar: data.opponentAvatar,
                attack: Number(data.opponentAttributes.attack),
                defense: 0,
                life: 0,
            };
        });

        this.socketService.onCombatTurnStarted().subscribe((data) => {
            this.isCombatTurn = data.playerSocketId === this.socketService.getSocketId();
            this.isAttackOptionDisabled = !this.isCombatTurn;
            this.isEvasionOptionDisabled = !this.isCombatTurn;
        });
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
}
