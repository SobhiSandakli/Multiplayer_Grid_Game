import { Injectable } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { SocketService } from './socket.service';

@Injectable({
    providedIn: 'root',
})
export class TurnSocket {
    constructor(private socketService: SocketService) {}
    onTurnStarted(): Observable<{ playerSocketId: string }> {
        return fromEvent(this.socketService.socket, 'turnStarted');
    }

    onTurnEnded(): Observable<{ playerSocketId: string }> {
        return fromEvent(this.socketService.socket, 'turnEnded');
    }

    onTimeLeft(): Observable<{ timeLeft: number; playerSocketId: string }> {
        return fromEvent(this.socketService.socket, 'timeLeft');
    }

    onNextTurnNotification(): Observable<{ playerSocketId: string; inSeconds: number }> {
        return fromEvent(this.socketService.socket, 'nextTurnNotification');
    }

    endTurn(sessionCode: string): void {
        this.socketService.socket.emit('endTurn', { sessionCode });
    }
}
