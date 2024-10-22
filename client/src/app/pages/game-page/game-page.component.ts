import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TimerComponent } from '@app/components/timer/timer.component';
import { Game } from '@app/interfaces/game-model.interface';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { Subscription } from 'rxjs';

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
    gameName: string;
    gameDescription: string;
    gameSize: string;
    gameId: string | null = null;
    timer: TimerComponent;
    putTimer: boolean;
    games: Game[] = [];
    private subscriptions: Subscription = new Subscription();

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private gameFacade: GameFacadeService, // Injected here
    ) {}

    ngOnInit(): void {
        this.route.queryParamMap.subscribe((params) => {
            this.sessionCode = params.get('sessionCode') || '';
            this.playerName = params.get('playerName') || '';
            this.gameId = params.get('gameId') || '';
            if (this.gameId) {
                this.loadGame(this.gameId);
            }
        });
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

    loadGame(gameId: string): void {
        this.gameId = gameId;
        const gameFetch = this.gameFacade.fetchGame(gameId).subscribe({
            next: (game: Game) => {
                this.gameName = game.name;
                this.gameDescription = game.description;
                this.gameSize = game.size;
            },
        });
        this.subscriptions.add(gameFetch);
    }

    private abandonedGame(): void {
        this.router.navigate(['/home']);
    }
}
