import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

interface GameOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-game-setup-modal',
  templateUrl: './game-setup-modal.component.html',
  styleUrls: ['./game-setup-modal.component.scss']
})
export class GameSetupModalComponent {
  selectedMode: string = '';
  selectedSize: string = '';
  gameModes: GameOption[] = [
    { value: 'classique', label: 'Classique' },
    { value: 'captureTheFlag', label: 'Capture the Flag' }
  ];

  mapSizes: GameOption[] = [
    { value: 'small', label: 'Petite (10x10)' },
    { value: 'medium', label: 'Moyenne (15x15)' },
    { value: 'large', label: 'Grande (20x20)' }
  ];

  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  startGameCreation(): void {
    if (!this.selectedMode || !this.selectedSize) {
      alert('Veuillez sélectionner le mode et la taille de la carte.');
      return;
    }

    // Navigate to the edit page with selected parameters
    this.router.navigate(['/edit-page'], {
      queryParams: { mode: this.selectedMode, size: this.selectedSize }
    });

    this.closeModal();
  }

  closeModal(): void {
    this.close.emit();
  }
}
