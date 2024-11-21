import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { BehaviorSubject, Observable, Subject, filter, fromEvent } from 'rxjs';
import { GameInfo, JoinGameResponse } from '@app/interfaces/socket.interface';

@Injectable({
    providedIn: 'root',
})
export class GameSocket {
    private gameInfoSubject = new Subject<GameInfo>();
    private gridArrayChangeSubject = new BehaviorSubject<{ sessionCode: string; grid: { images: string[]; isOccuped: boolean }[][] } | null>(null);
    startTime : Date;

    constructor(private socketService: SocketService) {
        this.socketService.socket.on('getGameInfo', (data: GameInfo) => {
            this.gameInfoSubject.next(data);
        });
        this.socketService.socket.on('gridArray', (data: { sessionCode: string; grid: { images: string[]; isOccuped: boolean }[][] }) => {
            this.gridArrayChangeSubject.next(data);
        });
        this.socketService.socket.on('gridUpdated', (data: { sessionCode: string; grid: { images: string[]; isOccuped: boolean }[][] }) => {
            this.gridArrayChangeSubject.next(data);
        });
    }
    emitStartGame(sessionCode: string): void {
        this.socketService.socket.emit('startGame', { sessionCode });
    }
    onGameStarted(): Observable<{ sessionCode: string }> {
        return new Observable<{ sessionCode: string }>((subscriber) => {
            const eventHandler = (data: { sessionCode: string }) => {
                subscriber.next(data);
            };
            this.startTime = new Date();
            this.socketService.socket.on('gameStarted', eventHandler);
        });
    }
    onGameInfo(sessionCode: string): Observable<GameInfo> {
        this.socketService.socket.emit('getGameInfo', { sessionCode });
        return fromEvent<GameInfo>(this.socketService.socket, 'getGameInfo');
    }
    joinGame(secretCode: string): Observable<JoinGameResponse> {
        this.socketService.socket.emit('joinGame', { secretCode });
        return fromEvent(this.socketService.socket, 'joinGameResponse');
    }
    getGridArrayChange$(sessionCode: string): Observable<{ sessionCode: string; grid: { images: string[]; isOccuped: boolean }[][] } | null> {
        return this.gridArrayChangeSubject.asObservable().pipe(filter((data) => data !== null && data.sessionCode === sessionCode));
    }
    onOrganizerLeft(): Observable<void> {
        return fromEvent(this.socketService.socket, 'organizerLeft');
    }

    emitTileInfoRequest(sessionCode: string, row: number, col: number): void {
        this.socketService.socket.emit('tileInfoRequest', { sessionCode, row, col });
    }

    onTileInfo(): Observable<{ cost: number; effect: string }> {
        return fromEvent(this.socketService.socket, 'tileInfo');
    }
}
