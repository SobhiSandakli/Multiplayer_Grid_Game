import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { SessionSocket } from '@app/services/socket/sessionSocket.service';
import { TurnSocket } from '@app/services/socket/turnSocket.service';
import { MovementSocket } from '@app/services/socket/movementSocket.service';
import { CombatSocket } from '@app/services/socket/combatSocket.service';

@Injectable({ providedIn: 'root' })
export class GamePageFacade {
    constructor(
        private sessionSocket: SessionSocket,
        private turnSocket: TurnSocket,
        private movementSocket: MovementSocket,
        private combatSocket: CombatSocket,
    ) {}
    leaveSession(sessionCode: string): void {
        this.sessionSocket.leaveSession(sessionCode);
    }
    onTurnEnded(): Observable<{ playerSocketId: string }> {
        return this.turnSocket.onTurnEnded();
    }
    onInventoryFull(): Observable<{ items: string[] }> {
        return this.movementSocket.onInventoryFull();
    }
    onUpdateInventory(): Observable<{ inventory: string[] }> {
        return this.movementSocket.onUpdateInventory();
    }
    discardItem(sessionCode: string, discardedItem: string, pickedUpItem: string): void {
        return this.movementSocket.discardItem(sessionCode, discardedItem, pickedUpItem);
    }
    emitStartCombat(sessionCode: string, avatar1: string, avatar2: string): void {
        return this.combatSocket.emitStartCombat(sessionCode, avatar1, avatar2);
    }
}
