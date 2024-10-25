import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TimerComponent } from '@app/components/timer/timer.component';
import { Attribute } from '@app/interfaces/attributes.interface';
import { Game } from '@app/interfaces/game-model.interface';
import { GameValidateService } from '@app/services/validate-game/gameValidate.service';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { SocketService } from '@app/services/socket/socket.service';
@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
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
    playerAttributes: { [key: string]: Attribute } | undefined;
    timer: TimerComponent;
    putTimer: boolean;
    isOrganizer: boolean = false;
    faChevronDown = faChevronDown;
    faChevronUp = faChevronUp;
    isExpanded = false;

    private subscriptions: Subscription = new Subscription();

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private gameFacade: GameFacadeService,
        private gameValidate: GameValidateService,
        private socketService: SocketService,
    ) {}

    ngOnInit(): void {
        this.initializeGame();
        this.initializePlayer();
        this.subscribeToOrganizerLeft();
    }
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        if (this.isOrganizer && this.sessionCode) {
            this.socketService.leaveSession(this.sessionCode);
        }
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
                this.maxPlayers = this.gameValidate.gridMaxPlayers(game);
                this.playerName = this.playerName || '';
            },
        });
        this.subscriptions.add(gameFetch);
    }

    private abandonedGame(): void {
        this.router.navigate(['/home']);
    }
    private initializeGame(): void {
        this.route.queryParamMap.subscribe((params) => {
            this.sessionCode = params.get('sessionCode') || '';
            this.gameId = params.get('gameId') || '';
            if (this.gameId) {
                this.loadGame(this.gameId);
            }
        });
    }
    private initializePlayer(): void {
        this.route.queryParamMap.subscribe((params) => {
            this.playerName = params.get('playerName') || '';
            this.isOrganizer = params.get('isOrganizer') === 'true';
            const playerAttributesParam = params.get('playerAttributes');
            try {
                this.playerAttributes = playerAttributesParam ? JSON.parse(playerAttributesParam) : {};
            } catch (error) {
                this.playerAttributes = {};
            }
        });
    }
    private subscribeToOrganizerLeft(): void {
        this.socketService.onOrganizerLeft().subscribe((data) => {
            this.router.navigate(['/home']);
        });
    }
    confirmLeaveSession(): void {
        this.socketService.leaveSession(this.sessionCode);
        if (this.isOrganizer) {
            this.socketService.deleteSession(this.sessionCode);
        }
        this.router.navigate(['/home']);
    }
    
}
