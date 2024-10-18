import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit {
    isInvolvedInFight: boolean = true;
    showCreationPopup: boolean = false;

    constructor(@Inject(Router) private router: Router) {}
    ngOnInit(): void {
        // Initialization logic here
    }

    abandonedGame(): void {
        this.router.navigate(['/home']);
    }

    endTurn(): void {
        // Logic to end the current turn
    }

    confirmEndTurn(): void {
        this.showCreationPopup = false;
        this.abandonedGame();
    }

    cancelEndTurn(): void {
        this.showCreationPopup = false;
    }

    openPopup(): void {
        this.showCreationPopup = true;
    }
}
