import { Component } from '@angular/core';
import { faClock } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent {
    faClock = faClock;
    timeLeft: number;
    intervalId: any;

    ngOnInit(): void {
        this.timeLeft = 60000; // 60 secondes
        this.startCountdown();
    }

    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    startCountdown() {
        this.intervalId = setInterval(() => {
            this.timeLeft -= 1000; // On diminue la durée restante d'une seconde (1000ms)

            if (this.timeLeft <= 0) {
                clearInterval(this.intervalId);
                this.timeLeft = 0; // On s'assure que le temps ne devient pas négatif
            }
        }, 1000);
    }
}
