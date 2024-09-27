import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameEditorPageComponent } from './game-editor-page.component';
// eslint-disable-next-line import/no-deprecated
import { HttpClientModule } from '@angular/common/http';

describe('GameEditorPageComponent', () => {
    let component: GameEditorPageComponent;
    let fixture: ComponentFixture<GameEditorPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            // eslint-disable-next-line import/no-deprecated
            imports: [GameEditorPageComponent, HttpClientModule],
        }).compileComponents();

        fixture = TestBed.createComponent(GameEditorPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set isNameExceeded to true if name exceeds maxLengthName', () => {
        const textarea = fixture.nativeElement.querySelector('#name') as HTMLTextAreaElement;
        textarea.value = 'a'.repeat(component.maxLengthName + 1);
        textarea.dispatchEvent(new Event('input'));

        fixture.detectChanges();

        expect(component.isNameExceeded).toBeTrue();
    });

    it('should set isNameExceeded to false if name does not exceed maxLengthName', () => {
        const textarea = fixture.nativeElement.querySelector('#name') as HTMLTextAreaElement;
        textarea.value = 'a'.repeat(component.maxLengthName - 1);
        textarea.dispatchEvent(new Event('input'));

        fixture.detectChanges();

        expect(component.isNameExceeded).toBeFalse();
    });

    it('should set isDescriptionExceeded to true if description exceeds maxLengthDescription', () => {
        const textarea = fixture.nativeElement.querySelector('#description') as HTMLTextAreaElement;
        textarea.value = 'a'.repeat(component.maxLengthDescription + 1);
        textarea.dispatchEvent(new Event('input'));

        fixture.detectChanges();

        expect(component.isDescriptionExceeded).toBeTrue();
    });

    it('should set isDescriptionExceeded to false if description does not exceed maxLengthDescription', () => {
        const textarea = fixture.nativeElement.querySelector('#description') as HTMLTextAreaElement;
        textarea.value = 'a'.repeat(component.maxLengthDescription - 1);
        textarea.dispatchEvent(new Event('input'));

        fixture.detectChanges();

        expect(component.isDescriptionExceeded).toBeFalse();
    });
});
