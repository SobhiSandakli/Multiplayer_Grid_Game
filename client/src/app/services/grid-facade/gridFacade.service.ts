import { Injectable } from '@angular/core';
import { Player } from '@app/interfaces/player.interface';
import { CombatSocket } from '@app/services/combat-socket/combatSocket.service';
import { GameSocket } from '@app/services/game-socket/gameSocket.service';
import { MovementSocket } from '@app/services/movement-socket/movementSocket.service';
import { PlayerSocket } from '@app/services/player-socket/playerSocket.service';
import { Observable } from 'rxjs';
import { TileDetails } from '@app/interfaces/tile.interface';

@Injectable({ providedIn: 'root' })
export class GridFacadeService {
    constructor(
        private movementSocket: MovementSocket,
        private combatSocket: CombatSocket,
        private gameSocket: GameSocket,
        private playerSocket: PlayerSocket,
    ) {}
    getGridArrayChange$(sessionCode: string): Observable<{ sessionCode: string; grid: { images: string[]; isOccuped: boolean }[][] } | null> {
        return this.gameSocket.getGridArrayChange$(sessionCode);
    }
    onDoorStateUpdated(): Observable<{ row: number; col: number; newState: string }> {
        return this.movementSocket.onDoorStateUpdated();
    }
    getAccessibleTiles(sessionCode: string): Observable<{
        accessibleTiles: {
            position: { row: number; col: number };
            path: { row: number; col: number }[];
        }[];
    }> {
        return this.movementSocket.getAccessibleTiles(sessionCode);
    }
    onPlayerMovement(): Observable<{
        avatar: string;
        desiredPath: { row: number; col: number }[];
        realPath: { row: number; col: number }[];
        slipOccurred: boolean;
    }> {
        return this.movementSocket.onPlayerMovement();
    }
    onCombatStarted(): Observable<{ startsFirst: boolean; opponentPlayer: Player }> {
        return this.combatSocket.onCombatStarted();
    }
    emitStartCombat(sessionCode: string, avatar1: string, avatar2: string): void {
        return this.combatSocket.emitStartCombat(sessionCode, avatar1, avatar2);
    }
    movePlayer(sessionCode: string, source: { row: number; col: number }, destination: { row: number; col: number }, movingImage: string): void {
        this.movementSocket.movePlayer(sessionCode, source, destination, movingImage);
    }
    emitAvatarInfoRequest(sessionCode: string, avatar: string): void {
        return this.playerSocket.emitAvatarInfoRequest(sessionCode, avatar);
    }
    onAvatarInfo(): Observable<{ name: string; avatar: string }> {
        return this.playerSocket.onAvatarInfo();
    }
    emitTileInfoRequest(sessionCode: string, row: number, col: number): void {
        return this.gameSocket.emitTileInfoRequest(sessionCode, row, col);
    }
    onTileInfo(): Observable<TileDetails> {
        return this.gameSocket.onTileInfo();
    }
    toggleDoorState(sessionCode: string, row: number, col: number, newState: string): void {
        return this.movementSocket.toggleDoorState(sessionCode, row, col, newState);
    }
    emitDebugModeMovement(sessionCode: string, destination: { row: number; col: number }): void {
        return this.movementSocket.emitDebugModeMovement(sessionCode, destination);
    }
    onDebugMoveFailed(): Observable<{ reason: string }> {
        return this.movementSocket.onDebugMoveFailed();
    }
}
