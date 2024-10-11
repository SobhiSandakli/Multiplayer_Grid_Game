import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-waiting-page',
    templateUrl: './waiting-page.component.html',
    standalone: true,
    styleUrls: ['./waiting-page.component.scss'],
})
export class WaitingViewComponent implements OnInit {
    sessionCode: string | null;
    accessCode: string = '';

    constructor(
        private router: Router,
        //private socketService: SocketService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        // Récupérer le code de session depuis les paramètres de la route
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

        // Écouter les mises à jour de la liste des joueurs
        //this.socketService.onPlayerListUpdate().subscribe((data: any) => {
        //  this.players = data.players;
        //});
    }
}
