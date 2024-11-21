import { Component, OnDestroy, OnInit } from '@angular/core';
import { Game } from '@app/interfaces/game-model.interface';
import { Player } from '@app/interfaces/player.interface';
import { RoomLockedResponse } from '@app/interfaces/socket.interface';
import { WaitingFacadeService } from '@app/services/facade/waitingFacade.service';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { SessionService } from '@app/services/session/session.service';
import { GameValidateService } from '@app/services/validate-game/gameValidate.service';
import { faArrowLeft, faHourglassHalf, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs/internal/Subscription';
import { MIN_PLAYERS } from 'src/constants/players-constants';

@Component({
    selector: 'app-waiting-page',
    templateUrl: './waiting-page.component.html',
    styleUrls: ['./waiting-page.component.scss'],
})
export class WaitingViewComponent implements OnInit, OnDestroy {
    accessCode: string = '';
    faArrowLeft: IconDefinition = faArrowLeft;
    hourglass: IconDefinition = faHourglassHalf;
    players: Player[] = [];
    maxPlayers: number;
    selectedGame: Game;
    isOrganizer: boolean = false;
    popupVisible: boolean = false;
    selectedPlayer: Player | null = null;
    roomLocked: boolean = false;
    gameId: string | null = null;
    virtualPlayerPopupVisible: boolean = false;
    private readonly subscriptions: Subscription = new Subscription();
    constructor(
        private gameFacade: GameFacadeService,
        private gameValidateService: GameValidateService,
        private waitingFacadeService: WaitingFacadeService,
        public sessionService: SessionService,
    ) {}
    get getSocketId() {
        return this.waitingFacadeService.getSocketId();
    }
    get playerName(): string {
        return this.sessionService.playerName;
    }
    get leaveSessionMessage(): string {
        return this.sessionService.leaveSessionMessage;
    }
    get sessionCode(): string {
        return this.sessionService.sessionCode;
    }
    get leaveSessionPopupVisible(): boolean {
        return this.sessionService.leaveSessionPopupVisible;
    }
    get onRoomLocked() {
        return this.waitingFacadeService.onRoomLocked();
    }
    get onSessionDeleted() {
        return this.waitingFacadeService.onSessionDeleted();
    }
    get onPlayerListUpdate() {
        return this.waitingFacadeService.onPlayerListUpdate();
    }
    get onExcluded() {
        return this.waitingFacadeService.onExcluded();
    }
    get onGameStarted() {
        return this.waitingFacadeService.onGameStarted();
    }
    ngOnInit(): void {
        this.reload();
        this.initializeSessionCode();
        this.loadGameData();
        this.subscribeToPlayerListUpdate();
        this.subscribeToExclusion();
        this.subscribeToRoomLock();
        this.subscribeToSessionDeletion();
        this.subscribeToGameStarted();
    }
    ngOnDestroy() {
        sessionStorage.removeItem('waitingPageReloaded');
        this.subscriptions.unsubscribe();
    }

    leaveSession(): void {
        this.sessionService.leaveSession();
    }

    confirmLeaveSession(): void {
        this.sessionService.confirmLeaveSession();
    }

    cancelLeaveSession(): void {
        this.sessionService.cancelLeaveSession();
    }

    startGame(): void {
        if (!this.isNumberPlayerValid()) {
            this.waitingFacadeService.message('Le nombre de joueurs ne respecte pas les limites de la carte de jeu.');
            return;
        }
        if (!this.roomLocked) {
            this.waitingFacadeService.message('La salle doit être verrouillée pour démarrer la partie.');
            return;
        }
        this.waitingFacadeService.emitStartGame(this.sessionCode);
    }
    excludePlayer(player: Player): void {
        this.waitingFacadeService.excludePlayer(this.sessionCode, player.socketId);
    }
    openConfirmationPopup(player: Player): void {
        if (!player) {
            return;
        }
        this.selectedPlayer = player;
        this.popupVisible = true;
    }

    confirmExclusion(): void {
        if (this.sessionCode && this.selectedPlayer) {
            this.waitingFacadeService.excludePlayer(this.sessionCode, this.selectedPlayer.socketId);
        }
        this.popupVisible = false;
        this.selectedPlayer = null;
    }
    toggleLock(): void {
        if (this.roomLocked && this.players.length >= this.maxPlayers) {
            if (this.isOrganizer) {
                this.waitingFacadeService.message('Vous ne pouvez pas déverrouiller la salle car le nombre maximum de joueurs est atteint.');
            }
            return;
        }
        this.roomLocked = !this.roomLocked;
        this.waitingFacadeService.toggleRoomLock(this.sessionCode, this.roomLocked);
    }
    cancelExclusion(): void {
        this.popupVisible = false;
        this.selectedPlayer = null;
    }
    openVirtualPlayerPopup(): void {
        this.virtualPlayerPopupVisible = true;
    }

    cancelVirtualPlayer(): void {
        this.virtualPlayerPopupVisible = false;
    }

    addVirtualPlayer(playerType: string): void {
        this.virtualPlayerPopupVisible = false;
        this.waitingFacadeService.addVirtualPlayer(this.sessionCode, playerType);
    }
    private reload(): void {
        if (sessionStorage.getItem('waitingPageReloaded')) {
            this.sessionService.router.navigate(['/']);
        } else {
            sessionStorage.setItem('waitingPageReloaded', 'true');
        }
    }
    private loadGame(gameId: string): void {
        this.gameId = gameId;
        const gameFetch = this.gameFacade.fetchGame(gameId).subscribe({
            next: (game: Game) => {
                this.selectedGame = game;
                this.maxPlayers = this.gameValidateService.gridMaxPlayers(game);
            },
        });
        this.subscriptions.add(gameFetch);
    }
    private subscribeToRoomLock(): void {
        this.onRoomLocked.subscribe((data: RoomLockedResponse) => {
            this.roomLocked = data.locked;
        });
    }
    private subscribeToSessionDeletion(): void {
        this.onSessionDeleted.subscribe((data) => {
            this.waitingFacadeService.message(data.message);
            this.sessionService.router.navigate(['/']);
        });
    }
    private isNumberPlayerValid(): boolean {
        return this.players.length >= MIN_PLAYERS && this.players.length <= this.maxPlayers;
    }
    private subscribeToGameStarted(): void {
        this.onGameStarted.subscribe((data) => {
            if (data.sessionCode === this.sessionCode) {
                this.sessionService.router.navigate(['/game'], {
                    queryParams: {
                        sessionCode: this.sessionCode,
                    },
                });
            }
        });
    }

    private initializeSessionCode(): void {
        const sessionCodeFromRoute = this.sessionService.route.snapshot.queryParamMap.get('sessionCode');
        const gameIdFromRoute = this.sessionService.route.snapshot.queryParamMap.get('gameId');
        if (!sessionCodeFromRoute) {
            this.sessionService.router.navigate(['/']);
            return;
        }
        this.sessionService.sessionCode = sessionCodeFromRoute;
        this.gameId = gameIdFromRoute;
        this.accessCode = this.sessionCode;
        if (!this.sessionCode) {
            this.sessionService.router.navigate(['/']);
        }
    }
    private subscribeToPlayerListUpdate(): void {
        this.subscriptions.add(
            this.onPlayerListUpdate.subscribe((data) => {
                this.players = data.players;
                const currentPlayer = this.players.find((p) => p.socketId === this.getSocketId);
                this.isOrganizer = currentPlayer ? currentPlayer.isOrganizer : false;
                if (currentPlayer) {
                    this.sessionService.updatePlayerData(currentPlayer);
                }
                this.updatePlayersList(data.players);
                this.updateCurrentPlayerDetails();
                this.lockRoomIfMaxPlayersReached();
            }),
        );
    }

    private updatePlayersList(players: Player[]): void {
        this.sessionService.updatePlayersList(players);
    }

    private updateCurrentPlayerDetails(): void {
        this.sessionService.updateCurrentPlayerDetails();
    }
    private lockRoomIfMaxPlayersReached(): void {
        if (this.players.length >= this.maxPlayers) {
            this.roomLocked = true;
            this.waitingFacadeService.toggleRoomLock(this.sessionCode, this.roomLocked);
            if (this.isOrganizer) {
                this.waitingFacadeService.message('La salle est automatiquement verrouillée car le nombre maximum de joueurs est atteint.');
            }
        }
    }
    private loadGameData(): void {
        if (this.gameId) {
            this.loadGame(this.gameId);
        } else {
            this.sessionService.router.navigate(['/']);
        }
    }
    private subscribeToExclusion(): void {
        this.onExcluded.subscribe((data) => {
            this.waitingFacadeService.message(data.message);
            this.sessionService.router.navigate(['/']);
        });
    }
}
