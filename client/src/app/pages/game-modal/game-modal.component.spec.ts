import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameSetupModalComponent } from './game-modal.component';
import { Router, RouterModule } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('GameSetupModalComponent', () => {
    let component: GameSetupModalComponent;
    let fixture: ComponentFixture<GameSetupModalComponent>;
    const numberOfGameSize = 3;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GameSetupModalComponent],
            imports: [RouterModule.forRoot([])],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameSetupModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should have default values for selectedMode and selectedSize', () => {
        expect(component.selectedMode).toBe('');
        expect(component.selectedSize).toBe('');
    });

    it('should set selectedMode and selectedSize on form submission', () => {
        component.selectedMode = 'classique';
        component.selectedSize = 'small';
        component.startGameCreation();

        expect(component.selectedMode).toBe('classique');
        expect(component.selectedSize).toBe('small');
    });

    it('should emit close event on emitCloseEvent()', () => {
        spyOn(component.closeModalEvent, 'emit');

        component.emitCloseEvent();

        expect(component.closeModalEvent.emit).toHaveBeenCalled();
    });

    it('should navigate to the edit page on startGameCreation()', () => {
        const router = TestBed.inject(Router);
        const navigateSpy = spyOn(router, 'navigate');

        component.selectedMode = 'classique';
        component.selectedSize = 'small';
        component.startGameCreation();

        expect(navigateSpy).toHaveBeenCalledWith(['/edit-page'], {
            queryParams: { mode: 'classique', size: 'small' },
        });
    });

    it('should show alert if mode or size is not selected on startGameCreation()', () => {
        spyOn(window, 'alert');

        component.selectedMode = '';
        component.selectedSize = '';
        component.startGameCreation();

        expect(window.alert).toHaveBeenCalledWith('Veuillez sélectionner le mode et la taille de la carte.');
    });

    it('should render game mode options correctly', () => {
        const modeSelect = fixture.debugElement.query(By.css('#mode')).nativeElement;
        fixture.detectChanges();

        expect(modeSelect.options.length).toBe(2);
        expect(modeSelect.options[0].textContent.trim()).toBe('Classique');
        expect(modeSelect.options[1].textContent.trim()).toBe('Capture the Flag');
    });

    it('should render map size options correctly', () => {
        const sizeSelect = fixture.debugElement.query(By.css('#size')).nativeElement;
        fixture.detectChanges();

        expect(sizeSelect.options.length).toBe(numberOfGameSize);
        expect(sizeSelect.options[0].textContent.trim()).toBe('Petite (10x10)');
        expect(sizeSelect.options[1].textContent.trim()).toBe('Moyenne (15x15)');
        expect(sizeSelect.options[2].textContent.trim()).toBe('Grande (20x20)');
    });
});
