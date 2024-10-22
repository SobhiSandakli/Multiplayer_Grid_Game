import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { faClock } from '@fortawesome/free-solid-svg-icons';

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
        this.setTimer(true);
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
            this.timeLeft -= 1000;

            if (this.timeLeft <= 0) {
                clearInterval(this.intervalId);
                this.timeLeft = 0;
            }
        }, 1000);
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
