import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TimerComponent } from '@app/components/timer/timer.component';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit {
    isInvolvedInFight: boolean = true;
    showCreationPopup: boolean = false;
    sessionCode: string = '';
    playerName: string = '';
    timer: TimerComponent;
    putTimer: boolean;

    constructor(
        @Inject(Router) private router: Router,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        //no need to unsubscribe for this subscription
        this.route.queryParamMap.subscribe((params) => {
            this.sessionCode = params.get('sessionCode') || '';
            this.playerName = params.get('playerName') || '';
        });
    }

    public endTurn(): void {
        this.putTimer = false;
    }

    public confirmAbandoned(): void {
        this.showCreationPopup = false;
        this.abandonedGame();
    }

    public cancelAbandoned(): void {
        this.showCreationPopup = false;
    }

    public openPopup(): void {
        this.showCreationPopup = true;
    }
    private abandonedGame(): void {
        this.router.navigate(['/home']);
    }
}
