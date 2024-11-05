import { Component, Input, OnChanges } from '@angular/core';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { CRITICAL_TIME, WARNING_TIME } from 'src/constants/timer-constants';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnChanges {
    @Input() timeLeft: number = 0;
    faClock = faClock;
    timeClass: string = '';

    ngOnChanges(): void {
        this.updateTimeClass();
    }

    updateTimeClass(): void {
        if (this.timeLeft <= CRITICAL_TIME) {
            this.timeClass = 'critical';
        } else if (this.timeLeft <= WARNING_TIME) {
            this.timeClass = 'warning';
        } else {
            this.timeClass = '';
        }
    }
}
