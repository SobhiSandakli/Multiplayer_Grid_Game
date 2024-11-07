import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SocketService } from '@app/services/socket/socket.service';
import { GameInfo } from '@app/interfaces/socket.interface';
import { SessionService } from '../session/session.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TURN_NOTIF_DURATION } from 'src/constants/game-constants';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionService {
    constructor(
        private socketService: SocketService,
        private sessionService: SessionService,
        private snackBar: MatSnackBar,
    ) {}
    isPlayerInCombat: boolean = false;
    isCombatInProgress: boolean = false;
    timeLeft: number = 0;
    private subscriptions: Subscription = new Subscription();
    private gameInfoSubject = new BehaviorSubject<GameInfo>({ name: '', size: '' });
    public gameInfo$ = this.gameInfoSubject.asObservable();

    private currentPlayerSocketIdSubject = new BehaviorSubject<string>('');
    public currentPlayerSocketId$ = this.currentPlayerSocketIdSubject.asObservable();

    private isPlayerTurnSubject = new BehaviorSubject<boolean>(false);
    public isPlayerTurn$ = this.isPlayerTurnSubject.asObservable();

    private putTimerSubject = new BehaviorSubject<boolean>(false);
    public putTimer$ = this.putTimerSubject.asObservable();

    subscribeGameInfo(): void {
        this.subscriptions.add(
            this.socketService.onGameInfo(this.sessionService.sessionCode).subscribe((gameInfo) => {
                if (gameInfo) this.gameInfoSubject.next(gameInfo);
            }),
        );
    }
    subsribeCurrentPlayerSocketId(): void {
        this.subscriptions.add(
            this.socketService.onTurnStarted().subscribe((data) => {
                if (data) {
                    const currentPlayerSocketId = data.playerSocketId;
                    this.currentPlayerSocketIdSubject.next(currentPlayerSocketId);

                    const isPlayerTurn = currentPlayerSocketId === this.socketService.getSocketId();
                    this.isPlayerTurnSubject.next(isPlayerTurn);

                    this.sessionService.setCurrentPlayerSocketId(currentPlayerSocketId);
                    this.putTimerSubject.next(isPlayerTurn);
                }
            }),
        );
    }
    subscribeNextTurn(): void {
        this.subscriptions.add(
            this.socketService.onNextTurnNotification().subscribe((data) => {
                const playerName = this.getPlayerNameBySocketId(data.playerSocketId);
                this.openSnackBar(`Le tour de ${playerName} commence dans ${data.inSeconds} secondes.`);
            }),
        );
    }
    subscribeTimeLeft(): void {
        this.subscriptions.add(
            this.socketService.onTimeLeft().subscribe((data) => {
                if (!this.isPlayerInCombat && !this.isCombatInProgress && data.playerSocketId === this.currentPlayerSocketIdSubject.value) {
                    this.timeLeft = data.timeLeft;
                }
            }),
        );
    }
     getPlayerNameBySocketId(socketId: string): string {
        const player = this.sessionService.players.find((p) => p.socketId === socketId);
        return player ? player.name : 'Joueur inconnu';
    }
    private openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: TURN_NOTIF_DURATION,
            panelClass: ['custom-snackbar'],
        });
    }
}
