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
    constructor(
        private router: Router,
        private socketService: SocketService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.sessionCode = this.route.snapshot.queryParamMap.get('sessionCode');
        console.log('Session Code in WaitingViewComponent:', this.sessionCode);

        // Utilisez sessionCode ou une autre logique pour assigner l'accessCode
        this.accessCode = this.sessionCode || 'N/A';

        // Vérifier que le sessionCode est défini
        if (!this.sessionCode) {
            console.error('Session Code is not defined');
            this.router.navigate(['/']);
            return;
        }
        this.socketService.onPlayerListUpdate().subscribe((data: { players: Player[] }) => {
            this.players = data.players;
        });
    }
}
