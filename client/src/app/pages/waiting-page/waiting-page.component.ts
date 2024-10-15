import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { SocketService } from '@app/services/socket.service';
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
    sessionCode: string | null;
    accessCode: string = '';
    faArrowLeft: IconDefinition = faArrowLeft;
    hourglass: IconDefinition = faHourglassHalf;
    players: Player[] = [];
    isOrganizer: boolean = false;
    popupVisible: boolean = false;
    selectedPlayer: Player | null = null;
    constructor(
        private router: Router,
        private socketService: SocketService,
        private route: ActivatedRoute,
        private notificationService: NotificationService,
    ) {}

    ngOnInit(): void {
        this.sessionCode = this.route.snapshot.queryParamMap.get('sessionCode');
        console.log('Session Code in WaitingViewComponent:', this.sessionCode);
        this.accessCode = this.sessionCode || 'N/A';
        if (!this.sessionCode) {
            console.error('Session Code is not defined');
            this.router.navigate(['/']);
            return;
        }

        this.socketService.onPlayerListUpdate().subscribe((data) => {
            this.players = data.players;
            const currentPlayer = this.players.find(p => p.socketId === this.socketService.getSocketId());
            this.isOrganizer = currentPlayer ? currentPlayer.isOrganizer : false;
        });
        this.socketService.onExcluded().subscribe((data) => {
            this.notificationService.showMessage(data.message);
            this.router.navigate(['/']);
        });
    }
    excludePlayer(player: Player): void {
        this.socketService.excludePlayer(this.sessionCode!, player.socketId);
    }
    openConfirmationPopup(player: Player): void {
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

    cancelExclusion(): void {
        this.popupVisible = false;
        this.selectedPlayer = null;
    }
}
