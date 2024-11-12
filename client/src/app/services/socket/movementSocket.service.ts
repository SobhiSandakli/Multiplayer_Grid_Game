import { Injectable } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { SocketService } from './socket.service';

@Injectable({
    providedIn: 'root',
})
export class MovementSocket {
    constructor(private socketService: SocketService) {}
    toggleDoorState(sessionCode: string, row: number, col: number, newState: string): void {
        this.socketService.socket.emit('toggleDoorState', { sessionCode, row, col, newState });
    }
    onDoorStateUpdated(): Observable<{ row: number; col: number; newState: string }> {
        return fromEvent(this.socketService.socket, 'doorStateUpdated');
    }
    onNoMovementPossible(): Observable<{ playerName: string }> {
        return fromEvent<{ playerName: string }>(this.socketService.socket, 'noMovementPossible');
    }

    onPlayerMovement(): Observable<{ avatar: string; desiredPath: { row: number; col: number }[]; realPath: { row: number; col: number }[] }> {
        return fromEvent<{ avatar: string; desiredPath: { row: number; col: number }[]; realPath: { row: number; col: number }[] }>(
            this.socketService.socket,
            'playerMovement',
        );
    }
    movePlayer(sessionCode: string, source: { row: number; col: number }, destination: { row: number; col: number }, movingImage: string): void {
        this.socketService.socket.emit('movePlayer', {
            sessionCode,
            movingImage,
            source,
            destination,
        });
    }
    getAccessibleTiles(sessionCode: string): Observable<{
        accessibleTiles: {
            position: { row: number; col: number };
            path: { row: number; col: number }[];
        }[];
    }> {
        this.socketService.socket.emit('getAccessibleTiles', { sessionCode });
        return fromEvent<{
            accessibleTiles: {
                position: { row: number; col: number };
                path: { row: number; col: number }[];
            }[];
        }>(this.socketService.socket, 'accessibleTiles');
    }
}
