import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaitingViewComponent } from './waiting-page.component';
const MIN_CODE = 1000;
const MAX_CODE = 9999;
describe('WaitingViewComponent', () => {
    let component: WaitingViewComponent;
    let fixture: ComponentFixture<WaitingViewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WaitingViewComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should generate a valid access code on init', () => {
        // Arrange: Spy on the generateAccessCode method
        spyOn(component, 'generateAccessCode').and.callThrough();

        // Act: Trigger ngOnInit
        component.ngOnInit();

        // Assert: Verify the access code was generated
        expect(component.generateAccessCode).toHaveBeenCalled();
        expect(component.accessCode).toBeTruthy();

        // Assert: Check if the access code is within the valid range
        const accessCodeNumber = parseInt(component.accessCode, 10);
        expect(accessCodeNumber).toBeGreaterThanOrEqual(MIN_CODE);
        expect(accessCodeNumber).toBeLessThanOrEqual(MAX_CODE);
    });

    it('should generate a new access code using generateAccessCode method', () => {
        // Act: Call the method to generate a new access code
        component.generateAccessCode();
        fixture.detectChanges();

        // Assert: Verify the access code is in the valid range
        const accessCodeNumber = parseInt(component.accessCode, 10);
        expect(accessCodeNumber).toBeGreaterThanOrEqual(MIN_CODE);
        expect(accessCodeNumber).toBeLessThanOrEqual(MAX_CODE);
    });

    it('should generate different access codes on multiple calls', () => {
        // Act: Generate two different access codes
        component.generateAccessCode();
        const firstCode = component.accessCode;

        component.generateAccessCode();
        const secondCode = component.accessCode;

        // Assert: Check that the two generated codes are not equal
        expect(firstCode).not.toEqual(secondCode);
    });
});
