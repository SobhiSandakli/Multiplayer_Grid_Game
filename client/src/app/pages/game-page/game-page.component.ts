import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TimerComponent } from '@app/components/timer/timer.component';
import { Player } from '@app/interfaces/player.interface';
import { SessionService } from '@app/services/session/session.service';
import { SocketService } from '@app/services/socket/socket.service';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { GameInfo } from '@app/interfaces/socket.interface';
import { TURN_NOTIF_DURATION } from 'src/constants/game-constants';;


@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    faChevronDown = faChevronDown;
    faChevronUp = faChevronUp;
    gameInfo: GameInfo = {name : '', size: ''};
    timer: TimerComponent;
    action: number;
    movementPoints: number;
    avatar: string;
    isActive: boolean = false;
    escapeAttempt: number = 2;
    remainingHealth: number = 0;
    timeLeft: number = 0;
    putTimer: boolean = false;
    isExpanded: boolean = false;
    isPlayerTurn: boolean = false;
    currentPlayerSocketId: string;
    isInvolvedInFight: boolean = false;
    
    private subscriptions: Subscription = new Subscription();
    

    constructor(
        private socketService: SocketService,
        public sessionService: SessionService,
        private snackBar: MatSnackBar,
        //private toastr: ToastrService,
    ) {}

    get sessionCode() {
        return this.sessionService.sessionCode;
    }

    get gameName(): string {
        return this.sessionService.selectedGame?.name ?? '';
    }

    get gameDescription(): string {
        return this.sessionService.selectedGame?.description ?? '';
    }

    get gameSize(): string {
        return this.sessionService.selectedGame?.size ?? '';
    }
    
    get playerCount(): number {
        return 2; // A MODIFIER
    }

    get playerName(): string {
        return this.sessionService.playerName ?? '';
    }
    get playerAvatar(): string {
        return this.sessionService.playerAvatar;
    }

    get playerAttributes() {
        return this.sessionService.playerAttributes;
    }

    get leaveSessionPopupVisible(): boolean {
        return this.sessionService.leaveSessionPopupVisible;
    }

    get leaveSessionMessage(): string {
        return this.sessionService.leaveSessionMessage;
    }

    get isOrganizer(): boolean {
        return this.sessionService.isOrganizer;
    }
    get players(): Player[] {
        return this.sessionService.players;
      }

    ngOnInit(): void {
        this.sessionService.leaveSessionPopupVisible = false;
        this.sessionService.initializeGame();
        this.sessionService.subscribeToPlayerListUpdate();
        this.sessionService.subscribeToOrganizerLeft();
        this.movementPoints = this.playerAttributes?.speed.currentValue ?? 0;
        this.remainingHealth = this.playerAttributes?.life?.currentValue ?? 0;
        this.socketService.onGameInfo(this.sessionService.sessionCode).subscribe((data) => {
            if(data)
                this.gameInfo = data;
        })
        this.action = 1;
      
          this.subscriptions.add(
            this.socketService.onTurnStarted().subscribe((data) => {
              this.currentPlayerSocketId = data.playerSocketId;
              this.isPlayerTurn = this.currentPlayerSocketId === this.socketService.getSocketId();
              this.sessionService.setCurrentPlayerSocketId(this.currentPlayerSocketId);
              this.putTimer = this.isPlayerTurn;
            })
          );

          this.subscriptions.add(
            this.socketService.onNextTurnNotification().subscribe((data) => {
              const playerName = this.getPlayerNameBySocketId(data.playerSocketId);
              this.openSnackBar(`Le tour de ${playerName} commence dans ${data.inSeconds} secondes.`)

            })
          );

          this.subscriptions.add(
            this.socketService.onTimeLeft().subscribe((data) => {
              if (data.playerSocketId === this.currentPlayerSocketId) {
                this.timeLeft = data.timeLeft;
              }
            })
          );
      
          this.subscriptions.add(
            this.socketService.onTurnEnded().subscribe(() => {
              this.isPlayerTurn = false;
              this.timeLeft = 0;
              this.putTimer = false;
            })
          );

          this.subscriptions.add(
          this.socketService.onNoMovementPossible().subscribe((data) => {
            this.openSnackBar(`Aucun mouvement possible pour ${data.playerName} - Le tour de se termine dans 3 secondes.`)
          })
         );
          
    }
    private openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: TURN_NOTIF_DURATION,
            panelClass: ['custom-snackbar'],
        });
    }
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        if (this.sessionService.isOrganizer && this.sessionService.sessionCode) {
            this.socketService.leaveSession(this.sessionService.sessionCode);
        }
    }

    
    endTurn(): void {
        if (this.isPlayerTurn) {
          this.socketService.endTurn(this.sessionService.sessionCode);
        }
    }
    
    getPlayerNameBySocketId(socketId: string): string {
      const player = this.sessionService.players.find(p => p.socketId === socketId);
      return player ? player.name : 'Joueur inconnu';
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

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }

    toggleActive() {
        this.isActive = !this.isActive;
    }
}
