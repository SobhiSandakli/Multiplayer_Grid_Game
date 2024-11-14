import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BonusAttribute, DiceAttribute } from '@app/enums/attributes.enum';
import { PlayerSocket } from '@app/services/socket/playerSocket.service';
import { SessionSocket } from '@app/services/socket/sessionSocket.service';
import { of } from 'rxjs';
import { SNACK_BAR_DURATION } from 'src/constants/players-constants';
import { ValidationErrorType } from 'src/constants/validate-constants';
import { CharacterCreationComponent } from './character-creation.component';

describe('CharacterCreationComponent', () => {
    let component: CharacterCreationComponent;
    let fixture: ComponentFixture<CharacterCreationComponent>;
    let playerSocketSpy: jasmine.SpyObj<PlayerSocket>;
    let sessionSocketSpy: jasmine.SpyObj<SessionSocket>;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        playerSocketSpy = jasmine.createSpyObj('PlayerSocket', ['createCharacter', 'getTakenAvatars', 'onCharacterCreated']);
        sessionSocketSpy = jasmine.createSpyObj('SessionSocket', ['deleteSession', 'leaveSession']);
        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            declarations: [CharacterCreationComponent],
            providers: [
                FormBuilder,
                { provide: PlayerSocket, useValue: playerSocketSpy },
                { provide: SessionSocket, useValue: sessionSocketSpy },
                { provide: MatSnackBar, useValue: snackBarSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterCreationComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should update bonus attribute correctly', () => {
        component.attributes = {
            attack: {
                baseValue: 5,
                currentValue: 5,
                name: 'Attack',
                description: 'Attack attribute',
            },
            defence: {
                baseValue: 5,
                currentValue: 5,
                name: 'Defence',
                description: 'Defence attribute',
            },
            life: {
                baseValue: 5,
                currentValue: 5,
                name: 'Life',
                description: 'Life attribute',
            },
            speed: {
                baseValue: 5,
                currentValue: 5,
                name: 'Speed',
                description: 'Speed attribute',
            },
        };
    
        component['updateBonusAttribute'](BonusAttribute.Life);
    
        expect(component.attributes.life.currentValue).toBe(7);
        expect(component.attributes.attack.currentValue).toBe(5);
        expect(component.characterForm.value.bonusAttribute).toBe(BonusAttribute.Life);
    });
    it('should delete session if creating game and hasJoinedSession is true', () => {
        component.sessionCode = 'test-session';
        component.isCreatingGame = true;
        component['hasJoinedSession'] = true; 
    
        component['leaveSession']();
    
        expect(sessionSocketSpy.deleteSession).toHaveBeenCalledWith('test-session');
        expect(sessionSocketSpy.leaveSession).not.toHaveBeenCalled();
    });
    
    it('should leave session if not creating game and hasJoinedSession is true', () => {
        component.sessionCode = 'test-session';
        component.isCreatingGame = false;
        component['hasJoinedSession'] = true; 
    
        component['leaveSession']();
    
        expect(sessionSocketSpy.leaveSession).toHaveBeenCalledWith('test-session');
        expect(sessionSocketSpy.deleteSession).not.toHaveBeenCalled();
    });
    
    it('should not call deleteSession or leaveSession if hasJoinedSession is false', () => {
        component.sessionCode = 'test-session';
        component['hasJoinedSession'] = false; 
    
        component['leaveSession']();
    
        expect(sessionSocketSpy.deleteSession).not.toHaveBeenCalled();
        expect(sessionSocketSpy.leaveSession).not.toHaveBeenCalled();
    });
    it('should set showCreationPopup to false when onCreationCancel is called', () => {
        component.showCreationPopup = true;

        component.onCreationCancel();

        expect(component.showCreationPopup).toBeFalse();
    });

    it('should set showCreationPopup to true when openCreationPopup is called', () => {
        component.showCreationPopup = false;

        component.openCreationPopup();

        expect(component.showCreationPopup).toBeTrue();
    });

    it('should set showReturnPopup to true when openReturnPopup is called', () => {
        component.showReturnPopup = false;

        component.openReturnPopup();

        expect(component.showReturnPopup).toBeTrue();
    });

    it('should set showReturnPopup to false and call leaveSession when onReturnConfirm is called', () => {
        spyOn(component as any, 'leaveSession');
        spyOn(component.backToGameSelection, 'emit');

        component.showReturnPopup = true;
        component.onReturnConfirm();

        expect(component.showReturnPopup).toBeFalse();
        expect(component['leaveSession']).toHaveBeenCalled();
        expect(component.backToGameSelection.emit).toHaveBeenCalled();
    });

    it('should set showReturnPopup to false when onReturnCancel is called', () => {
        component.showReturnPopup = true;

        component.onReturnCancel();

        expect(component.showReturnPopup).toBeFalse();
    });

    it('should call updateBonusAttribute when selectAttribute is called with BonusAttribute', () => {
        spyOn(component as any, 'updateBonusAttribute');

        component.selectAttribute(BonusAttribute.Life);

        expect(component['updateBonusAttribute']).toHaveBeenCalledWith(BonusAttribute.Life);
    });

    it('should call updateDiceAttribute when selectAttribute is called with DiceAttribute', () => {
        spyOn(component as any, 'updateDiceAttribute');

        component.selectAttribute(DiceAttribute.Attack);

        expect(component['updateDiceAttribute']).toHaveBeenCalledWith(DiceAttribute.Attack);
    });
    it('should fetch taken avatars on init if sessionCode is provided', () => {
        component.sessionCode = 'test-session';
        playerSocketSpy.getTakenAvatars.and.returnValue(of({ takenAvatars: ['avatar1'] }));

        component.ngOnInit();

        expect(playerSocketSpy.getTakenAvatars).toHaveBeenCalledWith('test-session');
        expect(component['takenAvatars']).toEqual(['avatar1']);
    });

    it('should open a snack bar with the correct message', () => {
        const message = 'Test message';
        component['openSnackBar'](message);

        expect(snackBarSpy.open).toHaveBeenCalledWith(message, 'OK', {
            duration: SNACK_BAR_DURATION,
            panelClass: ['custom-snackbar'],
        });
    });

    it('should handle character creation confirmation', () => {
        component.sessionCode = 'test-session';
        component.characterForm.setValue({
            characterName: 'TestName',
            selectedAvatar: 'avatar1',
            bonusAttribute: 'Life',
            diceAttribute: 'Attack',
        });

        spyOn(component as any, 'handleCharacterCreated');
        playerSocketSpy.createCharacter.and.callFake(() => {});

        component.onCreationConfirm();

        expect(playerSocketSpy.createCharacter).toHaveBeenCalledWith('test-session', {
            name: 'TestName',
            avatar: 'avatar1',
            attributes: component.attributes,
        });
        expect(component['handleCharacterCreated']).toHaveBeenCalled();
    });

    it('should handle invalid character name with only whitespace', () => {
        component.characterForm.patchValue({ characterName: '   ' });
        spyOn(component as any, 'nameValidator');
    
        component.onCreationConfirm();
    
        expect(component['nameValidator']).toHaveBeenCalledWith(ValidationErrorType.WhitespaceOnlyName);
    });

    it('should update the form when selecting an avatar', () => {
        component['takenAvatars'] = ['avatar2'];

        component.selectAvatar('avatar1');

        expect(component.characterForm.value.selectedAvatar).toEqual('avatar1');
    });

    it('should not update the form when selecting a taken avatar', () => {
        component['takenAvatars'] = ['avatar1'];

        component.selectAvatar('avatar1');

        expect(component.characterForm.value.selectedAvatar).toBeNull();
    });

    it('should update the session code when updateSessionCode is called', () => {
        const response = { name: 'TestName', sessionCode: 'new-session' }; 
        component['updateSessionCode'](response);
        expect(component.sessionCode).toBe('new-session');
    });
    
    it('should open a snack bar when the character name is already taken', () => {
        const response = { name: 'NewName', sessionCode: 'test-session' }; 
        component['updateCharacterName'](response);
    
        expect(component.characterForm.value.characterName).toBe('NewName');
        expect(snackBarSpy.open).toHaveBeenCalledWith(
            'Le nom était déjà pris. Votre nom a été modifié en : NewName',
            'OK',
            {
                duration: SNACK_BAR_DURATION,
                panelClass: ['custom-snackbar'],
            }
        );
    });
    it('should display an error message when character name contains only whitespace', () => {
        spyOn(component as any, 'openSnackBar');
    
        component['nameValidator'](ValidationErrorType.WhitespaceOnlyName);
    
        expect(component['openSnackBar']).toHaveBeenCalledWith(
            'Le nom du personnage ne peut pas contenir uniquement des espaces.'
        );
    });
    it('should call openSnackBar with the provided error message', () => {
        spyOn(component as any, 'openSnackBar');
        const errorMessage = 'Test error message';
    
        component['handleValidationFailure'](errorMessage);
    
        expect(component['openSnackBar']).toHaveBeenCalledWith(errorMessage);
    });
    it('should return the correct character data', () => {
        component.characterForm.setValue({
            characterName: 'TestCharacter',
            selectedAvatar: 'avatar1',
            bonusAttribute: 'Life',
            diceAttribute: 'Attack',
        });
        component.attributes = {
            attack: { baseValue: 5, currentValue: 5, name: 'Attack', description: 'Attack attribute' },
            defence: { baseValue: 5, currentValue: 5, name: 'Defence', description: 'Defence attribute' },
            life: { baseValue: 5, currentValue: 5, name: 'Life', description: 'Life attribute' },
            speed: { baseValue: 5, currentValue: 5, name: 'Speed', description: 'Speed attribute' },
        };
    
        const result = component['createCharacterData']();
    
        expect(result).toEqual({
            name: 'TestCharacter',
            avatar: 'avatar1',
            attributes: component.attributes,
        });
    });
    describe('validateCharacterData', () => {
        it('should return false and call handleValidationFailure if sessionCode is null', () => {
            component.sessionCode = null;
            spyOn(component as any, 'handleValidationFailure');
    
            const result = component['validateCharacterData']();
    
            expect(component['handleValidationFailure']).toHaveBeenCalledWith('Session Code is null or undefined.');
            expect(result).toBeFalse();
        });
    
        it('should return true if sessionCode is defined', () => {
            component.sessionCode = 'test-session';
    
            const result = component['validateCharacterData']();
    
            expect(result).toBeTrue();
        });
    });
});