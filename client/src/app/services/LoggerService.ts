import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class LoggerService {
    log(message: string): void {
        /* eslint-disable-next-line no-console */
        console.log(message);
    }

    error(message: string): void {
        /* eslint-disable-next-line no-console */
        console.error(message);
    }

    warn(message: string): void {
        /* eslint-disable-next-line no-console */
        console.warn(message);
    }
}
