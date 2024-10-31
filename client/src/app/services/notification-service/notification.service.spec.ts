import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
    let service: NotificationService;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('MatSnackBar', ['open']);

        TestBed.configureTestingModule({
            providers: [
                NotificationService,
                { provide: MatSnackBar, useValue: spy },
            ],
        });

        service = TestBed.inject(NotificationService);
        snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    });

    it('should call snackBar.open with the correct message and action', () => {
        const message = 'Test message';
        service.showMessage(message);
        expect(snackBarSpy.open).toHaveBeenCalledWith(
            message,
            'OK',
            jasmine.any(Object) 
        );
    });
});

