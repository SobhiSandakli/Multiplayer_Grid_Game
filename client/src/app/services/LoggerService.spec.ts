import { TestBed } from '@angular/core/testing';
import { LoggerService } from './LoggerService';

describe('LoggerService', () => {
    let service: LoggerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LoggerService);
    });

    it('should log a message using console.log', () => {
        spyOn(console, 'log');
        const message = 'This is a log message';

        service.log(message);
        /* eslint-disable-next-line no-console */
        expect(console.log).toHaveBeenCalledWith(message);
    });

    it('should log an error using console.error', () => {
        /* eslint-disable-next-line no-console */
        spyOn(console, 'error');
        const errorMessage = 'This is an error message';

        service.error(errorMessage);
        /* eslint-disable-next-line no-console */
        expect(console.error).toHaveBeenCalledWith(errorMessage);
    });

    it('should log a warning using console.warn', () => {
        /* eslint-disable-next-line no-console */
        spyOn(console, 'warn');
        const warnMessage = 'This is a warning message';

        service.warn(warnMessage);
        /* eslint-disable-next-line no-console */
        expect(console.warn).toHaveBeenCalledWith(warnMessage);
    });
});
