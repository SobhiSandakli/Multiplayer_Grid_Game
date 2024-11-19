import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DuplicateNameComponent } from './duplicate-name.component';

describe('DuplicateNameComponent', () => {
    let component: DuplicateNameComponent;
    let fixture: ComponentFixture<DuplicateNameComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DuplicateNameComponent],
            imports: [FormsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(DuplicateNameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should emit confirmEvent with newName on onConfirm', () => {
        spyOn(component.confirmEvent, 'emit');
        component.newName = 'Test Name';
        component.onConfirm();

        expect(component.confirmEvent.emit).toHaveBeenCalledWith('Test Name');
    });

    it('should emit cancelEvent on onCancel', () => {
        spyOn(component.cancelEvent, 'emit');
        component.onCancel();

        expect(component.cancelEvent.emit).toHaveBeenCalled();
    });

    it('should update newName when input value changes', () => {
        const inputElement = fixture.debugElement.query(By.css('input')).nativeElement;
        inputElement.value = 'Updated Name';
        inputElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.newName).toBe('Updated Name');
    });
});
