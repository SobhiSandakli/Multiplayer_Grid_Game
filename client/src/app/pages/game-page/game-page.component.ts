import { Component, OnInit, OnDestroy } from '@angular/core';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { SocketService } from '@app/services/socket/socket.service';
import { SessionService } from '@app/services/session/session.service';
import { TimerComponent } from '@app/components/timer/timer.component';

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
}
