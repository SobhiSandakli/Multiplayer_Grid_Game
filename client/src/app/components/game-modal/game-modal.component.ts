import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '@app/services/game/game.service';
import { GAME_MODES, MAP_SIZES } from 'src/constants/game-constants';

@Component({
    selector: 'app-game-modal',
    templateUrl: './game-modal.component.html',
    styleUrls: ['./game-modal.component.scss'],
})
export class GameSetupModalComponent {
    @Output() closeModalEvent = new EventEmitter<void>();

    selectedMode: string = '';
    selectedSize: string = '';
    mapSizes = MAP_SIZES;
    gameModes = GAME_MODES;

    constructor(
        private router: Router,
        private gameService: GameService,
    ) {}

    startGameCreation(): void {
        if (!this.selectedMode || !this.selectedSize) {
            alert('Veuillez sélectionner le mode et la taille de la carte.');
            return;
        }
        this.gameService.setGameConfig({ mode: this.selectedMode, size: this.selectedSize });

        this.router.navigate(['/edit-page'], {
            queryParams: { mode: this.selectedMode, size: this.selectedSize },
        });

        this.emitCloseEvent();
        this.gameService.getGameConfig();
    }

    emitCloseEvent(): void {
        this.closeModalEvent.emit();
    }
}
