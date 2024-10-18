import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { SocketService } from '@app/services/socket/socket.service';
import { faArrowLeft, faHourglassHalf, IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface Player {
    socketId: string;
    name: string;
    avatar: string;
    isOrganizer: boolean;
}
@Component({
    selector: 'app-waiting-page',
    templateUrl: './waiting-page.component.html',
    styleUrls: ['./waiting-page.component.scss'],
})
export class WaitingViewComponent implements OnInit {
    sessionCode: string;
    accessCode: string = '';
    faArrowLeft: IconDefinition = faArrowLeft;
    hourglass: IconDefinition = faHourglassHalf;
    players: Player[] = [];
    isOrganizer: boolean = false;
    popupVisible: boolean = false;
    selectedPlayer: Player | null = null;
    playerName: string = '';
    roomLocked: boolean = false;
    constructor(
        private router: Router,
        private socketService: SocketService,
        private route: ActivatedRoute,
        private notificationService: NotificationService,
    ) {}

    ngOnInit(): void {
        const sessionCodeFromRoute = this.route.snapshot.queryParamMap.get('sessionCode');
        if (!sessionCodeFromRoute) {
            this.router.navigate(['/']);
            return;
        }
        this.sessionCode = sessionCodeFromRoute;
        this.accessCode = this.sessionCode;

        if (!this.sessionCode) {
            this.router.navigate(['/']);
            return;
        }

        this.socketService.onPlayerListUpdate().subscribe((data) => {
            this.players = data.players;
            const currentPlayer = this.players.find((p) => p.socketId === this.socketService.getSocketId());
            this.isOrganizer = currentPlayer ? currentPlayer.isOrganizer : false;
            if (currentPlayer) {
                this.playerName = currentPlayer.name; // Récupérer le nom du joueur actuel
            }
        });
        this.socketService.onExcluded().subscribe((data) => {
            this.notificationService.showMessage(data.message);
            this.router.navigate(['/']);
        });
    }
    startGame(): void {
        this.router.navigate(['/game'], { queryParams: { sessionCode: this.sessionCode, playerName: this.playerName } });
    }
    excludePlayer(player: Player): void {
        this.socketService.excludePlayer(this.sessionCode!, player.socketId);
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
            // Inverser l'état de verrouillage
            this.roomLocked = !this.roomLocked;
            this.socketService.toggleRoomLock(this.sessionCode, this.roomLocked);
        }
    }
    cancelExclusion(): void {
        this.popupVisible = false;
        this.selectedPlayer = null;
    }

}
