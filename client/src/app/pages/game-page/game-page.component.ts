import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DiceComponent } from '@app/components/dice/dice.component';
import { Player } from '@app/interfaces/player.interface';
import { SessionService } from '@app/services/session/session.service';
import { CombatSocket } from '@app/services/socket/combatSocket.service';
import { MovementSocket } from '@app/services/socket/movementSocket.service';
import { SessionSocket } from '@app/services/socket/sessionSocket.service';
import { TurnSocket } from '@app/services/socket/turnSocket.service';
import { SubscriptionService } from '@app/services/subscription/subscription.service';
import { faBolt, faChevronDown, faChevronUp, faCrown, faFistRaised, faHeart, faShieldAlt, faTachometerAlt, faUserCircle, faWalking } from '@fortawesome/free-solid-svg-icons';
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
    faFistRaised = faFistRaised;
    faShieldAlt = faShieldAlt;
    faTachometerAlt = faTachometerAlt;
    faHeart = faHeart;
    faCrown =faCrown;
    faUserCircle = faUserCircle;
    faWalking = faWalking;
    faBolt = faBolt;
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
    gameInfo$ = this.subscriptionService.gameInfo$;
    currentPlayerSocketId$ = this.subscriptionService.currentPlayerSocketId$;
    isPlayerTurn$ = this.subscriptionService.isPlayerTurn$;
    putTimer$ = this.subscriptionService.putTimer$;
    inventoryFullItems: string[] = [];
    inventoryFullPopupVisible: boolean = false;
    private subscriptions: Subscription = new Subscription();
    constructor(
        public subscriptionService: SubscriptionService,
        public sessionService: SessionService,
        private sessionSocket: SessionSocket,
        private turnSocket: TurnSocket,
        private combatSocket: CombatSocket,
        private movementSocket: MovementSocket
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
        this.subscriptions.add(
            this.movementSocket.onInventoryFull().subscribe((data) => {
                this.inventoryFullItems = data.items;
                this.inventoryFullPopupVisible = true;
            }),
        );

        this.subscriptions.add(
            this.movementSocket.onUpdateInventory().subscribe((data) => {
                const player = this.sessionService.getCurrentPlayer();
                if (player) {
                    player.inventory = data.inventory;
                }
            }),
        );
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        this.subscriptionService.unsubscribeAll();
        if (this.sessionService.isOrganizer && this.sessionService.sessionCode) {
            this.sessionSocket.leaveSession(this.sessionService.sessionCode);
        }
    }
    handleActionPerformed(): void {
        this.subscriptionService.action = 0;
        this.isActive = false;
        this.subscriptions.add(
            this.turnSocket.onTurnEnded().subscribe(() => {
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
        this.combatSocket.emitStartCombat(this.sessionCode, this.playerAvatar, this.opposentPlayer);
    }

    handleDataFromChild(avatar: string) {
        this.isActive = false;
        this.opposentPlayer = avatar;
        this.startCombat();
    }

    chooseAttack() {
        if (this.subscriptionService.isCombatTurn) {
            this.combatSocket.emitAttack(this.sessionService.sessionCode);
            this.subscriptionService.isAttackOptionDisabled = true;
            this.subscriptionService.isEvasionOptionDisabled = true;
            this.diceComponent.rollDice();
        }
    }

    chooseEvasion() {
        if (this.subscriptionService.isCombatTurn) {
            this.combatSocket.emitEvasion(this.sessionService.sessionCode);
            this.subscriptionService.isAttackOptionDisabled = true;
            this.subscriptionService.isEvasionOptionDisabled = true;
        }
    }
    onFightStatusChanged($event: boolean) {
        this.subscriptionService.isFight = $event;
    }
    
    discardItem(discardedItem: string): void {
        const player = this.sessionService.getCurrentPlayer();
                if (player) {
                    const pickedUpItem = this.inventoryFullItems.find((item) => !player.inventory.includes(item));
                    if (pickedUpItem) {
                        this.movementSocket.discardItem(this.sessionService.sessionCode, discardedItem, pickedUpItem);
                    }
                    this.inventoryFullPopupVisible = false;
                }
    }
}
