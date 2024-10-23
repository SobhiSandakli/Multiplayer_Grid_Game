import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TimerComponent } from '@app/components/timer/timer.component';
import { Game } from '@app/interfaces/game-model.interface';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { MaxPlayers } from 'src/constants/game-constants';
@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit {
    isInvolvedInFight: boolean = false;
    showCreationPopup: boolean = false;
    sessionCode: string = '';
    playerName: string = '';
    maxPlayers: number;
    gameName: string;
    gameDescription: string;
    gameSize: string;
    gameId: string | null = null;
    games: Game[] = [];
    timer: TimerComponent;
    putTimer: boolean;
    faChevronDown = faChevronDown;
    faChevronUp = faChevronUp;
    isExpanded = false;

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

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
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
                this.maxPlayers = this.gridMaxPlayers(game);
            },
        });
        this.subscriptions.add(gameFetch);
    }

    private abandonedGame(): void {
        this.router.navigate(['/home']);
    }
    private gridMaxPlayers(game: Game): number {
        switch (game.size) {
            case '10x10':
                return MaxPlayers.SmallMaxPlayers;
            case '15x15':
                return MaxPlayers.MeduimMaxPlayers;
            case '20x20':
                return MaxPlayers.LargeMaxPlayers;
            default:
                return MaxPlayers.SmallMaxPlayers;
        }
    }
}
