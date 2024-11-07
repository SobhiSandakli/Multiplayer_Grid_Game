import { Component, ViewChild } from '@angular/core';
import { DiceComponent } from '@app/components/dice/dice.component';
import { SessionService } from '@app/services/session/session.service';
import { SocketService } from '@app/services/socket/socket.service';

@Component({
  selector: 'app-fight',
  templateUrl: './fight.component.html',
  styleUrl: './fight.component.scss'
})
export class FightComponent {
  @ViewChild(DiceComponent) diceComponent!: DiceComponent;
  combatOpponentInfo: {
    name: string;
    avatar: string;
  } | null = null;
  isPlayerInCombat: boolean;
  opposentPlayer: string;
  isActive: boolean;
  isFight: boolean;
  isCombatTurn: any;
  isAttackOptionDisabled: boolean;
  isEvasionOptionDisabled: boolean;
  endGameMessage: string | null = null;
  winnerName: string | null = null;

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
    this.isPlayerInCombat = true;
    this.combatOpponentInfo = {
      name: data.opponentName,
      avatar: data.opponentAvatar
    };
  });
}

getPlayerNameBySocketId(socketId: string): string {
  const player = this.sessionService.players.find((p) => p.socketId === socketId);
  return player ? player.name : 'Joueur inconnu';
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
}

