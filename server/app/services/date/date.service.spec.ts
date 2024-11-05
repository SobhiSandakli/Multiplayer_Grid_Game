import { DateService } from './date.service';

describe('DateService', () => {
    let service: DateService;

    beforeEach(() => {
        service = new DateService();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return the current time as a string', () => {
        const currentTime = service.currentTime();
        expect(typeof currentTime).toBe('string');
        expect(new Date(currentTime).toString()).not.toBe('Invalid Date'); 
    });
});
