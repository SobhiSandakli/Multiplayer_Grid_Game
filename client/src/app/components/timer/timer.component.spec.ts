// timer.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TimerComponent } from './timer.component';

describe('TimerComponent', () => {
    let component: TimerComponent;
    let fixture: ComponentFixture<TimerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TimerComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TimerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the TimerComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should set timeClass to empty string when timeLeft > 10', () => {
        component.timeLeft = 15;
        component.ngOnChanges();

        expect(component.timeClass).toBe('');
    });

    it('should set timeClass to "warning" when timeLeft is between 6 and 10', () => {
        component.timeLeft = 10;
        component.ngOnChanges();
        expect(component.timeClass).toBe('warning');

        component.timeLeft = 7;
        component.ngOnChanges();
        expect(component.timeClass).toBe('warning');
    });

    it('should set timeClass to "critical" when timeLeft is 5 or less', () => {
        component.timeLeft = 5;
        component.ngOnChanges();
        expect(component.timeClass).toBe('critical');

        component.timeLeft = 0;
        component.ngOnChanges();
        expect(component.timeClass).toBe('critical');
    });

    it('should set timeClass to "critical" when timeLeft is negative', () => {
        component.timeLeft = -1;
        component.ngOnChanges();
        expect(component.timeClass).toBe('critical');
    });

    it('should update timeClass when timeLeft changes multiple times', () => {
        component.timeLeft = 15;
        component.ngOnChanges();
        expect(component.timeClass).toBe('');

        component.timeLeft = 8;
        component.ngOnChanges();
        expect(component.timeClass).toBe('warning');

        component.timeLeft = 4;
        component.ngOnChanges();
        expect(component.timeClass).toBe('critical');
    });

    it('should call updateTimeClass in ngOnChanges', () => {
        spyOn(component, 'updateTimeClass');
        component.ngOnChanges();
        expect(component.updateTimeClass).toHaveBeenCalled();
    });
    it('should correctly render the timeClass in the template', () => {
        // Test when timeLeft <= 5 (critical)
        component.timeLeft = 5;
        component.ngOnChanges();
        fixture.detectChanges();

        let spanElement = fixture.debugElement.query(By.css('.time-text'));
        //console.log('Classes after timeLeft = 5:', spanElement.classes);
        expect(spanElement.classes['critical']).toBeTrue();

        // Test when timeLeft <= 10 (warning)
        component.timeLeft = 8;
        component.ngOnChanges();
        fixture.detectChanges();

        spanElement = fixture.debugElement.query(By.css('.time-text'));
        //console.log('Classes after timeLeft = 8:', spanElement.classes);
        expect(spanElement.classes['warning']).toBeTrue();
        expect(spanElement.classes['critical']).toBeFalsy();

        // Test when timeLeft > 10 (no class)
        component.timeLeft = 15;
        component.ngOnChanges();
        fixture.detectChanges();

        spanElement = fixture.debugElement.query(By.css('.time-text'));
        //console.log('Classes after timeLeft = 15:', spanElement.classes);
        expect(spanElement.classes['critical']).toBeFalsy();
        expect(spanElement.classes['warning']).toBeFalsy();
    });
});
