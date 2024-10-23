import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as GameConstants from 'src/constants/game-constants';
import { TimerComponent } from './timer.component';

const INTERVAL_TEST = 2100;

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

    it('should stop the timer before timeLeft reaches 0', () => {
        component.stopTimer();
        expect(component.timeLeft).toBe(0);
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
        }, INTERVAL_TEST);
    });

    it('should set timer to 60 seconds when setTimer is called with true', () => {
        spyOn(component, 'startTimer').and.callThrough();
        component.setTimer(true);
        expect(component.timeLeft).toBe(GameConstants.TIMER_DURATION);
        expect(component.startTimer).toHaveBeenCalled();
    });
});
