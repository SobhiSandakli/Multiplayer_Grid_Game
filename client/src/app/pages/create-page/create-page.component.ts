import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-create-character',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
})
export class CreatePageComponent {
    games = [
        { name: 'Jeu 1', size: '20x20', mode: 'Capture the Flag' },
        { name: 'Jeu 2', size: '30x30', mode: 'Deathmatch' },
        { name: 'Jeu 3', size: '40x40', mode: 'Team Battle' },
    ];

    avatars = Array.from({ length: 8 }, (_, index) => `avatar-${index + 1}`);

    selectedGame: string | null = null;
    selectedAvatar: string | null = null;
    showCharacterCreation = false;

    attributes = {
        life: 4,
        speed: 4,
        attack: 4,
        defense: 4,
    };

    bonusAttribute: 'life' | 'speed' | null = null;
    attackDie: 'D4' | 'D6' | null = null;
    defenseDie: 'D4' | 'D6' | null = null;

    validateGameSelection(gameName: string) {
        if (this.selectedGame === gameName) {
            this.selectedGame = null;
            this.showCharacterCreation = false;
        } else {
            this.selectedGame = gameName;
            this.showCharacterCreation = false;
        }
    }

    isSelected(gameName: string): boolean {
        return this.selectedGame === gameName;
    }

    selectAvatar(avatarName: string) {
        this.selectedAvatar = avatarName;
    }

    isAvatarSelected(avatarName: string): boolean {
        return this.selectedAvatar === avatarName;
    }

    setBonusAttribute(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.bonusAttribute = selectElement.value as 'life' | 'speed';
    }

    setAttackDie(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.attackDie = selectElement.value as 'D4' | 'D6';
    }

    setDefenseDie(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.defenseDie = selectElement.value as 'D4' | 'D6';
    }

    enableValidation(): boolean {
        return this.selectedGame !== null;
    }

    submitCharacter() {
        console.log('Personnage créé :', {
            avatar: this.selectedAvatar,
            game: this.selectedGame,
            attributes: this.attributes,
            bonus: this.bonusAttribute,
            attackDie: this.attackDie,
            defenseDie: this.defenseDie,
        });
    }

    showCharacterCreationForm() {
        this.showCharacterCreation = true;
    }
}
