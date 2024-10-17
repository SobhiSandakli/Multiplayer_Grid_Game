import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BonusAttribute, DiceAttribute } from '@app/enums/attributes.enum';
import { Attribute } from '@app/interfaces/attributes.interface';
import { SocketService } from '@app/services/socket/socket.service';
import { Subscription } from 'rxjs';
import { AVATARS, MAX_LENGTH_NAME } from 'src/constants/avatars-constants';

@Component({
    selector: 'app-character-creation',
    templateUrl: './character-creation.component.html',
    styleUrls: ['./character-creation.component.scss'],
})
export class CharacterCreationComponent implements OnDestroy, OnInit {
    // ATTRIBUTES
    @Input() isCreatingGame: boolean;
    @Input() gameName: string = '';
    @Input() sessionCode: string | null = null;
    @Output() characterCreated = new EventEmitter<{ name: string; avatar: string; attributes: unknown }>();
    @Output() backToGameSelection = new EventEmitter<void>();

    availableAvatars = AVATARS;
    characterForm: FormGroup;
    private subscriptions: Subscription = new Subscription();
    showReturnPopup = false;
    showCreationPopup = false;
    selectedAvatar: string | null = null;
    hasJoinedSession: boolean = false;
    private takenAvatars: string[] = []; // Les avatars déjà choisis
    BonusAttribute = BonusAttribute;
    DiceAttribute = DiceAttribute;

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

    // METHODS
    constructor(
        private router: Router,
        private fb: FormBuilder,
        private socketService: SocketService,
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
                (data: any) => {
                    this.takenAvatars = data.takenAvatars;
                    console.log('Avatars déjà pris:', this.takenAvatars);
                    console.log('Liste des joueurs dans la session:', data.players);
                },
                (error) => {
                    console.error('Erreur lors de la récupération des avatars pris:', error);
                },
            );
        } else {
            console.error('Session Code is null or undefined.');
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

        if (this.characterForm.valid) {
            const characterData = {
                name: this.characterForm.value.characterName,
                avatar: this.characterForm.value.selectedAvatar,
                attributes: this.attributes,
            };
            console.log('Character Data:', characterData); // FOR TESTS - TO REMOVE
            console.log('Using Session Code:', this.sessionCode); // FOR TESTS - TO REMOVE
            if (!this.sessionCode) {
                console.error('Session Code is null or undefined. Cannot create character.'); // FOR TESTS - TO REMOVE
                return;
            }

            // Envoyer les données du personnage au serveur avec le sessionCode
            this.socketService.createCharacter(this.sessionCode, characterData);

            // Écouter la confirmation de création du personnage
            const characterCreatedSub = this.socketService.onCharacterCreated().subscribe((data: any) => {
                console.log('Received characterCreated event:', data);
                if (data.name && data.sessionCode) {
                    // Mettre à jour le nom du personnage si modifié par le serveur
                    if (data.name !== this.characterForm.value.characterName) {
                        console.log(`Nom du personnage modifié par le serveur : ${data.name}`);
                        this.characterForm.patchValue({ characterName: data.name });
                        alert(`Le nom était déjà pris. Votre nom a été modifié en : ${data.name}`); // NOT SURE IF I CAN USE
                    }

                    // Mettre à jour le sessionCode si c'est une nouvelle session
                    if (!this.sessionCode) {
                        this.sessionCode = data.sessionCode;
                    }
                    this.hasJoinedSession = true;
                    this.router.navigate(['/waiting'], { queryParams: { sessionCode: this.sessionCode } });
                }
            });
            this.subscriptions.add(characterCreatedSub);
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
                // Supprimer la session uniquement si le joueur est l'organisateur et a rejoint la session
                if (this.sessionCode) {
                    this.socketService.deleteSession(this.sessionCode);
                }
            } else {
                // Quitter la session uniquement si le joueur a rejoint la session
                if (this.sessionCode) {
                    this.socketService.leaveSession(this.sessionCode);
                }
            }
        }
        this.backToGameSelection.emit(); // Retour à l'écran de sélection
    }

    onReturnCancel(): void {
        this.showReturnPopup = false;
    }
    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }
}
