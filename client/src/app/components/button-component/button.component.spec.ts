import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { By } from '@angular/platform-browser';
// eslint-disable-next-line import/no-deprecated
import { RouterTestingModule } from '@angular/router/testing';
import { FaIconComponent, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

describe('ButtonComponent', () => {
    let component: ButtonComponent;
    let fixture: ComponentFixture<ButtonComponent>;
    let library: FaIconLibrary;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ButtonComponent],
            // eslint-disable-next-line import/no-deprecated
            imports: [RouterTestingModule, FaIconComponent],
        }).compileComponents();

        library = TestBed.inject(FaIconLibrary);
        library.addIconPacks(fas);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ButtonComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display label text', () => {
        component.label = 'Test Button';
        component.icon = ['fas', 'arrow-left'];
        fixture.detectChanges();
        const buttonElement: HTMLElement = fixture.debugElement.query(By.css('button')).nativeElement;
        expect(buttonElement.textContent).toContain('Test Button');
    });

    it('should display an icon when provided', () => {
        component.icon = ['fas', 'arrow-left'];
        fixture.detectChanges();
        const iconElement = fixture.debugElement.query(By.directive(FaIconComponent));
        expect(iconElement).toBeTruthy();
    });

    it('should emit buttonClick event when button is clicked', () => {
        spyOn(component.buttonClick, 'emit');
        component.icon = ['fas', 'arrow-left'];
        fixture.detectChanges();
        const buttonElement = fixture.debugElement.query(By.css('button'));
        buttonElement.triggerEventHandler('click', null);
        expect(component.buttonClick.emit).toHaveBeenCalled();
    });

    it('should use the routerLink input', () => {
        component.routerLink = ['/home'];
        component.icon = ['fas', 'arrow-left'];
        fixture.detectChanges();
        const buttonElement = fixture.debugElement.query(By.css('button'));
        expect(buttonElement.attributes['ng-reflect-router-link']).toBe('/home');
    });

    it('should call onClick() when the button is clicked', () => {
        spyOn(component, 'onClick');
        component.icon = ['fas', 'arrow-left'];
        fixture.detectChanges();
        const buttonElement = fixture.debugElement.query(By.css('button'));
        buttonElement.triggerEventHandler('click', null);
        expect(component.onClick).toHaveBeenCalled();
    });
});
