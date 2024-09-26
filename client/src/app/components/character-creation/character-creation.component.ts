import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationPopupComponent } from '@app/components/confirmation-popup/confirmation-popup.component';
const MAX_LENGTH_NAME = 12;
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
    imports: [ConfirmationPopupComponent, CommonModule, FormsModule, ReactiveFormsModule, ConfirmationPopupComponent],
})
export class CharacterCreationComponent {
    @Input() gameName: string = '';
    @Output() characterCreated = new EventEmitter<{ name: string; avatar: string; attributes: unknown }>();
    @Output() backToGameSelection = new EventEmitter<void>();

    characterForm: FormGroup;
    showReturnPopup = false;
    showCreationPopup = false;
    selectedAvatar: string | null = null;
    availableAvatars: string[] = [
        'assets/avatars/av1.png',
        'assets/avatars/av2.png',
        'assets/avatars/av3.png',
        'assets/avatars/av4.png',
        'assets/avatars/av5.png',
        'assets/avatars/av6.png',
        'assets/avatars/av7.png',
        'assets/avatars/av8.png',
        'assets/avatars/av9.png',
        'assets/avatars/av10.png',
        'assets/avatars/av11.png',
        'assets/avatars/av12.png',
    ];

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

    bonusAttribute: 'life' | 'speed' | null = null;
    diceAttribute: 'attack' | 'defense' | null = null;
    constructor(
        private router: Router,
        private fb: FormBuilder,
    ) {
        // form creation
        this.characterForm = this.fb.group({
            characterName: ['', [Validators.required, Validators.maxLength(MAX_LENGTH_NAME)]],
            selectedAvatar: [null, Validators.required],
            bonusAttribute: [null, Validators.required],
            diceAttribute: [null, Validators.required],
        });
    }

    selectAvatar(avatar: string) {
        this.characterForm.patchValue({ selectedAvatar: avatar });
    }

    selectAttribute(attribute: 'life' | 'speed' | 'attack' | 'defense') {
        // manage bonus
        Object.keys(this.attributes).forEach((attr) => {
            if (attr === attribute && (attribute === 'life' || attribute === 'speed')) {
                this.attributes[attr].currentValue = this.attributes[attr].baseValue + 2;
                this.characterForm.patchValue({ bonusAttribute: attribute });
            } else if (attribute === 'life' || attribute === 'speed') {
                this.attributes[attr as keyof typeof this.attributes].currentValue = this.attributes[attr as keyof typeof this.attributes].baseValue;
            }
        });

        // manage dice
        if (attribute === 'attack') {
            this.attributes.attack.dice = 'D6';
            this.attributes.defense.dice = 'D4';
            this.characterForm.patchValue({ diceAttribute: 'attack' });
        } else if (attribute === 'defense') {
            this.attributes.attack.dice = 'D4';
            this.attributes.defense.dice = 'D6';
            this.characterForm.patchValue({ diceAttribute: 'defense' });
        }
    }

    onCreationConfirm(): void {
        this.showCreationPopup = false;

        if (this.characterForm.valid) {
            this.characterCreated.emit({
                name: this.characterForm.value.characterName,
                avatar: this.characterForm.value.selectedAvatar,
                attributes: this.attributes,
            });
            this.router.navigate(['/waiting']);
        }
    }

    onCreationCancel(): void {
        this.showCreationPopup = false;
    }

    openReturnPopup(): void {
        this.showReturnPopup = true;
    }

    openCreationPopup(): void {
        this.showCreationPopup = true;
    }

    onReturnConfirm(): void {
        this.showReturnPopup = false;
        this.backToGameSelection.emit();
    }

    onReturnCancel(): void {
        this.showReturnPopup = false;
    }
}
