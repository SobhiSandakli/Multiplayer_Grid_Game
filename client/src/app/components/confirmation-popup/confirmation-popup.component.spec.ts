import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AppMaterialModule } from '@app/modules/material.module';
import { ConfirmationPopupComponent } from './confirmation-popup.component';

describe('ConfirmationPopupComponent', () => {
    let component: ConfirmationPopupComponent;
    let fixture: ComponentFixture<ConfirmationPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppMaterialModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfirmationPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the ConfirmationPopupComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should display the default message if no message is provided', () => {
        const messageElement = fixture.debugElement.query(By.css('p')).nativeElement;
        expect(messageElement.textContent).toContain('Êtes-vous sûr de vouloir continuer ?');
    });

    it('should display the custom message provided as input', () => {
        component.message = 'Message de confirmation personnalisé';
        fixture.detectChanges();
        const messageElement = fixture.debugElement.query(By.css('p')).nativeElement;
        expect(messageElement.textContent).toContain('Message de confirmation personnalisé');
    });

    it('should emit the confirm event when the Confirm button is clicked', () => {
        spyOn(component.confirm, 'emit');
        const confirmButton = fixture.debugElement.query(By.css('.popup-button.confirm')).nativeElement;
        confirmButton.click();
        expect(component.confirm.emit).toHaveBeenCalled();
    });

    it('should emit the cancel event when the Cancel button is clicked', () => {
        spyOn(component.cancel, 'emit');
        const cancelButton = fixture.debugElement.query(By.css('.popup-button.cancel')).nativeElement;
        cancelButton.click();
        expect(component.cancel.emit).toHaveBeenCalled();
    });
});
