import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
    let service: NotificationService;
    let snackBar: jasmine.SpyObj<MatSnackBar>;

    beforeEach(() => {
        const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

        TestBed.configureTestingModule({
            providers: [NotificationService, { provide: MatSnackBar, useValue: snackBarSpy }],
        });

        service = TestBed.inject(NotificationService);
        snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should open snackbar with the correct message and configuration', () => {
        const message = 'Test message';

        service.showMessage(message);

        expect(snackBar.open).toHaveBeenCalledWith(message, 'OK', {
            duration: 6000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
        });
    });

    it('should not call snackBar.open if the message is empty', () => {
        service.showMessage('');
        expect(snackBar.open).not.toHaveBeenCalled();
    });

    it('should not call snackBar.open if the message is undefined', () => {
        service.showMessage(undefined as unknown as string);
        expect(snackBar.open).not.toHaveBeenCalled();
    });
});
