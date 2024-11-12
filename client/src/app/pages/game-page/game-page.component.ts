import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DiceComponent } from '@app/components/dice/dice.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { Player } from '@app/interfaces/player.interface';
import { SessionService } from '@app/services/session/session.service';
import { SubscriptionService } from '@app/services/subscription/subscription.service';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss', './game-page2.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    @ViewChild(DiceComponent) diceComponent!: DiceComponent;
    faChevronDown = faChevronDown;
    faChevronUp = faChevronUp;
    timer: TimerComponent;
    speedPoints: number;
    avatar: string;
    isActive: boolean = false;
    remainingHealth: number = 0;
    putTimer: boolean = false;
    isExpanded: boolean = false;
    currentPlayerSocketId: string;
    isInvolvedInFight: boolean = false;
    opposentPlayer: string;
    combatCurrentPlayerSocketId: string | null = null;
    evasionSuccess: boolean | null = null;

    private subscriptions: Subscription = new Subscription();

    constructor(
        public subscriptionService: SubscriptionService,
        public sessionService: SessionService,
    ) {}

    get sessionCode() {
        return this.sessionService.sessionCode;
    }

    get gameName(): string {
        return this.sessionService.selectedGame?.name ?? '';
    }

    get gameDescription(): string {
        return this.sessionService.selectedGame?.description ?? '';
    }

    get gameSize(): string {
        return this.sessionService.selectedGame?.size ?? '';
    }

    get playerCount(): number {
        return this.sessionService.players.length;
    }

    get playerName(): string {
        return this.sessionService.playerName ?? '';
    }
    get playerAvatar(): string {
        return this.sessionService.playerAvatar;
    }

    get playerAttributes() {
        return this.sessionService.playerAttributes;
    }

    get leaveSessionPopupVisible(): boolean {
        return this.sessionService.leaveSessionPopupVisible;
    }

    get leaveSessionMessage(): string {
        return this.sessionService.leaveSessionMessage;
    }

    get isOrganizer(): boolean {
        return this.sessionService.isOrganizer;
    }
    get players(): Player[] {
        return this.sessionService.players;
    }

    public gameInfo$ = this.subscriptionService.gameInfo$;
    public currentPlayerSocketId$ = this.subscriptionService.currentPlayerSocketId$;
    public isPlayerTurn$ = this.subscriptionService.isPlayerTurn$;
    public putTimer$ = this.subscriptionService.putTimer$;

    ngOnInit(): void {
        this.sessionService.leaveSessionPopupVisible = false;
        this.sessionService.initializeGame();
        this.sessionService.subscribeToPlayerListUpdate();
        this.sessionService.subscribeToOrganizerLeft();
        this.subscriptionService.initSubscriptions();
        this.speedPoints = this.playerAttributes?.speed.currentValue ?? 0;
        this.remainingHealth = this.playerAttributes?.life?.currentValue ?? 0;

        this.handleActionPerformed();
        this.subscriptionService.action = 1;
    }
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        this.subscriptionService.unsubscribeAll();
        if (this.sessionService.isOrganizer && this.sessionService.sessionCode) {
            this.sessionService.sessionSocket.leaveSession(this.sessionService.sessionCode);
        }
    }
    handleActionPerformed(): void {
        this.subscriptionService.action = 0;
        this.isActive = false;
        this.subscriptions.add(
            this.subscriptionService.turnSocket.onTurnEnded().subscribe(() => {
                this.subscriptionService.action = 1;
                this.isActive = false;
            }),
        );
    }

    leaveSession(): void {
        this.sessionService.leaveSession();
    }

    confirmLeaveSession(): void {
        this.sessionService.confirmLeaveSession();
    }

    cancelLeaveSession(): void {
        this.sessionService.cancelLeaveSession();
    }

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }

    toggleActive() {
        this.isActive = !this.isActive;
    }

    startCombat() {
        this.subscriptionService.combatSocket.emitStartCombat(this.sessionCode, this.playerAvatar, this.opposentPlayer);
    }

    handleDataFromChild(avatar: string) {
        this.isActive = false;
        this.opposentPlayer = avatar;
        this.startCombat();
    }

    chooseAttack() {
        if (this.subscriptionService.isCombatTurn) {
            this.subscriptionService.combatSocket.emitAttack(this.sessionService.sessionCode);
            this.subscriptionService.isAttackOptionDisabled = true;
            this.subscriptionService.isEvasionOptionDisabled = true;
            this.diceComponent.rollDice();
        }
    }

    chooseEvasion() {
        if (this.subscriptionService.isCombatTurn) {
            this.subscriptionService.combatSocket.emitEvasion(this.sessionService.sessionCode);
            this.subscriptionService.isAttackOptionDisabled = true;
            this.subscriptionService.isEvasionOptionDisabled = true;
        }
    }
    onFightStatusChanged($event: boolean) {
        this.subscriptionService.isFight = $event;
    }
}
