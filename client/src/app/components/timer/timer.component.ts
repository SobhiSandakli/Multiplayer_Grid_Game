import { Component, Input } from '@angular/core';
import { faClock } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent {
    faClock = faClock;
    timeLeft: number = 60000; // 60 secondes
    intervalId: any;
    @Input() putTimer: boolean;

    ngOnInit(): void {
        this.setTimer(false);
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
            this.startTimer();
        }
    }
}
