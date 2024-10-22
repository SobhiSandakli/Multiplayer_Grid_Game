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
    timeLeft: number;
    intervalId: ReturnType<typeof setInterval> | undefined;

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

    setTimer(isInvolvedInFight: boolean): void {
        if (isInvolvedInFight) {
            this.timeLeft = 60000; // 60 secondes
            this.startTimer();
        }
    }
}
