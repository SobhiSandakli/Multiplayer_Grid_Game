import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DiceComponent } from '@app/components/dice/dice.component';
import { Player } from '@app/interfaces/player.interface';
import { DebugModeService } from '@app/services/debugMode/debug-mode.service';
import { GamePageFacade } from '@app/services/game-page-facade/gamePageFacade.service';
import { SessionService } from '@app/services/session/session.service';
import { SubscriptionService } from '@app/services/subscription/subscription.service';
import {
    faBolt,
    faChevronDown,
    faChevronUp,
    faCrown,
    faFistRaised,
    faFlag,
    faHeart,
    faShieldAlt,
    faTachometerAlt,
    faUserCircle,
    faWalking,
} from '@fortawesome/free-solid-svg-icons';
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
    faCrown = faCrown;
    faFlag = faFlag;
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
    playerInventory$;
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
        private gamePageFacade: GamePageFacade,
        public debugModeService: DebugModeService,
        private cdr: ChangeDetectorRef,
    ) {
        this.playerInventory$ = this.sessionService['playerInventorySubject'].asObservable();
    }

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
    get onTurnEnded() {
        return this.gamePageFacade.onTurnEnded();
    }
    get onInventoryFull() {
        return this.gamePageFacade.onInventoryFull();
    }
    get onUpdateInventory() {
        return this.gamePageFacade.onUpdateInventory();
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
            this.onInventoryFull.subscribe((data) => {
                this.inventoryFullItems = data.items;
                this.inventoryFullPopupVisible = true;
            }),
        );

        this.subscriptions.add(
            this.onUpdateInventory.subscribe((data) => {
                const player = this.sessionService.getCurrentPlayer();
                if (player) {
                    player.inventory = data.inventory;
                    this.sessionService['playerInventorySubject'].next([...data.inventory]);
                    this.cdr.detectChanges();
                }
            }),
        );
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        this.subscriptionService.unsubscribeAll();
        this.reset();
        if (this.sessionService.isOrganizer && this.sessionService.sessionCode) {
            this.gamePageFacade.leaveSession(this.sessionService.sessionCode);
            this.ngOnDestroy();
        }
    }
    handleActionPerformed(): void {
        this.subscriptionService.action = 0;
        this.isActive = false;
        this.subscriptions.add(
            this.onTurnEnded.subscribe(() => {
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
        this.gamePageFacade.emitStartCombat(this.sessionCode, this.playerAvatar, this.opposentPlayer);
    }

    handleDataFromChild(avatar: string) {
        this.isActive = false;
        this.opposentPlayer = avatar;
        this.startCombat();
    }
    onFightStatusChanged($event: boolean) {
        this.subscriptionService.isFight = $event;
    }

    discardItem(discardedItem: string): void {
        const player = this.sessionService.getCurrentPlayer();
        if (player) {
            const pickedUpItem = this.inventoryFullItems.find((item) => !player.inventory.includes(item));
            if (pickedUpItem) {
                this.gamePageFacade.discardItem(this.sessionService.sessionCode, discardedItem, pickedUpItem);
            }
            this.inventoryFullPopupVisible = false;
        }
    }
    handleKeyPress(event: KeyboardEvent): void {
        return this.debugModeService['handleKeyPress'](event);
    }
    hasFlagInInventory(player: Player): boolean {
        return player.inventory.includes('assets/objects/Flag.png') ?? false;
    }
    reset(): void {
        this.subscriptionService.reset();
        this.debugModeService.reset();
        this.sessionService.reset();
    }
}
