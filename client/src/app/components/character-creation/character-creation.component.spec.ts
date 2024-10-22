// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { Router } from '@angular/router';
// import { AppMaterialModule } from '@app/modules/material.module';
// import { CharacterCreationComponent } from './character-creation.component';

// describe('CharacterCreationComponent', () => {
//     let component: CharacterCreationComponent;
//     let fixture: ComponentFixture<CharacterCreationComponent>;
//     let router: Router;

//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             imports: [AppMaterialModule],
//         }).compileComponents();
//     });

//     beforeEach(() => {
//         fixture = TestBed.createComponent(CharacterCreationComponent);
//         component = fixture.componentInstance;
//         router = TestBed.inject(Router);
//         fixture.detectChanges();
//     });

//     // it('should create the CharacterCreationComponent', () => {
//     //     expect(component).toBeTruthy();
//     // });

//     it('should set selectedAvatar when selectAvatar is called', () => {
//         const avatar = 'assets/avatars/av1.png';
//         component.selectAvatar(avatar);
//         expect(component.characterForm.get('selectedAvatar')?.value).toEqual(avatar);
//     });

//     // it('should select "life" as bonus attribute and update currentValue', () => {
//     //     component.selectAttribute('life');
//     //     expect(component.attributes['life'].currentValue).toEqual(component.attributes['life'].baseValue + 2);
//     //     expect(component.attributes['speed'].currentValue).toEqual(component.attributes['speed'].baseValue);
//     //     expect(component.characterForm.get('bonusAttribute')?.value).toEqual('life');
//     // });

//     // it('should select "speed" as bonus attribute and update currentValue', () => {
//     //     component.selectAttribute('speed');
//     //     expect(component.attributes['speed'].currentValue).toEqual(component.attributes['speed'].baseValue + 2);
//     //     expect(component.attributes['life'].currentValue).toEqual(component.attributes['life'].baseValue);
//     //     expect(component.characterForm.get('bonusAttribute')?.value).toEqual('speed');
//     // });

//     // it('should select "attack" as dice attribute and update dice values', () => {
//     //     component.selectAttribute('attack');
//     //     expect(component.attributes['attack'].dice).toEqual('D6');
//     //     expect(component.attributes['defence'].dice).toEqual('D4');
//     //     expect(component.characterForm.get('diceAttribute')?.value).toEqual('attack');
//     // });

//     // it('should select "defence" as dice attribute and update dice values', () => {
//     //     component.selectAttribute('defence');
//     //     expect(component.attributes['defence'].dice).toEqual('D6');
//     //     expect(component.attributes['attack'].dice).toEqual('D4');
//     //     expect(component.characterForm.get('diceAttribute')?.value).toEqual('defence');
//     // });

//     it('should set showReturnPopup to true when openReturnPopup is called', () => {
//         component.openReturnPopup();
//         expect(component.showReturnPopup).toBeTrue();
//     });

//     it('should set showCreationPopup to true when openCreationPopup is called', () => {
//         component.openCreationPopup();
//         expect(component.showCreationPopup).toBeTrue();
//     });

//     it('should set showReturnPopup to false and emit backToGameSelection when onReturnConfirm is called', () => {
//         spyOn(component.backToGameSelection, 'emit');
//         component.showReturnPopup = true;
//         component.onReturnConfirm();
//         expect(component.showReturnPopup).toBeFalse();
//         expect(component.backToGameSelection.emit).toHaveBeenCalled();
//     });

//     it('should set showReturnPopup to false when onReturnCancel is called', () => {
//         component.showReturnPopup = true;
//         component.onReturnCancel();
//         expect(component.showReturnPopup).toBeFalse();
//     });

//     // it('should emit characterCreated, and navigate to /waiting when onCreationConfirm is called and form is valid', () => {
//     //     spyOn(component.characterCreated, 'emit');
//     //     spyOn(router, 'navigate');

//     //     component.characterForm.setValue({
//     //         characterName: 'Hero',
//     //         selectedAvatar: 'assets/avatars/av1.png',
//     //         bonusAttribute: 'life',
//     //         diceAttribute: 'attack',
//     //     });

//     //     component.showCreationPopup = true;
//     //     component.onCreationConfirm();

//     //     expect(component.showCreationPopup).toBeFalse();
//     //     expect(component.characterCreated.emit).toHaveBeenCalledWith({
//     //         name: 'Hero',
//     //         avatar: 'assets/avatars/av1.png',
//     //         attributes: component.attributes,
//     //     });
//     //     expect(router.navigate).toHaveBeenCalledWith(['/waiting']);
//     // });

//     it('should not emit characterCreated or navigate when onCreationConfirm is called and form is invalid', () => {
//         spyOn(component.characterCreated, 'emit');
//         spyOn(router, 'navigate');

//         component.characterForm.setValue({
//             characterName: '',
//             selectedAvatar: null,
//             bonusAttribute: null,
//             diceAttribute: null,
//         });

//         component.showCreationPopup = true;
//         component.onCreationConfirm();

//         expect(component.showCreationPopup).toBeFalse();
//         expect(component.characterCreated.emit).not.toHaveBeenCalled();
//         expect(router.navigate).not.toHaveBeenCalled();
//     });

//     it('should set showCreationPopup to false when onCreationCancel is called', () => {
//         component.showCreationPopup = true;
//         component.onCreationCancel();
//         expect(component.showCreationPopup).toBeFalse();
//     });

//     // it('should have invalid form when required fields are missing', () => {
//     //     component.characterForm.setValue({
//     //         characterName: '',
//     //         selectedAvatar: null,
//     //         bonusAttribute: null,
//     //         diceAttribute: null,
//     //     });
//     //     expect(component.characterForm.valid).toBeFalse();
//     // });

//     it('should have valid form when all required fields are filled', () => {
//         component.characterForm.setValue({
//             characterName: 'Hero',
//             selectedAvatar: 'assets/avatars/av1.png',
//             bonusAttribute: 'life',
//             diceAttribute: 'attack',
//         });
//         expect(component.characterForm.valid).toBeTrue();
//     });
// });
