import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '@app/services/game.service';

interface GameOption {
    value: string;
    label: string;
}

@Component({
    selector: 'app-game-modal',
    templateUrl: './game-modal.component.html',
    styleUrls: ['./game-modal.component.scss'],
})
export class GameSetupModalComponent {
    @Output() closeModalEvent = new EventEmitter<void>();

    selectedMode: string = '';
    selectedSize: string = '';

    gameModes: GameOption[] = [
        { value: 'classique', label: 'Classique' },
        { value: 'captureTheFlag', label: 'Capture the Flag' },
    ];

    mapSizes: GameOption[] = [
        { value: 'small', label: 'Petite (10x10)' },
        { value: 'medium', label: 'Moyenne (15x15)' },
        { value: 'large', label: 'Grande (20x20)' },
    ];
    // Added the CTF mode selected property for the sprint 1
    isCTFModeSelected: boolean = false;
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
