import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
    constructor(
        private router: Router,
        private socketService: SocketService,
        private route: ActivatedRoute,
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
            alert(data.message);
            this.router.navigate(['/']);
        });
    }
    excludePlayer(player: Player): void {
        this.socketService.excludePlayer(this.sessionCode!, player.socketId);
      }
}
