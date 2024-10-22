import { ComponentFixture, TestBed } from '@angular/core/testing';
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
        component.startTimer();
    });

    afterEach(() => {
        if (component.intervalId) {
            clearInterval(component.intervalId);
        }
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should start the timer', () => {
        expect(component.putTimer).toBeTrue();
        expect(component.intervalId).toBeDefined();
    });

    it('should stop the timer when timeLeft reaches 0', (done) => {
        setTimeout(() => {
            expect(component.timeLeft).toBe(0);
            done();
        }, 1100);
    });

    it('should stop the timer before timeLeft reaches 0', () => {
        component.stopTimer();
        expect(component.timeLeft).toBe(0);
    });

    it('should clear interval on destroy', () => {
        component.ngOnDestroy();
        expect(component.intervalId).toBeUndefined();
    });

    it('should start timer on changes when putTimer is true', () => {
        component.putTimer = true;
        component.ngOnChanges();
        expect(component.putTimer).toBeTrue();
        expect(component.intervalId).toBeDefined();
    });

    it('should stop timer on changes when putTimer is false', () => {
        component.putTimer = false;
        component.ngOnChanges();
        expect(component.timeLeft).toBe(0);
    });

    it('should not decrement timeLeft below 0', (done) => {
        component.timeLeft = 1000;
        component.startTimer();
        setTimeout(() => {
            expect(component.timeLeft).toBe(0);
            done();
        }, 2100);
    });

    it('should set timer to 60 seconds when setTimer is called with true', () => {
        component.setTimer(true);
        expect(component.timeLeft).toBe(60000);
        expect(component.startTimer).toHaveBeenCalled();
    });
});
