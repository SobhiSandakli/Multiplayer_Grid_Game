import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Attribute } from '@app/interfaces/attributes.interface';
import { Player } from '@app/interfaces/player.interface';
import { RoomLockedResponse } from '@app/interfaces/socket.interface';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { SocketService } from '@app/services/socket/socket.service';
import { faArrowLeft, faHourglassHalf, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs/internal/Subscription';
@Component({
    selector: 'app-waiting-page',
    templateUrl: './waiting-page.component.html',
    styleUrls: ['./waiting-page.component.scss'],
})
export class WaitingViewComponent implements OnInit, OnDestroy {
    sessionCode: string;
    accessCode: string = '';
    faArrowLeft: IconDefinition = faArrowLeft;
    hourglass: IconDefinition = faHourglassHalf;
    players: Player[] = [];
    isOrganizer: boolean = false;
    popupVisible: boolean = false;
    leaveSessionPopupVisible: boolean = false;
    leaveSessionMessage: string = '';
    selectedPlayer: Player | null = null;
    playerName: string = '';
    roomLocked: boolean = false;
    playerAttributes: { [key: string]: Attribute } | undefined;
    private readonly subscriptions: Subscription = new Subscription();
    private gameId: string | null = null;
    constructor(
        private router: Router,
        private socketService: SocketService,
        private route: ActivatedRoute,
        private notificationService: NotificationService,
    ) {}

    ngOnInit(): void {
        this.initializeSessionCode();
        this.subscribeToPlayerListUpdate();
        this.subscribeToExclusion();
        this.subscribeToRoomLock();
        this.subscribeToSessionDeletion();
    }
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    leaveSession(): void {
        if (this.isOrganizer) {
            this.leaveSessionMessage = "En tant qu'organisateur, quitter la partie entraînera sa suppression. Voulez-vous vraiment continuer ?";
        } else {
            this.leaveSessionMessage = 'Voulez-vous vraiment quitter la partie ?';
        }
        this.leaveSessionPopupVisible = true;
    }

    confirmLeaveSession(): void {
        this.socketService.leaveSession(this.sessionCode);
        this.leaveSessionPopupVisible = false;
        this.router.navigate(['/']);
    }

    cancelLeaveSession(): void {
        this.leaveSessionPopupVisible = false;
    }

    startGame(): void {
        this.router.navigate(['/game'], {
            queryParams: {
                sessionCode: this.sessionCode,
                playerName: this.playerName,
                playerAttributes: JSON.stringify(this.playerAttributes),
                gameId: this.gameId,
            },
        });
    }
    excludePlayer(player: Player): void {
        this.socketService.excludePlayer(this.sessionCode, player.socketId);
    }
    openConfirmationPopup(player: Player): void {
        if (!player) {
            return;
        }
        this.selectedPlayer = player;
        this.popupVisible = true;
    }

    confirmExclusion(): void {
        if (this.sessionCode && this.selectedPlayer) {
            this.socketService.excludePlayer(this.sessionCode, this.selectedPlayer.socketId);
        }
        this.popupVisible = false;
        this.selectedPlayer = null;
    }
    toggleLock(): void {
        if (this.sessionCode) {
            this.roomLocked = !this.roomLocked;
            this.socketService.toggleRoomLock(this.sessionCode, this.roomLocked);
        }
    }
    cancelExclusion(): void {
        this.popupVisible = false;
        this.selectedPlayer = null;
    }
    private subscribeToRoomLock(): void {
        this.socketService.onRoomLocked().subscribe((data: RoomLockedResponse) => {
            this.roomLocked = data.locked;
        });
    }
    private subscribeToSessionDeletion(): void {
        this.socketService.onSessionDeleted().subscribe((data) => {
            this.notificationService.showMessage(data.message);
            this.router.navigate(['/']);
        });
    }
    private initializeSessionCode(): void {
        const sessionCodeFromRoute = this.route.snapshot.queryParamMap.get('sessionCode');
        const gameIdFromRoute = this.route.snapshot.queryParamMap.get('gameId');
        if (!sessionCodeFromRoute) {
            this.router.navigate(['/']);
            return;
        }
        this.sessionCode = sessionCodeFromRoute;
        this.gameId = gameIdFromRoute;
        this.accessCode = this.sessionCode;
        if (!this.sessionCode) {
            this.router.navigate(['/']);
            return;
        }
    }
    private subscribeToPlayerListUpdate(): void {
        this.socketService.onPlayerListUpdate().subscribe((data) => {
            this.players = data.players;
            const currentPlayer = this.players.find((p) => p.socketId === this.socketService.getSocketId());
            this.isOrganizer = currentPlayer ? currentPlayer.isOrganizer : false;
            if (currentPlayer) {
                this.playerName = currentPlayer.name;
                this.playerAttributes = currentPlayer.attributes;
                console.log(this.playerAttributes);

            }
        });
    }
    private subscribeToExclusion(): void {
        this.socketService.onExcluded().subscribe((data) => {
            this.notificationService.showMessage(data.message);
            this.router.navigate(['/']);
        });
    }
}
