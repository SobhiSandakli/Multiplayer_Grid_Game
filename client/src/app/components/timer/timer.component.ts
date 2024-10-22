import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { TIMER_DURATION, TIMER_INTERVAL } from 'src/constants/game-constants';
@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnInit, OnDestroy, OnChanges {
    @Input() putTimer: boolean;
    faClock = faClock;
    timeLeft: number = TIMER_DURATION;
    // should check the type of intervalId @Noëla
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    intervalId: any;

    ngOnInit(): void {
        this.timeLeft = TIMER_DURATION;
        this.startTimer();
    }

    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    ngOnChanges(): void {
        if (this.putTimer) {
            this.startTimer();
        } else {
            this.stopTimer();
        }
    }
    startTimer() {
        this.putTimer = true;
        this.intervalId = setInterval(() => {
            this.timeLeft -= TIMER_INTERVAL;

            if (this.timeLeft <= 0) {
                clearInterval(this.intervalId);
                this.timeLeft = 0;
            }
        }, TIMER_INTERVAL);
    }

    stopTimer(): void {
        this.timeLeft = 0;
    }
}
