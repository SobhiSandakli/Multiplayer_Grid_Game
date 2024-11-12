import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SocketService } from '@app/services/socket/socket.service';
import { GameInfo } from '@app/interfaces/socket.interface';
import { SessionService } from '@app/services/session/session.service';
import { TIMER_COMBAT } from 'src/constants/game-constants';
import { CombatSocket } from '@app/services/socket/combatSocket.service';
import { TurnSocket } from '@app/services/socket/turnSocket.service';
import { MovementSocket } from '@app/services/socket/movementSocket.service';
import { GameSocket } from '@app/services/socket/gameSocket.service';
import { PlayerSocket } from '@app/services/socket/playerSocket.service';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionService {
    action: number;
    isPlayerInCombat: boolean = false;
    isCombatInProgress: boolean = false;
    isCombatTurn: boolean = false;
    isAttackOptionDisabled: boolean = true;
    isEvasionOptionDisabled: boolean = true;
    timeLeft: number = 0; // constant file
    escapeAttempt: number = 2; // constant file
    combatTimeLeft: number;
    endGameMessage: string | null = null;
    winnerName: string | null = null;
    isFight: boolean = false;
    attackSuccess: boolean;
    combatOpponentInfo: { name: string; avatar: string } | null = null;
    gameInfo$;
    currentPlayerSocketId$;
    isPlayerTurn$;
    putTimer$;
    private gameInfoSubject = new BehaviorSubject<GameInfo>({ name: '', size: '' });
    private currentPlayerSocketIdSubject = new BehaviorSubject<string>('');
    private isPlayerTurnSubject = new BehaviorSubject<boolean>(false);
    private putTimerSubject = new BehaviorSubject<boolean>(false);
    private subscriptions: Subscription = new Subscription();

    constructor(
        private sessionService: SessionService,
        private socketService: SocketService,
        private movementSocket: MovementSocket,
        private gameSocket: GameSocket,
        private playerSocket: PlayerSocket,
        public combatSocket: CombatSocket,
        public turnSocket: TurnSocket,
    ) {
        this.gameInfo$ = this.gameInfoSubject.asObservable();
        this.currentPlayerSocketId$ = this.currentPlayerSocketIdSubject.asObservable();
        this.isPlayerTurn$ = this.isPlayerTurnSubject.asObservable();
        this.putTimer$ = this.putTimerSubject.asObservable();
    }

    get displayedCurrentPlayerSocketId(): string | null {
        if (this.isPlayerInCombat || this.isCombatInProgress) {
            return this.currentPlayerSocketIdSubject.value;
        } else {
            return this.currentPlayerSocketIdSubject.value;
        }
    }
    get playerName(): string {
        return this.sessionService.playerName ?? '';
    }
    get displayedIsPlayerTurn(): boolean {
        if (this.isPlayerInCombat) {
            return this.isCombatTurn;
        } else if (this.isCombatInProgress) {
            return false;
        } else {
            return this.isPlayerTurnSubject.value;
        }
    }
    get showEndTurnButton(): boolean {
        return this.isPlayerTurnSubject.value && !this.isPlayerInCombat && !this.isCombatInProgress;
    }
    initSubscriptions(): void {
        this.subscribeGameInfo();
        this.subsribeCurrentPlayerSocketId();
        this.subscribeNextTurn();
        this.subscribeTimeLeft();
        this.subscribeTurnEnded();
        this.subscribeNoMovementPossible();
        this.subscribeToCombatStarted();
        this.subscribeCombatNotification();
        this.subscribeCombatTurn();
        this.subscribeToEscapeAttempt();
        this.subscribeCombatTimeLeft();
        this.subscribeCombatTurnEnded();
        this.subscribeOnOpponentDefeated();
        this.subscirbeOnDefetead();
        this.subscribeOnEvasionSuccess();
        this.subscribeOnOpponentEvaded();
        this.subscribeOnGameEnded();
    }
    getPlayerNameBySocketId(socketId: string): string {
        const player = this.sessionService.players.find((p) => p.socketId === socketId);
        return player ? player.name : 'Joueur inconnu';
    }
    endTurn(): void {
        if (this.isPlayerTurnSubject.value) {
            this.turnSocket.endTurn(this.sessionService.sessionCode);
        }
    }
    unsubscribeAll(): void {
        this.subscriptions.unsubscribe();
    }
    private subscribeGameInfo(): void {
        this.subscriptions.add(
            this.gameSocket.onGameInfo(this.sessionService.sessionCode).subscribe((gameInfo) => {
                if (gameInfo) this.gameInfoSubject.next(gameInfo);
            }),
        );
    }
    private subsribeCurrentPlayerSocketId(): void {
        this.subscriptions.add(
            this.turnSocket.onTurnStarted().subscribe((data) => {
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
    private subscribeNextTurn(): void {
        this.subscriptions.add(
            this.turnSocket.onNextTurnNotification().subscribe((data) => {
                const playerName = this.getPlayerNameBySocketId(data.playerSocketId);
                this.sessionService.openSnackBar(`Le tour de ${playerName} commence dans ${data.inSeconds} secondes.`);
            }),
        );
    }
    private subscribeTimeLeft(): void {
        this.subscriptions.add(
            this.turnSocket.onTimeLeft().subscribe((data) => {
                if (!this.isPlayerInCombat && !this.isCombatInProgress && data.playerSocketId === this.currentPlayerSocketIdSubject.value) {
                    this.timeLeft = data.timeLeft;
                }
            }),
        );
    }
    private subscribeTurnEnded(): void {
        this.subscriptions.add(
            this.turnSocket.onTurnEnded().subscribe(() => {
                this.isPlayerTurnSubject.next(false);
                this.timeLeft = 0;
                this.putTimerSubject.next(false);
            }),
        );
    }
    private subscribeNoMovementPossible(): void {
        this.subscriptions.add(
            this.movementSocket.onNoMovementPossible().subscribe((data) => {
                this.sessionService.openSnackBar(`Aucun mouvement possible pour ${data.playerName} - Le tour de se termine dans 3 secondes.`);
            }),
        );
    }

    private subscribeToCombatStarted(): void {
        this.subscriptions.add(
            this.combatSocket.onCombatStarted().subscribe((data) => {
                this.isPlayerInCombat = true;
                this.escapeAttempt = 2;
                this.combatOpponentInfo = { name: data.opponentPlayer.name, avatar: data.opponentPlayer.avatar };

                setTimeout(() => {
                    this.combatOpponentInfo = null;
                }, TIMER_COMBAT);
            }),
        );
    }
    private subscribeCombatNotification(): void {
        this.subscriptions.add(
            this.combatSocket.onCombatNotification().subscribe((data) => {
                if (!this.isPlayerInCombat) {
                    this.isCombatInProgress = data.combat;
                }
            }),
        );
    }
    private subscribeCombatTurn(): void {
        this.subscriptions.add(
            this.combatSocket.onCombatTurnStarted().subscribe((data) => {
                this.isCombatTurn = data.playerSocketId === this.socketService.getSocketId();
                this.isAttackOptionDisabled = !this.isCombatTurn;
                this.isEvasionOptionDisabled = !this.isCombatTurn;
                this.combatTimeLeft = data.timeLeft;
                this.currentPlayerSocketIdSubject.next(data.playerSocketId);

                if (this.isPlayerInCombat) {
                    this.timeLeft = this.combatTimeLeft;
                } else {
                    this.timeLeft = 0;
                }
            }),
        );
    }
    private subscribeToEscapeAttempt(): void {
        this.subscriptions.add(
            this.playerSocket.onPlayerListUpdate().subscribe((data) => {
                const currentPlayer = data.players.find((p) => p.name === this.playerName);
                this.escapeAttempt = currentPlayer?.attributes ? currentPlayer.attributes['nbEvasion'].currentValue ?? 0 : 0;
            }),
        );
    }
    private subscribeCombatTimeLeft(): void {
        this.subscriptions.add(
            this.combatSocket.onCombatTimeLeft().subscribe((data) => {
                this.combatTimeLeft = data.timeLeft;
                this.timeLeft = this.combatTimeLeft;
            }),
        );
    }
    private subscribeCombatTurnEnded(): void {
        this.subscriptions.add(
            this.combatSocket.onCombatTurnEnded().subscribe(() => {
                if (this.isPlayerInCombat) {
                    this.timeLeft = this.combatTimeLeft;
                } else {
                    this.timeLeft = 0;
                }
            }),
        );
    }
    private subscribeOnOpponentDefeated(): void {
        this.subscriptions.add(
            this.combatSocket.onOpponentDefeated().subscribe((data) => {
                this.isCombatInProgress = false;
                this.isFight = false;
                this.action = 1;
                this.isPlayerInCombat = false;
                this.sessionService.snackBar.open(data.message, 'OK', { duration: 3000 });
            }),
        );
    }
    private subscirbeOnDefetead(): void {
        this.subscriptions.add(
            this.combatSocket.onDefeated().subscribe((data) => {
                this.isCombatInProgress = false;
                this.isPlayerInCombat = false;
                this.isCombatTurn = false;
                this.isFight = false;
                this.action = 1;
                this.sessionService.snackBar.open(data.message, 'OK', { duration: 3000 });
            }),
        );
    }
    private subscribeOnEvasionSuccess(): void {
        this.subscriptions.add(
            this.combatSocket.onEvasionSuccess().subscribe((data) => {
                this.isCombatInProgress = false;
                this.isPlayerInCombat = false;
                this.isFight = false;
                this.action = 1;
                this.sessionService.snackBar.open(data.message, 'OK', { duration: 3000 });
            }),
        );
    }
    private subscribeOnOpponentEvaded(): void {
        this.subscriptions.add(
            this.combatSocket.onOpponentEvaded().subscribe(() => {
                this.isPlayerInCombat = false;
                this.isCombatInProgress = false;
                this.isFight = false;
                this.sessionService.snackBar.open("Votre adversaire a réussi à s'échapper du combat.", 'OK', { duration: 3000 });
            }),
        );
    }
    private subscribeOnGameEnded(): void {
        this.subscriptions.add(
            this.combatSocket.onGameEnded().subscribe((data) => {
                this.openEndGameModal('DONEE', data.winner);
                setTimeout(() => {
                    this.sessionService.router.navigate(['/home']);
                }, TIMER_COMBAT);
            }),
        );
    }
    private openEndGameModal(message: string, winner: string): void {
        this.endGameMessage = message;
        this.winnerName = winner;
    }
}
