import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TimerComponent } from '@app/components/timer/timer.component';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit {
    isInvolvedInFight: boolean = false;
    showCreationPopup: boolean = false;
    timer: TimerComponent;
    putTimer: boolean;
    faChevronDown = faChevronDown;
    faChevronUp = faChevronUp;
    isExpanded = false;

    constructor(@Inject(Router) private router: Router) {}
    ngOnInit(): void {}

    abandonedGame(): void {
        this.router.navigate(['/home']);
    }

    endTurn(): void {
        this.putTimer = false;
    }

    confirmAbandoned(): void {
        this.showCreationPopup = false;
        this.abandonedGame();
    }

    cancelAbandoned(): void {
        this.showCreationPopup = false;
    }

    openPopup(): void {
        this.showCreationPopup = true;
    }

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }
}
