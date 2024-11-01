import { Component, Input, OnChanges } from '@angular/core';
import { faClock } from '@fortawesome/free-solid-svg-icons';

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
        if (this.timeLeft <= 5) {
            this.timeClass = 'critical'; // Temps critique
        } else if (this.timeLeft <= 10) {
            this.timeClass = 'warning'; // Temps d'avertissement
        } else {
            this.timeClass = ''; // Valeur par défaut
        }
    }
}
