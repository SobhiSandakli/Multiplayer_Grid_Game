import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

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

    constructor(private router: Router) {}

    startGameCreation(): void {
        if (!this.selectedMode || !this.selectedSize) {
            alert('Veuillez sélectionner le mode et la taille de la carte.');
            return;
        }

        this.router.navigate(['/edit-page'], {
            queryParams: { mode: this.selectedMode, size: this.selectedSize },
        });

        this.emitCloseEvent();
    }

    emitCloseEvent(): void {
        this.closeModalEvent.emit();
    }
}
