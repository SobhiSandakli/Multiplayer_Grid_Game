import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CharacterCreationComponent } from '@app/components/character-creation/character-creation.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { Game } from '@app/interfaces/game.interface';

@Component({
    selector: 'app-create-page',
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, GameListComponent, CharacterCreationComponent],
})
export class CreatePageComponent {
    games: Game[] = [
        { name: 'Jeu 1', size: '20x20', mode: 'Capture the Flag' },
        { name: 'Jeu 2', size: '30x30', mode: 'Normal' },
        { name: 'Jeu 3', size: '40x40', mode: 'Normal' },
    ];
    selectedGame: string | null = null;
    showCharacterCreation: boolean = false;

    onGameSelected(gameName: string | null) {
        this.selectedGame = gameName;
    }

    enableValidation(): boolean {
        return this.selectedGame !== null;
    }

    showCharacterCreationForm() {
        if (this.enableValidation()) {
            this.showCharacterCreation = true;
        }
    }

    onCharacterCreated() {}

    onBackToGameSelection() {
        this.showCharacterCreation = false;
        this.selectedGame = null;
    }
}
