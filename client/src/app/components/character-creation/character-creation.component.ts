import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-character-creation',
    templateUrl: './character-creation.component.html',
    styleUrls: ['./character-creation.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule],
})
export class CharacterCreationComponent {
    @Output() characterCreated = new EventEmitter<{ name: string; avatar: string }>();
    @Output() backToGameSelection = new EventEmitter<void>();

    characterName: string = '';
    selectedAvatar: string | null = null;
    availableAvatars: string[] = ['assets/avatars/av1.png', 'assets/avatars/av2.png', 'assets/avatars/av3.png'];

    selectAvatar(avatar: string) {
        this.selectedAvatar = avatar;
    }

    submitCharacter() {
        if (this.characterName && this.selectedAvatar) {
            this.characterCreated.emit({
                name: this.characterName,
                avatar: this.selectedAvatar,
            });
        } else {
            console.log('Veuillez remplir tous les champs.');
        }
    }

    goBack() {
        this.backToGameSelection.emit();
    }
}
