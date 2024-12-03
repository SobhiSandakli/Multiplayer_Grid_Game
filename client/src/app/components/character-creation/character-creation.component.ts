import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BonusAttribute, DiceAttribute } from '@app/enums/attributes.enum';
import { CharacterCreatedResponse, CharacterInfo } from '@app/interfaces/attributes.interface';
import { CharacterCreatedData } from '@app/interfaces/socket.interface';
import { PlayerSocket } from '@app/services/player-socket/playerSocket.service';
import { SessionSocket } from '@app/services/session-socket/sessionSocket.service';
import { Subscription } from 'rxjs';
import { AVATARS, INITIAL_ATTRIBUTES, MAX_LENGTH_NAME } from 'src/constants/avatars-constants';
import { SNACK_BAR_DURATION } from 'src/constants/players-constants';
import { ValidationErrorType } from 'src/constants/validate-constants';
@Component({
    selector: 'app-character-creation',
    templateUrl: './character-creation.component.html',
    styleUrls: ['./character-creation.component.scss'],
})
export class CharacterCreationComponent implements OnDestroy, OnInit {
    @Input() isCreatingGame: boolean;
    @Input() gameId: string | null = null;
    @Input() sessionCode: string | null = null;
    @Output() characterCreated = new EventEmitter<CharacterInfo>();
    @Output() backToGameSelection = new EventEmitter<void>();

    bonusAttribute = BonusAttribute;
    diceAttribute = DiceAttribute;
    availableAvatars: string[] = AVATARS;

    characterForm: FormGroup;
    showReturnPopup = false;
    showCreationPopup = false;
    attributes = INITIAL_ATTRIBUTES;

    private subscriptions: Subscription = new Subscription();
    private hasJoinedSession: boolean = false;
    private takenAvatars: string[] = [];

    constructor(
        private router: Router,
        private fb: FormBuilder,
        private playerSocket: PlayerSocket,
        private snackBar: MatSnackBar,
        private sessionSocket: SessionSocket,
    ) {
        this.characterForm = this.createForm();
    }

