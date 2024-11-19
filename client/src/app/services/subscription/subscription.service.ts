import { Injectable } from '@angular/core';
import { GameInfo } from '@app/interfaces/socket.interface';
import { SubscriptionFacadeService } from '@app/services/facade/subscriptionFacade.service';
import { SessionService } from '@app/services/session/session.service';
import { PlayerSocket } from '@app/services/socket/playerSocket.service';
import { SocketService } from '@app/services/socket/socket.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TIMER_COMBAT } from 'src/constants/game-constants';

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
        private subscriptionFacadeService: SubscriptionFacadeService,
        public playerSocket: PlayerSocket,
    ) {
        this.gameInfo$ = this.gameInfoSubject.asObservable();
        this.currentPlayerSocketId$ = this.currentPlayerSocketIdSubject.asObservable();
        this.isPlayerTurn$ = this.isPlayerTurnSubject.asObservable();
        this.putTimer$ = this.putTimerSubject.asObservable();
    }
    get onGameInfo() {
        return this.subscriptionFacadeService.onGameInfo(this.sessionService.sessionCode);
    }
    get getSocketId() {
        return this.sessionService.getSocketId;
    }
    get onNextTurnNotification() {
        return this.subscriptionFacadeService.onNextTurnNotification();
    }
    get onTimeLeft() {
        return this.subscriptionFacadeService.onTimeLeft();
    }
    get onTurnStarted() {
        return this.subscriptionFacadeService.onTurnStarted();
    }
    get onTurnEnded() {
        return this.subscriptionFacadeService.onTurnEnded();
    }
    get onNoMovementPossible() {
        return this.subscriptionFacadeService.onNoMovementPossible();
    }
    get onCombatStarted() {
        return this.subscriptionFacadeService.onCombatStarted();
    }
    get onCombatNotification() {
        return this.subscriptionFacadeService.onCombatNotification();
    }
    get onCombatTurnStarted() {
        return this.subscriptionFacadeService.onCombatTurnStarted();
    }
    get onCombatTimeLeft() {
        return this.subscriptionFacadeService.onCombatTimeLeft();
    }
    get onCombatTurnEnded() {
        return this.subscriptionFacadeService.onCombatTurnEnded();
    }
    get onOpponentDefeated() {
        return this.subscriptionFacadeService.onOpponentDefeated();
    }
    get onDefeated() {
        return this.subscriptionFacadeService.onDefeated();
    }
    get onEvasionSuccess() {
        return this.subscriptionFacadeService.onEvasionSuccess();
    }
    get onOpponentEvaded() {
        return this.subscriptionFacadeService.onOpponentEvaded();
    }
    get onGameEnded() {
        return this.subscriptionFacadeService.onGameEnded();
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
            this.subscriptionFacadeService.endTurn(this.sessionService.sessionCode);
        }
    }
    unsubscribeAll(): void {
        this.subscriptions.unsubscribe();
    }
    private subscribeGameInfo(): void {
        this.subscriptions.add(
            this.onGameInfo.subscribe((gameInfo) => {
                if (gameInfo) this.gameInfoSubject.next(gameInfo);
            }),
        );
    }
    private subsribeCurrentPlayerSocketId(): void {
        this.subscriptions.add(
            this.onTurnStarted.subscribe((data) => {
                if (data) {
                    const currentPlayerSocketId = data.playerSocketId;
                    this.currentPlayerSocketIdSubject.next(currentPlayerSocketId);

                    const isPlayerTurn = currentPlayerSocketId === this.getSocketId;
                    this.isPlayerTurnSubject.next(isPlayerTurn);

                    this.sessionService.setCurrentPlayerSocketId(currentPlayerSocketId);
                    this.putTimerSubject.next(isPlayerTurn);
                }
            }),
        );
    }
    private subscribeNextTurn(): void {
        this.subscriptions.add(
            this.onNextTurnNotification.subscribe((data) => {
                const playerName = this.getPlayerNameBySocketId(data.playerSocketId);
                this.sessionService.openSnackBar(`Le tour de ${playerName} commence dans ${data.inSeconds} secondes.`);
            }),
        );
    }
    private subscribeTimeLeft(): void {
        this.subscriptions.add(
            this.onTimeLeft.subscribe((data) => {
                if (!this.isPlayerInCombat && !this.isCombatInProgress && data.playerSocketId === this.currentPlayerSocketIdSubject.value) {
                    this.timeLeft = data.timeLeft;
                }
            }),
        );
    }
    private subscribeTurnEnded(): void {
        this.subscriptions.add(
            this.onTurnEnded.subscribe(() => {
                this.isPlayerTurnSubject.next(false);
                this.timeLeft = 0;
                this.putTimerSubject.next(false);
            }),
        );
    }
    private subscribeNoMovementPossible(): void {
        this.subscriptions.add(
            this.onNoMovementPossible.subscribe((data) => {
                this.sessionService.openSnackBar(`Aucun mouvement possible pour ${data.playerName} - Le tour de se termine dans 3 secondes.`);
            }),
        );
    }

    private subscribeToCombatStarted(): void {
        this.subscriptions.add(
            this.onCombatStarted.subscribe((data) => {
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
            this.onCombatNotification.subscribe((data) => {
                if (!this.isPlayerInCombat) {
                    this.isCombatInProgress = data.combat;
                }
            }),
        );
    }
    private subscribeCombatTurn(): void {
        this.subscriptions.add(
            this.onCombatTurnStarted.subscribe((data) => {
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
            this.onCombatTimeLeft.subscribe((data) => {
                this.combatTimeLeft = data.timeLeft;
                this.timeLeft = this.combatTimeLeft;
            }),
        );
    }
    private subscribeCombatTurnEnded(): void {
        this.subscriptions.add(
            this.onCombatTurnEnded.subscribe(() => {
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
            this.onOpponentDefeated.subscribe((data) => {
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
            this.onDefeated.subscribe((data) => {
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
            this.onEvasionSuccess.subscribe((data) => {
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
            this.onOpponentEvaded.subscribe(() => {
                this.isPlayerInCombat = false;
                this.isCombatInProgress = false;
                this.isFight = false;
                this.sessionService.snackBar.open("Votre adversaire a réussi à s'échapper du combat.", 'OK', { duration: 3000 });
            }),
        );
    }
    private subscribeOnGameEnded(): void {
        this.subscriptions.add(
            this.onGameEnded.subscribe((data) => {
                this.openEndGameModal('DONEE', data.winner);
                setTimeout(() => {
                    this.sessionService.router.navigate(['/statistics'], {
                        queryParams: { sessionCode: this.sessionService.sessionCode },
                    });
                }, TIMER_COMBAT);
            }),
        );
    }
    private openEndGameModal(message: string, winner: string): void {
        this.endGameMessage = message;
        this.winnerName = winner;
    }
}
