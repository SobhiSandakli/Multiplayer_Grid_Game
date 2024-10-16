import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AVATARS, MAX_LENGTH_NAME } from 'src/constants/avatars-constants';
import { Attribute } from '../../interfaces/attributes.interface';

@Component({
    selector: 'app-character-creation',
    templateUrl: './character-creation.component.html',
    styleUrls: ['./character-creation.component.scss'],
})
export class CharacterCreationComponent {
    @Input() gameName: string = '';
    @Output() characterCreated = new EventEmitter<{ name: string; avatar: string; attributes: unknown }>();
    @Output() backToGameSelection = new EventEmitter<void>();

    avatars = AVATARS;
    characterForm: FormGroup;
    showReturnPopup = false;
    showCreationPopup = false;
    selectedAvatar: string | null = null;

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
        defence: {
            name: 'Défense',
            description: 'Capacité défensive du personnage.',
            baseValue: 4,
            currentValue: 4,
            dice: '',
        },
    };

    bonusAttribute: 'life' | 'speed' | null = null;
    diceAttribute: 'attack' | 'defence' | null = null;
    constructor(
        private router: Router,
        private fb: FormBuilder,
    ) {
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

    selectAttribute(attribute: 'life' | 'speed' | 'attack' | 'defence') {
        Object.keys(this.attributes).forEach((attr) => {
            if (attr === attribute && (attribute === 'life' || attribute === 'speed')) {
                this.attributes[attr].currentValue = this.attributes[attr].baseValue + 2;
                this.characterForm.patchValue({ bonusAttribute: attribute });
            } else if (attribute === 'life' || attribute === 'speed') {
                this.attributes[attr as keyof typeof this.attributes].currentValue = this.attributes[attr as keyof typeof this.attributes].baseValue;
            }
        });

        if (attribute === 'attack') {
            this.attributes.attack.dice = 'D6';
            this.attributes.defence.dice = 'D4';
            this.characterForm.patchValue({ diceAttribute: 'attack' });
        } else if (attribute === 'defence') {
            this.attributes.attack.dice = 'D4';
            this.attributes.defence.dice = 'D6';
            this.characterForm.patchValue({ diceAttribute: 'defence' });
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
