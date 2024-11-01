import { Component, OnDestroy, OnInit } from '@angular/core';
import { TimerComponent } from '@app/components/timer/timer.component';
import { SessionService } from '@app/services/session/session.service';
import { SocketService } from '@app/services/socket/socket.service';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { GameInfo } from '@app/interfaces/socket.interface';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    faChevronDown = faChevronDown;
    faChevronUp = faChevronUp;
    gameInfo: GameInfo;
    timer: TimerComponent;
    putTimer: boolean;
    isExpanded: boolean = false;
    isInvolvedInFight: boolean = false;
    action: number;
    movementPoints: number;
    avatar: string;
    isActive: boolean = false;
    escapeAttempt: number = 2;
    remainingHealth: number = 0;
    private subscriptions: Subscription = new Subscription();

    constructor(
        private socketService: SocketService,
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

    get maxPlayers(): number {
        return this.sessionService.maxPlayers;
    }

    get playerCount(): number {
        return 2; // A MODIFIER
    }

    get playerName(): string {
        return this.sessionService.playerName;
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

    ngOnInit(): void {
        this.sessionService.leaveSessionPopupVisible = false;
        this.sessionService.initializeGame();
        this.sessionService.subscribeToPlayerListUpdate();
        this.sessionService.subscribeToOrganizerLeft();
        this.movementPoints = this.playerAttributes?.speed.currentValue ?? 0;
        this.remainingHealth = this.playerAttributes?.life?.currentValue ?? 0;
        this.socketService.onGameInfo(this.sessionService.sessionCode).subscribe((data) => {
            if(data)
                this.gameInfo = data;
        })
        this.action = 1;
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        if (this.sessionService.isOrganizer && this.sessionService.sessionCode) {
            this.socketService.leaveSession(this.sessionService.sessionCode);
        }
    }

    endTurn(): void {
        this.putTimer = false;
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
}
