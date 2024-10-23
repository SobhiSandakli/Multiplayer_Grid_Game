import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BonusAttribute, DiceAttribute } from '@app/enums/attributes.enum';
import { AppMaterialModule } from '@app/modules/material.module';
import { SocketService } from '@app/services/socket/socket.service';
import { AVATARS } from 'src/constants/avatars-constants';
import { CharacterCreationComponent } from './character-creation.component';

describe('CharacterCreationComponent', () => {
    let component: CharacterCreationComponent;
    let fixture: ComponentFixture<CharacterCreationComponent>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        socketServiceSpy = jasmine.createSpyObj('SocketService', [
            'createCharacter',
            'getTakenAvatars',
            'deleteSession',
            'leaveSession',
            'onCharacterCreated',
        ]);
        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [AppMaterialModule],
            declarations: [CharacterCreationComponent],
            providers: [
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: MatSnackBar, useValue: snackBarSpy },
                { provide: Router, useValue: routerSpy },
                FormBuilder,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterCreationComponent);
        component = fixture.componentInstance;
    });

    describe('Component Initialization', () => {
        it('should create the CharacterCreationComponent', () => {
            expect(component).toBeTruthy();
        });

        it('should fetch taken avatars on initialization if sessionCode exists', () => {
            component.sessionCode = '12345';
            const takenAvatars = { takenAvatars: ['avatar1.png'] };
            socketServiceSpy.getTakenAvatars.and.returnValue(of(takenAvatars));

            component.ngOnInit();

            expect(socketServiceSpy.getTakenAvatars).toHaveBeenCalledWith('12345');
            expect(component['takenAvatars']).toEqual(takenAvatars.takenAvatars);
        });

        it('should handle error when fetching avatars fails', () => {
            component.sessionCode = '12345';
            socketServiceSpy.getTakenAvatars.and.returnValue(throwError('Erreur serveur'));

            component.ngOnInit();

            expect(socketServiceSpy.getTakenAvatars).toHaveBeenCalledWith('12345');
            expect(snackBarSpy.open).toHaveBeenCalledWith('Erreur lors de la récupération des avatars: Erreur serveur', 'OK', jasmine.any(Object));
        });

        it('should not fetch avatars if sessionCode is null or undefined', () => {
            component.sessionCode = null;

            component.ngOnInit();

            expect(socketServiceSpy.getTakenAvatars).not.toHaveBeenCalled();
            expect(snackBarSpy.open).toHaveBeenCalledWith('Session Code is null or undefined.', 'OK', jasmine.any(Object));
        });
    });

    describe('Avatar and Attribute Selection', () => {
        it('should set selectedAvatar when selectAvatar is called and avatar is not taken', () => {
            const avatar = AVATARS[0];
            component.selectAvatar(avatar);
            expect(component.characterForm.get('selectedAvatar')?.value).toEqual(avatar);
        });

        it('should not select avatar if it is already taken', () => {
            const avatar = AVATARS[0];
            component['takenAvatars'] = [avatar];
            component.selectAvatar(avatar);
            expect(component.characterForm.get('selectedAvatar')?.value).toBeNull();
        });

        it('should update bonusAttribute and modify attributes when selectAttribute is called with a bonus attribute', () => {
            component.selectAttribute(BonusAttribute.Life);
            expect(component.attributes['life'].currentValue).toBe(component.attributes['life'].baseValue + 2);
            expect(component.characterForm.get('bonusAttribute')?.value).toBe(BonusAttribute.Life);
        });

        it('should set attack dice to D6 and defence dice to D4 when DiceAttribute.Attack is selected', () => {
            component.selectAttribute(DiceAttribute.Attack);
            expect(component.attributes.attack.dice).toBe('D6');
            expect(component.attributes.defence.dice).toBe('D4');
        });

        it('should set defence dice to D6 and attack dice to D4 when DiceAttribute.Defence is selected', () => {
            component.selectAttribute(DiceAttribute.Defence);
            expect(component.attributes.defence.dice).toBe('D6');
            expect(component.attributes.attack.dice).toBe('D4');
        });
    });

    describe('Character Creation', () => {
        it('should not allow character creation if form is invalid', () => {
            spyOn(component.characterCreated, 'emit');
            component.characterForm.setValue({
                characterName: '',
                selectedAvatar: null,
                bonusAttribute: null,
                diceAttribute: null,
            });
            component.onCreationConfirm();
            expect(component.characterCreated.emit).not.toHaveBeenCalled();
        });

        it('should allow character creation if form is valid', () => {
            spyOn(component.characterCreated, 'emit');
            socketServiceSpy.onCharacterCreated.and.returnValue(
                of({
                    name: 'Hero',
                    sessionCode: 'ABC123',
                    avatar: AVATARS[0],
                    attributes: component.attributes,
                }),
            );
            component.characterForm.setValue({
                characterName: 'Hero',
                selectedAvatar: AVATARS[0],
                bonusAttribute: BonusAttribute.Life,
                diceAttribute: DiceAttribute.Attack,
            });

            component.sessionCode = 'ABC123';

            component.onCreationConfirm();

            expect(component.characterCreated.emit).toHaveBeenCalled();
            expect(socketServiceSpy.createCharacter).toHaveBeenCalledWith(
                'ABC123',
                jasmine.objectContaining({
                    name: 'Hero',
                    avatar: AVATARS[0],
                    attributes: component.attributes,
                }),
            );
        });

        it('should navigate to /waiting and emit characterCreated when character is created', () => {
            const characterData = {
                name: 'Hero',
                sessionCode: 'ABC123',
                avatar: AVATARS[0],
                attributes: component.attributes,
            };
            spyOn(component.characterCreated, 'emit').and.callThrough();
            socketServiceSpy.onCharacterCreated.and.returnValue(of(characterData));
            component['handleCharacterCreated']();
            expect(component.characterCreated.emit).toHaveBeenCalledWith(characterData);
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/waiting'], {
                queryParams: { sessionCode: 'ABC123', gameId: component.gameId },
            });
        });

        it('should update character name and show snackbar if the name is already taken', () => {
            const characterData = { name: 'NewHero', sessionCode: 'ABC123' };
            component.characterForm.patchValue({ characterName: 'Hero' });

            component['updateCharacterName'](characterData);

            expect(component.characterForm.get('characterName')?.value).toBe('NewHero');
            expect(snackBarSpy.open).toHaveBeenCalledWith('Le nom était déjà pris. Votre nom a été modifié en : NewHero', 'OK', jasmine.any(Object));
        });
    });

    describe('Return Popup', () => {
        it('should set showReturnPopup to true when openReturnPopup is called', () => {
            component.openReturnPopup();
            expect(component.showReturnPopup).toBeTrue();
        });

        it('should set showReturnPopup to false when onReturnCancel is called', () => {
            component.showReturnPopup = true;
            component.onReturnCancel();
            expect(component.showReturnPopup).toBeFalse();
        });

        it('should set showReturnPopup to false and emit backToGameSelection when onReturnConfirm is called', () => {
            spyOn(component.backToGameSelection, 'emit');
            component.showReturnPopup = true;
            component.onReturnConfirm();
            expect(component.showReturnPopup).toBeFalse();
            expect(component.backToGameSelection.emit).toHaveBeenCalled();
        });
    });

    describe('Session Handling', () => {
        it('should call deleteSession when hasJoinedSession is true and isCreatingGame is true', () => {
            component['hasJoinedSession'] = true;
            component.isCreatingGame = true;
            component.sessionCode = '12345';
            component['leaveSession']();
            expect(socketServiceSpy.deleteSession).toHaveBeenCalledWith('12345');
        });

        it('should call leaveSession when hasJoinedSession is true and isCreatingGame is false', () => {
            component['hasJoinedSession'] = true;
            component.isCreatingGame = false;
            component.sessionCode = '12345';
            component['leaveSession']();
            expect(socketServiceSpy.leaveSession).toHaveBeenCalledWith('12345');
        });

        it('should not call deleteSession or leaveSession when hasJoinedSession is false', () => {
            component['hasJoinedSession'] = false;
            component['leaveSession']();
            expect(socketServiceSpy.deleteSession).not.toHaveBeenCalled();
            expect(socketServiceSpy.leaveSession).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should call handleValidationFailure when sessionCode is null in fetchTakenAvatars', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            spyOn<any>(component, 'handleValidationFailure');
            component.sessionCode = null;
            component['fetchTakenAvatars']();
            expect(component['handleValidationFailure']).toHaveBeenCalledWith('Session Code is null or undefined.');
        });

        it('should open snackbar with the correct message in handleValidationFailure', () => {
            component['handleValidationFailure']('Test error');
            expect(snackBarSpy.open).toHaveBeenCalledWith('Test error', 'OK', jasmine.any(Object));
        });

        it('should return false and call handleValidationFailure when sessionCode is null in validateCharacterData', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            spyOn(component as any, 'handleValidationFailure');
            component.sessionCode = null;

            const result = component['validateCharacterData']();
            expect(result).toBeFalse();
            expect(component['handleValidationFailure']).toHaveBeenCalledWith('Session Code is null or undefined.');
        });
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
});
