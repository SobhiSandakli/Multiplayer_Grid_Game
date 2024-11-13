import { Injectable } from '@angular/core';
import { SessionSocket } from '@app/services/socket/sessionSocket.service';
import { PlayerSocket } from '@app/services/socket/playerSocket.service';
import { GameSocket } from '@app/services/socket/gameSocket.service';
import { SocketService } from '@app/services/socket/socket.service';
import { Observable } from 'rxjs';
import { PlayerListUpdate } from '@app/interfaces/socket.interface';
@Injectable({
    providedIn: 'root',
})
export class SessionFacadeService {
    constructor(
        private sessionSocket: SessionSocket,
        private playerSocket: PlayerSocket,
        private gameSocket: GameSocket,
        private socketService: SocketService,
    ) {}
    leaveSession(sessionCode: string): void {
        this.sessionSocket.leaveSession(sessionCode);
    }
    deleteSession(sessionCode: string): void {
        this.sessionSocket.deleteSession(sessionCode);
    }
    onOrganizerLeft(): Observable<void> {
        return this.gameSocket.onOrganizerLeft();
    }
    onPlayerListUpdate(): Observable<PlayerListUpdate> {
        return this.playerSocket.onPlayerListUpdate();
    }
    getSocketId(): string {
        return this.socketService.getSocketId();
    }
}
