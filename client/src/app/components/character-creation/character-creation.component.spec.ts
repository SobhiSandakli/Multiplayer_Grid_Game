/* eslint-disable max-lines */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { BonusAttribute, DiceAttribute } from '@app/enums/attributes.enum';
import { AppMaterialModule } from '@app/modules/material.module';
import { SocketService } from '@app/services/socket/socket.service';
import { of, Subject } from 'rxjs';
import { ValidationErrorType } from 'src/constants/validate-constants';
import { CharacterCreationComponent } from './character-creation.component';

class MockSocketService {
    private takenAvatarsSubject = new Subject<{ takenAvatars: string[] }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private characterCreatedSubject = new Subject<any>();
    createCharacter(sessionCode: string, characterData: any) {}

    getTakenAvatars(sessionCode: string) {
        return this.takenAvatarsSubject.asObservable();
    }

    onCharacterCreated() {
        return this.characterCreatedSubject.asObservable();
    }

    deleteSession(sessionCode: string) {}

    leaveSession(sessionCode: string) {}

    triggerTakenAvatars(takenAvatars: string[]) {
        this.takenAvatarsSubject.next({ takenAvatars });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    triggerCharacterCreated(data: any) {
        this.characterCreatedSubject.next(data);
    }
}

class MockMatSnackBar {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    open(message: string, action: string, config: any) {}
}

class MockRouter {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate(commands: any[], extras?: any) {}
}

describe('CharacterCreationComponent', () => {
    let component: CharacterCreationComponent;
    let fixture: ComponentFixture<CharacterCreationComponent>;
    let socketService: MockSocketService;
    let router: MockRouter;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CharacterCreationComponent],
            imports: [ReactiveFormsModule, AppMaterialModule, BrowserAnimationsModule],
            providers: [
                FormBuilder,
                { provide: SocketService, useClass: MockSocketService },
                { provide: MatSnackBar, useClass: MockMatSnackBar },
                { provide: Router, useClass: MockRouter },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CharacterCreationComponent);
        component = fixture.componentInstance;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socketService = TestBed.inject(SocketService) as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router = TestBed.inject(Router) as any;
        component.sessionCode = 'testSessionCode';

        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });
    it('should fetch taken avatars on initialization if sessionCode exists', () => {
        component.sessionCode = 'testSessionCode';
        spyOn(socketService, 'getTakenAvatars').and.returnValue(of({ takenAvatars: ['avatar1.png'] }));
        component.ngOnInit();

        expect(socketService.getTakenAvatars).toHaveBeenCalledWith('testSessionCode');
        expect(component['takenAvatars']).toEqual(['avatar1.png']);
    });
    it('should handle validation failure if sessionCode is null on initialization', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'handleValidationFailure');
        component.sessionCode = null;
        component.ngOnInit();

        expect(component['handleValidationFailure']).toHaveBeenCalledWith('Session Code is null or undefined.');
    });
    it('should unsubscribe from subscriptions on ngOnDestroy', () => {
        spyOn(component['subscriptions'], 'unsubscribe');
        component.ngOnDestroy();
        expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
    });
    it('should set selectedAvatar when selectAvatar is called with an available avatar', () => {
        component['takenAvatars'] = ['avatar1.png'];
        const availableAvatar = 'avatar2.png';

        component.selectAvatar(availableAvatar);
        expect(component.characterForm.get('selectedAvatar')?.value).toEqual(availableAvatar);
    });

    it('should not set selectedAvatar when selectAvatar is called with a taken avatar', () => {
        component['takenAvatars'] = ['avatar1.png'];
        component.selectAvatar('avatar1.png');
        expect(component.characterForm.get('selectedAvatar')?.value).toBeNull();
    });
    it('should update bonusAttribute and attributes when selecting a BonusAttribute', () => {
        component.selectAttribute(BonusAttribute.Life);

        expect(component.characterForm.get('bonusAttribute')?.value).toEqual(BonusAttribute.Life);
        expect(component.attributes.life.currentValue).toEqual(component.attributes.life.baseValue + 2);
        expect(component.attributes.speed.currentValue).toEqual(component.attributes.speed.baseValue);
    });
    it('should update diceAttribute and attributes when selecting a DiceAttribute', () => {
        component.selectAttribute(DiceAttribute.Attack);

        expect(component.characterForm.get('diceAttribute')?.value).toEqual(DiceAttribute.Attack);
        expect(component.attributes.attack.dice).toEqual('D6');
        expect(component.attributes.defence.dice).toEqual('D4');
    });
    it('should not create character when character name is invalid (whitespace only)', () => {
        component.characterForm.setValue({
            characterName: '   ',
            selectedAvatar: 'avatar.png',
            bonusAttribute: BonusAttribute.Life,
            diceAttribute: DiceAttribute.Attack,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'nameValidator');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'isCharacterNameValid').and.callThrough();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'validateCharacterData');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'handleCharacterCreated');
        spyOn(socketService, 'createCharacter');

        component.onCreationConfirm();

        expect(component['nameValidator']).toHaveBeenCalledWith(ValidationErrorType.WhitespaceOnlyName);
        expect(component['isCharacterNameValid']).not.toHaveBeenCalled();
        expect(component['validateCharacterData']).not.toHaveBeenCalled();
        expect(component['handleCharacterCreated']).not.toHaveBeenCalled();
        expect(socketService.createCharacter).not.toHaveBeenCalled();
    });
    it('should proceed and create character if form is valid and character data is valid', () => {
        component.sessionCode = 'testSessionCode';
        component.characterForm.patchValue({
            characterName: 'Valid Name',
            selectedAvatar: 'avatar.png',
            bonusAttribute: BonusAttribute.Life,
            diceAttribute: DiceAttribute.Attack,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'isCharacterNameValid').and.returnValue(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'validateCharacterData').and.returnValue(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'handleCharacterCreated');
        spyOn(socketService, 'createCharacter');

        component.onCreationConfirm();

        expect(component['isCharacterNameValid']).toHaveBeenCalled();
        expect(component['validateCharacterData']).toHaveBeenCalled();
        expect(component['handleCharacterCreated']).toHaveBeenCalled();
        expect(socketService.createCharacter).toHaveBeenCalledWith('testSessionCode', jasmine.any(Object));
    });

    it('should not create character when form is invalid', () => {
        component.characterForm.setValue({
            characterName: '',
            selectedAvatar: null,
            bonusAttribute: null,
            diceAttribute: null,
        });

        spyOn(socketService, 'createCharacter');
        component.onCreationConfirm();

        expect(socketService.createCharacter).not.toHaveBeenCalled();
    });
    it('should update character name and show snackbar if name is already taken', () => {
        component.characterForm.patchValue({
            characterName: 'Test Character',
            selectedAvatar: 'avatar.png',
            bonusAttribute: BonusAttribute.Life,
            diceAttribute: DiceAttribute.Attack,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'openSnackBar');

        component['updateCharacterName']({
            name: 'New Name',
            sessionCode: '',
        });

        expect(component.characterForm.get('characterName')?.value).toEqual('New Name');
        expect(component['openSnackBar']).toHaveBeenCalledWith('Le nom était déjà pris. Votre nom a été modifié en : New Name');
    });
    it('should update sessionCode, gameId and navigate to /waiting on character creation', () => {
        component.sessionCode = null;
        component.gameId = null;
        spyOn(router, 'navigate');
        spyOn(component.characterCreated, 'emit');

        component['handleCharacterCreated']();
        socketService.triggerCharacterCreated({
            name: 'Test Character',
            sessionCode: 'newSessionCode',
            gameId: 'newGameId',
        });

        expect(component.sessionCode!).toEqual('newSessionCode');
        expect(component.gameId!).toEqual('newGameId');
        expect(router.navigate).toHaveBeenCalledWith(['/waiting'], {
            queryParams: { sessionCode: 'newSessionCode', gameId: 'newGameId' },
        });
        expect(component.characterCreated.emit).toHaveBeenCalledWith(jasmine.any(Object));
    });
    it('should open creation popup', () => {
        component.showCreationPopup = false;
        component.openCreationPopup();
        expect(component.showCreationPopup).toBeTrue();
    });

    it('should close creation popup on cancel', () => {
        component.showCreationPopup = true;
        component.onCreationCancel();
        expect(component.showCreationPopup).toBeFalse();
    });
    it('should open snackbar with error message on validation failure', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'openSnackBar');
        component['handleValidationFailure']('Test error message');

        expect(component['openSnackBar']).toHaveBeenCalledWith('Test error message');
    });
    it('should handle validation failure if sessionCode is null during character data validation', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'handleValidationFailure');
        component.sessionCode = null;
        const result = component['validateCharacterData']();

        expect(result).toBeFalse();
        expect(component['handleValidationFailure']).toHaveBeenCalledWith('Session Code is null or undefined.');
    });
    it('should open snackbar with correct message when nameValidator is called with WhitespaceOnlyName error', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'openSnackBar');
        component['nameValidator'](ValidationErrorType.WhitespaceOnlyName);

        expect(component['openSnackBar']).toHaveBeenCalledWith('Le nom du personnage ne peut pas contenir uniquement des espaces.');
    });
    it('should open return popup', () => {
        component.showReturnPopup = false;
        component.openReturnPopup();
        expect(component.showReturnPopup).toBeTrue();
    });

    it('should close return popup on cancel', () => {
        component.showReturnPopup = true;
        component.onReturnCancel();
        expect(component.showReturnPopup).toBeFalse();
    });
    it('should leave session and emit backToGameSelection on return confirm', () => {
        spyOn(component.backToGameSelection, 'emit');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'leaveSession');

        component.onReturnConfirm();

        expect(component['leaveSession']).toHaveBeenCalled();
        expect(component.backToGameSelection.emit).toHaveBeenCalled();
    });
    it('should delete session when leaving and isCreatingGame is true', () => {
        component['hasJoinedSession'] = true;
        component.isCreatingGame = true;
        component.sessionCode = 'testSessionCode';
        spyOn(socketService, 'deleteSession');

        component['leaveSession']();

        expect(socketService.deleteSession).toHaveBeenCalledWith('testSessionCode');
    });
    it('should leave session when leaving and isCreatingGame is false', () => {
        component['hasJoinedSession'] = true;
        component.isCreatingGame = false;
        component.sessionCode = 'testSessionCode';
        spyOn(socketService, 'leaveSession');

        component['leaveSession']();

        expect(socketService.leaveSession).toHaveBeenCalledWith('testSessionCode');
    });
    it('should not call leaveSession or deleteSession when hasJoinedSession is false', () => {
        component['hasJoinedSession'] = false;
        spyOn(socketService, 'leaveSession');
        spyOn(socketService, 'deleteSession');

        component['leaveSession']();

        expect(socketService.leaveSession).not.toHaveBeenCalled();
        expect(socketService.deleteSession).not.toHaveBeenCalled();
    });
    it('should return true for a valid character name', () => {
        component.characterForm.patchValue({ characterName: 'Valid Name' });

        const result = component['isCharacterNameValid']();

        expect(result).toBeTrue();
    });
    it('should return false for an empty character name', () => {
        component.characterForm.patchValue({ characterName: '' });

        const result = component['isCharacterNameValid']();

        expect(result).toBeFalse();
    });
    it('should return false for a whitespace-only character name', () => {
        component.characterForm.patchValue({ characterName: '   ' });

        const result = component['isCharacterNameValid']();

        expect(result).toBeFalse();
    });
    it('should fetch taken avatars when sessionCode is provided', () => {
        component.sessionCode = 'testSessionCode';
        const avatars = ['avatar1.png', 'avatar2.png'];

        spyOn(socketService, 'getTakenAvatars').and.returnValue(of({ takenAvatars: avatars }));
        spyOn(component['subscriptions'], 'add');

        component['fetchTakenAvatars']();

        expect(socketService.getTakenAvatars).toHaveBeenCalledWith('testSessionCode');
        expect(component['takenAvatars']).toEqual(avatars);
        expect(component['subscriptions'].add).toHaveBeenCalled();
    });
    it('should handle validation failure when sessionCode is null', () => {
        component.sessionCode = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'handleValidationFailure');

        component['fetchTakenAvatars']();

        expect(component['handleValidationFailure']).toHaveBeenCalledWith('Session Code is null or undefined.');
    });
    it('should return false and handle validation failure when sessionCode is null', () => {
        component.sessionCode = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'handleValidationFailure');

        const result = component['validateCharacterData']();

        expect(result).toBeFalse();
        expect(component['handleValidationFailure']).toHaveBeenCalledWith('Session Code is null or undefined.');
    });
    it('should return true when sessionCode is provided', () => {
        component.sessionCode = 'testSessionCode';

        const result = component['validateCharacterData']();

        expect(result).toBeTrue();
    });
    it('should create character data based on form values and attributes', () => {
        component.characterForm.patchValue({
            characterName: 'Test Character',
            selectedAvatar: 'avatar.png',
        });

        component.attributes = {
            life: { currentValue: 10, baseValue: 8, name: 'Life', description: 'Player life' },
            speed: { currentValue: 5, baseValue: 5, name: 'Speed', description: 'Player speed' },
            attack: { currentValue: 3, baseValue: 3, name: 'Attack', description: 'Player attack', dice: 'D6' },
            defence: { currentValue: 2, baseValue: 2, name: 'Defence', description: 'Player defence', dice: 'D4' },
        };

        const result = component['createCharacterData']();

        expect(result).toEqual({
            name: 'Test Character',
            avatar: 'avatar.png',
            attributes: component.attributes,
        });
    });
});
