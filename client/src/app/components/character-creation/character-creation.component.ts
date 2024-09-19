import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Attribute {
    name: string;
    description: string;
    baseValue: number;
    currentValue: number;
    dice?: string;
}

@Component({
    selector: 'app-character-creation',
    templateUrl: './character-creation.component.html',
    styleUrls: ['./character-creation.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule],
})
export class CharacterCreationComponent {
    @Input() gameName: string = '';
    @Output() characterCreated = new EventEmitter<{ name: string; avatar: string; attributes: any }>();
    @Output() backToGameSelection = new EventEmitter<void>();

    characterName: string = '';
    selectedAvatar: string | null = null;
    availableAvatars: string[] = ['assets/avatars/av1.png', 'assets/avatars/av2.png', 'assets/avatars/av3.png'];

    // Attributs
    attributes: { [key: string]: Attribute } = {
        life: {
            name: 'Vie',
            description: 'Points de vie du personnage.',
            baseValue: 4,
            currentValue: 4,
        },
        speed: {
            name: 'Rapidité',
            description: 'Vitesse du personnage.',
            baseValue: 4,
            currentValue: 4,
        },
        attack: {
            name: 'Attaque',
            description: 'Capacité offensive du personnage.',
            baseValue: 4,
            currentValue: 4,
            dice: '',
        },
        defense: {
            name: 'Défense',
            description: 'Capacité défensive du personnage.',
            baseValue: 4,
            currentValue: 4,
            dice: '',
        },
    };

    // Sélections de l'utilisateur
    bonusAttribute: 'life' | 'speed' | null = null;
    diceAttribute: 'attack' | 'defense' | null = null;

    selectAvatar(avatar: string) {
        this.selectedAvatar = avatar;
    }

    // Méthode pour gérer la sélection du bonus
    selectBonusAttribute(attribute: 'life' | 'speed') {
        this.bonusAttribute = attribute;
        // Réinitialiser les valeurs de base
        this.attributes['life'].currentValue = this.attributes['life'].baseValue;
        this.attributes['speed'].currentValue = this.attributes['speed'].baseValue;
        // Attribuer le bonus
        this.attributes[attribute].currentValue += 2;
    }

    // Méthode pour gérer la sélection du dé
    selectDiceAttribute(attribute: 'attack' | 'defense') {
        this.diceAttribute = attribute;
        if (attribute === 'attack') {
            this.attributes['attack'].dice = 'D6';
            this.attributes['defense'].dice = 'D4';
        } else {
            this.attributes['attack'].dice = 'D4';
            this.attributes['defense'].dice = 'D6';
        }
    }

    submitCharacter() {
        if (this.characterName && this.selectedAvatar && this.bonusAttribute && this.diceAttribute) {
            this.characterCreated.emit({
                name: this.characterName,
                avatar: this.selectedAvatar,
                attributes: this.attributes,
            });
        } else {
            console.log('Veuillez remplir tous les champs.');
        }
    }

    goBack() {
        this.backToGameSelection.emit();
    }
}