    ngOnInit(): void {
        this.fetchTakenAvatars();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    onCreationConfirm(): void {
        this.showCreationPopup = false;
        const name = this.characterForm.get('characterName')?.value || '';
        if (name.trim().length === 0) {
            this.nameValidator(ValidationErrorType.WhitespaceOnlyName);
        } else if (this.characterForm.valid && this.isCharacterNameValid() && this.validateCharacterData()) {
            this.handleCharacterCreated();
            if (this.sessionCode) {
                this.playerSocket.createCharacter(this.sessionCode, this.createCharacterData());
            }
        }
    }

    onCreationCancel(): void {
        this.showCreationPopup = false;
    }

    openCreationPopup(): void {
        this.showCreationPopup = true;
    }

    openReturnPopup(): void {
        this.showReturnPopup = true;
    }

    onReturnConfirm(): void {
        this.showReturnPopup = false;
        this.leaveSession();
        this.backToGameSelection.emit();
    }

    onReturnCancel(): void {
        this.showReturnPopup = false;
    }
    selectAttribute(attribute: BonusAttribute | DiceAttribute): void {
        if (this.isBonusAttribute(attribute)) {
            this.updateBonusAttribute(attribute as BonusAttribute);
        } else {
            this.updateDiceAttribute(attribute as DiceAttribute);
        }
    }
    selectAvatar(avatar: string): void {
        if (!this.isAvatarTaken(avatar)) {
            this.characterForm.patchValue({ selectedAvatar: avatar });
        }
    }
    isAvatarTaken(avatar: string): boolean {
        return this.takenAvatars.includes(avatar);
    }

    private isCharacterNameValid(): boolean {
        const name = this.characterForm.get('characterName')?.value || '';
        return typeof name === 'string' && name.trim().length > 0;
    }
    private createForm(): FormGroup {
        return this.fb.group({
            characterName: ['', [Validators.required, Validators.maxLength(MAX_LENGTH_NAME)]],
            selectedAvatar: [null, Validators.required],
            bonusAttribute: [null, Validators.required],
            diceAttribute: [null, Validators.required],
        });
    }

    private isBonusAttribute(attribute: BonusAttribute | DiceAttribute): boolean {
        return attribute === BonusAttribute.Life || attribute === BonusAttribute.Speed;
    }

    private updateBonusAttribute(attribute: BonusAttribute): void {
        Object.keys(this.attributes).forEach((attr) => {
            this.attributes[attr].currentValue = attr === attribute ? this.attributes[attr].baseValue + 2 : this.attributes[attr].baseValue;
        });
        this.characterForm.patchValue({ bonusAttribute: attribute });
    }

    private updateDiceAttribute(attribute: DiceAttribute): void {
        this.attributes.attack.dice = attribute === DiceAttribute.Attack ? 'D6' : 'D4';
        this.attributes.defence.dice = attribute === DiceAttribute.Defence ? 'D6' : 'D4';
        this.characterForm.patchValue({ diceAttribute: attribute });
    }

    private leaveSession(): void {
        if (this.hasJoinedSession) {
            if (this.isCreatingGame && this.sessionCode) {
                this.sessionSocket.deleteSession(this.sessionCode);
            } else if (this.sessionCode) {
                this.sessionSocket.leaveSession(this.sessionCode);
            }
        }
    }

    private fetchTakenAvatars(): void {
        if (this.sessionCode) {
            const avatarSub = this.playerSocket.getTakenAvatars(this.sessionCode).subscribe(
                (data) => (this.takenAvatars = data.takenAvatars),
                (error) => this.handleValidationFailure('Erreur lors de la récupération des avatars: ' + error),
            );
            this.subscriptions.add(avatarSub);
        } else {
            this.handleValidationFailure('Session Code is null or undefined.');
        }
    }

    private handleCharacterCreated(): void {
        const characterCreatedSub = this.playerSocket.onCharacterCreated().subscribe((data: CharacterCreatedData & { gameId: string }) => {
            if (data.name && data.sessionCode && data.gameId) {
                this.updateCharacterName(data);
                this.updateSessionCode(data);
                this.gameId = data.gameId;
                this.hasJoinedSession = true;

                this.router.navigate(['/waiting'], {
                    queryParams: { sessionCode: this.sessionCode, gameId: this.gameId },
                });

                this.characterCreated.emit(data);
            }
        });
        this.subscriptions.add(characterCreatedSub);
    }

    private updateCharacterName(data: CharacterCreatedResponse): void {
        if (data.name !== this.characterForm.value.characterName) {
            this.characterForm.patchValue({ characterName: data.name });
            this.openSnackBar(`Le nom était déjà pris. Votre nom a été modifié en : ${data.name}`);
        }
    }

    private updateSessionCode(data: CharacterCreatedResponse): void {
        if (!this.sessionCode) {
            this.sessionCode = data.sessionCode;
        }
    }

    private validateCharacterData(): boolean {
        if (!this.sessionCode) {
            this.handleValidationFailure('Session Code is null or undefined.');
            return false;
        }
        return true;
    }

    private openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: SNACK_BAR_DURATION,
            panelClass: ['custom-snackbar'],
        });
    }
    private nameValidator(errorType: ValidationErrorType): void {
        let errorMessage = '';
        switch (errorType) {
            case ValidationErrorType.WhitespaceOnlyName:
                errorMessage = 'Le nom du personnage ne peut pas contenir uniquement des espaces.';
                break;
        }
        this.openSnackBar(errorMessage);
    }

    private handleValidationFailure(errorMessage: string): void {
        this.openSnackBar(errorMessage);
    }

    private createCharacterData(): CharacterInfo {
        return {
            name: this.characterForm.value.characterName,
            avatar: this.characterForm.value.selectedAvatar,
            attributes: this.attributes,
        };
    }
}
