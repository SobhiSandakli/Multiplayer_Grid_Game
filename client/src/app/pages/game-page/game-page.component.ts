import { Component, OnDestroy, OnInit } from '@angular/core';
import { TimerComponent } from '@app/components/timer/timer.component';
import { SessionService } from '@app/services/session/session.service';
import { SocketService } from '@app/services/socket/socket.service';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    faChevronDown = faChevronDown;
    faChevronUp = faChevronUp;
    timer: TimerComponent;
    putTimer: boolean;
    isExpanded: boolean = false;
    isInvolvedInFight: boolean = false;
    action: number;
    movementPoints: number;
    avatar: string;
    isActive: boolean = false;
    escapeAttempt: number = 2;
    private subscriptions: Subscription = new Subscription();

    constructor(
        private socketService: SocketService,
        public sessionService: SessionService,
    ) {}

    get gameName(): string {
        return this.sessionService.gameName;
    }

    get gameDescription(): string {
        return this.sessionService.gameDescription;
    }

    get gameSize(): string {
        return this.sessionService.gameSize;
    }

    get maxPlayers(): number {
        return this.sessionService.maxPlayers;
    }

    get playerName(): string {
        return this.sessionService.playerName;
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
        this.sessionService.initializePlayer();
        this.sessionService.subscribeToOrganizerLeft();
        this.movementPoints = this.playerAttributes?.speed.currentValue ?? 0;
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
