import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit {
    isInvolvedInFight: boolean = true;
    ngOnInit(): void {
        // Initialization logic here
    }

    abandonedGame(): void {
        // Logic to abandon the game
    }
}
