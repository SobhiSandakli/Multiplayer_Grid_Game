import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SocketService } from '@app/services/socket/socket.service';
import { AVATARS, BonusAttribute, DiceAttribute, INITIAL_ATTRIBUTES, MAX_LENGTH_NAME } from 'src/constants/avatars-constants';
import { CharacterInfo } from '@app/interfaces/attributes.interface';

@Component({
    selector: 'app-character-creation',
    templateUrl: './character-creation.component.html',
    styleUrls: ['./character-creation.component.scss'],
})
export class CharacterCreationComponent implements OnDestroy, OnInit {
    @Input() isCreatingGame: boolean;
    @Input() gameName: string = '';
    @Input() sessionCode: string | null = null;
    @Output() characterCreated = new EventEmitter<CharacterInfo>();
    @Output() backToGameSelection = new EventEmitter<void>();

    availableAvatars: string[] = AVATARS;
    bonusAttribute = BonusAttribute;
    diceAttribute = DiceAttribute;
    characterForm: FormGroup;
    showReturnPopup = false;
    showCreationPopup = false;
    selectedAvatar: string | null = null;
    attributes = INITIAL_ATTRIBUTES;
    private hasJoinedSession: boolean = false;
    private takenAvatars: string[] = [];
    private subscriptions: Subscription = new Subscription();

    constructor(
        private router: Router,
        private fb: FormBuilder,
        private socketService: SocketService,
        private snackBar: MatSnackBar,
    ) {
        this.characterForm = this.fb.group({
            characterName: ['', [Validators.required, Validators.maxLength(MAX_LENGTH_NAME)]],
            selectedAvatar: [null, Validators.required],
            bonusAttribute: [null, Validators.required],
            diceAttribute: [null, Validators.required],
        });
    }
    ngOnInit(): void {
        if (this.sessionCode) {
            this.socketService.getTakenAvatars(this.sessionCode).subscribe(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (data: any) => {
                    this.takenAvatars = data.takenAvatars;
                },
                (error) => {
                    this.handleValidationFailure('Erreur lors de la récupération des avatars déjà pris: ' + error);
                },
            );
        } else {
            this.handleValidationFailure('Session Code is null or undefined. Cannot get taken avatars.');
        }
    }

    selectAvatar(avatar: string) {
        if (!this.isAvatarTaken(avatar)) {
            this.characterForm.patchValue({ selectedAvatar: avatar });
        }
    }

    isAvatarTaken(avatar: string): boolean {
        return this.takenAvatars.includes(avatar);
    }

    selectAttribute(attribute: BonusAttribute | DiceAttribute) {
        if (attribute === BonusAttribute.Life || attribute === BonusAttribute.Speed) {
            Object.keys(this.attributes).forEach((attr) => {
                if (attr === attribute) {
                    this.attributes[attr].currentValue = this.attributes[attr].baseValue + 2;
                    this.characterForm.patchValue({ bonusAttribute: attribute });
                } else {
                    this.attributes[attr as keyof typeof this.attributes].currentValue =
                        this.attributes[attr as keyof typeof this.attributes].baseValue;
                }
            });
        } else if (attribute === DiceAttribute.Attack) {
            this.attributes.attack.dice = 'D6';
            this.attributes.defence.dice = 'D4';
            this.characterForm.patchValue({ diceAttribute: DiceAttribute.Attack });
        } else if (attribute === DiceAttribute.Defence) {
            this.attributes.attack.dice = 'D4';
            this.attributes.defence.dice = 'D6';
            this.characterForm.patchValue({ diceAttribute: DiceAttribute.Defence });
        }
    }

    onCreationConfirm(): void {
        this.showCreationPopup = false;

        if (this.characterForm.valid && this.validateCharacterData()) {
            const characterData = this.createCharacterData();
            this.socketService.createCharacter(this.sessionCode!, characterData);
            this.handleCharacterCreated();
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

        if (this.hasJoinedSession) {
            if (this.isCreatingGame) {
                if (this.sessionCode) {
                    this.socketService.deleteSession(this.sessionCode);
                }
            } else {
                if (this.sessionCode) {
                    this.socketService.leaveSession(this.sessionCode);
                }
            }
        }
        this.backToGameSelection.emit();
    }

    onReturnCancel(): void {
        this.showReturnPopup = false;
    }
    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private handleCharacterCreated(): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const characterCreatedSub = this.socketService.onCharacterCreated().subscribe((data: any) => {
            if (data.name && data.sessionCode) {
                this.updateCharacterName(data);
                this.updateSessionCode(data);
                this.hasJoinedSession = true;
                this.router.navigate(['/waiting'], { queryParams: { sessionCode: this.sessionCode } });
            }
        });
        this.subscriptions.add(characterCreatedSub);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private updateCharacterName(data: any): void {
        if (data.name !== this.characterForm.value.characterName) {
            this.characterForm.patchValue({ characterName: data.name });
            this.openSnackBar(`Le nom était déjà pris. Votre nom a été modifié en : ${data.name}`);
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private updateSessionCode(data: any): void {
        if (!this.sessionCode) {
            this.sessionCode = data.sessionCode;
        }
    }
    private createCharacterData(): CharacterInfo {
        return {
            name: this.characterForm.value.characterName,
            avatar: this.characterForm.value.selectedAvatar,
            attributes: this.attributes,
        };
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
            duration: 5000,
            panelClass: ['custom-snackbar'],
        });
    }

    private handleValidationFailure(errorMessage: string): void {
        this.openSnackBar(errorMessage);
    }
}
