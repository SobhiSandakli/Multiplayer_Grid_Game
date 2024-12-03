import { Injectable } from '@angular/core';
import { SessionSocket } from '@app/services/session-socket/sessionSocket.service';
import { PlayerSocket } from '@app/services/player-socket/playerSocket.service';
import { GameSocket } from '@app/services/game-socket/gameSocket.service';
import { SocketService } from '@app/services/socket/socket.service';
import { Observable } from 'rxjs';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { Message, PlayerListUpdate, RoomLockedResponse } from '@app/interfaces/socket.interface';
@Injectable({
    providedIn: 'root',
})
export class WaitingFacadeService {
    constructor(
        private notificationService: NotificationService,
        private sessionSocket: SessionSocket,
        private playerSocket: PlayerSocket,
        private gameSocket: GameSocket,
        private socketService: SocketService,
    ) {}
    getSocketId(): string {
        return this.socketService.getSocketId();
    }
    emitStartGame(sessionCode: string): void {
        this.gameSocket.emitStartGame(sessionCode);
    }
    excludePlayer(sessionCode: string, playerSocketId: string): void {
        this.sessionSocket.excludePlayer(sessionCode, playerSocketId);
    }
    onExcluded(): Observable<Message> {
        return this.sessionSocket.onExcluded();
    }
    toggleRoomLock(sessionCode: string, lock: boolean): void {
        this.sessionSocket.toggleRoomLock(sessionCode, lock);
    }
    onRoomLocked(): Observable<RoomLockedResponse> {
        return this.sessionSocket.onRoomLocked();
    }
    message(message: string): void {
        this.notificationService.showMessage(message);
    }
    onSessionDeleted(): Observable<Message> {
        return this.sessionSocket.onSessionDeleted();
    }
    onPlayerListUpdate(): Observable<PlayerListUpdate> {
        return this.playerSocket.onPlayerListUpdate();
    }
    onGameStarted(): Observable<{ sessionCode: string }> {
        return this.gameSocket.onGameStarted();
    }
    addVirtualPlayer(sessionCode: string, playerType: string): void {
        this.sessionSocket.createVirtualPlayer(sessionCode, playerType);
    }
}
