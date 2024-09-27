import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ConfirmationPopupComponent } from './confirmation-popup.component';

describe('ConfirmationPopupComponent', () => {
    let component: ConfirmationPopupComponent;
    let fixture: ComponentFixture<ConfirmationPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ConfirmationPopupComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfirmationPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('devrait créer le ConfirmationPopupComponent', () => {
        expect(component).toBeTruthy();
    });

    it("devrait afficher le message par défaut si aucun message n'est fourni", () => {
        const messageElement = fixture.debugElement.query(By.css('p')).nativeElement;
        expect(messageElement.textContent).toContain('Êtes-vous sûr de vouloir continuer ?');
    });

    it('devrait afficher le message personnalisé fourni en entrée', () => {
        component.message = 'Message de confirmation personnalisé';
        fixture.detectChanges();
        const messageElement = fixture.debugElement.query(By.css('p')).nativeElement;
        expect(messageElement.textContent).toContain('Message de confirmation personnalisé');
    });

    it("devrait émettre l'événement confirm lorsque le bouton Confirmer est cliqué", () => {
        spyOn(component.confirm, 'emit');
        const confirmButton = fixture.debugElement.query(By.css('.popup-button.confirm')).nativeElement;
        confirmButton.click();
        expect(component.confirm.emit).toHaveBeenCalled();
    });

    it("devrait émettre l'événement cancel lorsque le bouton Annuler est cliqué", () => {
        spyOn(component.cancel, 'emit');
        const cancelButton = fixture.debugElement.query(By.css('.popup-button.cancel')).nativeElement;
        cancelButton.click();
        expect(component.cancel.emit).toHaveBeenCalled();
    });
});
