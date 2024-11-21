import { Injectable } from '@angular/core';
import { Player } from '@app/interfaces/player.interface';
import { fromEvent, Observable } from 'rxjs';
import { SocketService } from './socket.service';
import { SessionStatistics } from '@app/interfaces/session.interface';

@Injectable({
    providedIn: 'root',
})
export class CombatSocket {
    constructor(private socketService: SocketService) {}
    emitStartCombat(sessionCode: string, avatar1: string, avatar2: string): void {
        const data = { sessionCode, avatar1, avatar2 };
        this.socketService.socket.emit('startCombat', data);
    }

    emitAttack(sessionCode: string): void {
        const data = { sessionCode };
        this.socketService.socket.emit('attack', data);
    }

    emitEvasion(sessionCode: string): void {
        const data = { sessionCode };
        this.socketService.socket.emit('evasion', data);
    }

    onCombatStarted(): Observable<{
        startsFirst: boolean;
        opponentPlayer: Player;
    }> {
        this.socketService.socket.off('combatStarted');

        return fromEvent(this.socketService.socket, 'combatStarted');
    }

    onCombatTurnStarted(): Observable<{ playerSocketId: string; timeLeft: number }> {
        return fromEvent(this.socketService.socket, 'combatTurnStarted');
    }

    onCombatTimeLeft(): Observable<{ timeLeft: number; playerSocketId: string }> {
        return fromEvent(this.socketService.socket, 'combatTimeLeft');
    }

    onCombatTurnEnded(): Observable<{ playerSocketId: string }> {
        return fromEvent(this.socketService.socket, 'combatTurnEnded');
    }

    onCombatEnded(): Observable<{ message: string }> {
        return fromEvent(this.socketService.socket, 'combatEnded');
    }

    onAttackResult(): Observable<{ attackBase: number; attackRoll: number; defenceBase: number; defenceRoll: number; success: boolean }> {
        return fromEvent(this.socketService.socket, 'attackResult');
    }

    onDefeated(): Observable<{ message: string; winner: string }> {
        return fromEvent(this.socketService.socket, 'defeated');
    }

    onOpponentDefeated(): Observable<{ message: string; winner: string }> {
        return fromEvent(this.socketService.socket, 'opponentDefeated');
    }

    onEvasionSuccess(): Observable<{ message: string }> {
        return fromEvent(this.socketService.socket, 'evasionSuccessful');
    }

    onOpponentEvaded(): Observable<{ playerName: string }> {
        return fromEvent(this.socketService.socket, 'opponentEvaded');
    }

    onEvasionResult(): Observable<{ success: boolean }> {
        return fromEvent(this.socketService.socket, 'evasionResult');
    }

    onCombatNotification(): Observable<{
        player1: { avatar: string; name: string };
        player2: { avatar: string; name: string };
        combat: boolean;
        result: string;
    }> {
        return fromEvent(this.socketService.socket, 'combatNotification');
    }

    onGameEnded(): Observable<{ winner: string; players: Player[]; sessionStatistics: SessionStatistics }> {
        return fromEvent(this.socketService.socket, 'gameEnded');
    }
}
