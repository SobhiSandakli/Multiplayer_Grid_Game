import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GameInfo } from '@app/interfaces/socket.interface';
import { TurnSocket } from '@app/services/socket/turnSocket.service';
import { GameSocket } from '@app/services/socket/gameSocket.service';
import { SocketService } from '@app/services/socket/socket.service';
import { MovementSocket } from '@app/services/socket/movementSocket.service';
import { CombatSocket } from '@app/services/socket/combatSocket.service';
import { Player } from '@app/interfaces/player.interface';
@Injectable({
    providedIn: 'root',
})
export class SubscriptionFacadeService {
    constructor(
        private turnSocket: TurnSocket,
        private gameSocket: GameSocket,
        private socketService: SocketService,
        private movementSocket: MovementSocket,
        private combatSocket: CombatSocket,
    ) {}
    onTurnStarted(): Observable<{ playerSocketId: string }> {
        return this.turnSocket.onTurnStarted();
    }
    endTurn(sessionCode: string): void {
        this.turnSocket.endTurn(sessionCode);
    }
    onTurnEnded(): Observable<{ playerSocketId: string }> {
        return this.turnSocket.onTurnEnded();
    }
    onTimeLeft(): Observable<{ timeLeft: number; playerSocketId: string }> {
        return this.turnSocket.onTimeLeft();
    }
    getSocketId(): string {
        return this.socketService.getSocketId();
    }
    onGameInfo(sessionCode: string): Observable<GameInfo> {
        return this.gameSocket.onGameInfo(sessionCode);
    }
    onNextTurnNotification(): Observable<{ playerSocketId: string; inSeconds: number }> {
        return this.turnSocket.onNextTurnNotification();
    }
    onNoMovementPossible(): Observable<{ playerName: string }> {
        return this.movementSocket.onNoMovementPossible();
    }
    onCombatStarted(): Observable<{ startsFirst: boolean; opponentPlayer: Player }> {
        return this.combatSocket.onCombatStarted();
    }
    onCombatNotification(): Observable<{
        player1: { avatar: string; name: string };
        player2: { avatar: string; name: string };
        combat: boolean;
        result: string;
    }> {
        return this.combatSocket.onCombatNotification();
    }
    onCombatTurnStarted(): Observable<{ playerSocketId: string; timeLeft: number }> {
        return this.combatSocket.onCombatTurnStarted();
    }
    onCombatTimeLeft(): Observable<{ timeLeft: number; playerSocketId: string }> {
        return this.combatSocket.onCombatTimeLeft();
    }
    onCombatTurnEnded(): Observable<{ playerSocketId: string }> {
        return this.combatSocket.onCombatTurnEnded();
    }
    onOpponentDefeated(): Observable<{ message: string; winner: string }> {
        return this.combatSocket.onOpponentDefeated();
    }
    onDefeated(): Observable<{ message: string; winner: string }> {
        return this.combatSocket.onDefeated();
    }
    onEvasionSuccess(): Observable<{ message: string }> {
        return this.combatSocket.onEvasionSuccess();
    }
    onOpponentEvaded(): Observable<{ playerName: string }> {
        return this.combatSocket.onOpponentEvaded();
    }
    onGameEnded(): Observable<{ winner: string }> {
        return this.combatSocket.onGameEnded();
    }
}
