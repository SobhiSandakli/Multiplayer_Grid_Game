// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { WaitingViewComponent } from './waiting-page.component';
// const MIN_CODE = 1000;
// const MAX_CODE = 9999;
// describe('WaitingViewComponent', () => {
//     let component: WaitingViewComponent;
//     let fixture: ComponentFixture<WaitingViewComponent>;

//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             imports: [WaitingViewComponent],
//         }).compileComponents();

//         fixture = TestBed.createComponent(WaitingViewComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     it('should create the component', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should generate a valid access code on init', () => {
//         spyOn<any>(component, 'generateAccessCode').and.callThrough();
//         component.ngOnInit();
//         //expect(component.generateAccessCode).toHaveBeenCalled();
//         expect(component.accessCode).toBeTruthy();
//         const accessCodeNumber = parseInt(component.accessCode, 10);
//         expect(accessCodeNumber).toBeGreaterThanOrEqual(MIN_CODE);
//         expect(accessCodeNumber).toBeLessThanOrEqual(MAX_CODE);
//     });

//     it('should generate a new access code using generateAccessCode method', () => {
//         // component.generateAccessCode();
//         fixture.detectChanges();
//         const accessCodeNumber = parseInt(component.accessCode, 10);
//         expect(accessCodeNumber).toBeGreaterThanOrEqual(MIN_CODE);
//         expect(accessCodeNumber).toBeLessThanOrEqual(MAX_CODE);
//     });

//     it('should generate different access codes on multiple calls', () => {
//         //component.generateAccessCode();
//         const firstCode = component.accessCode;
//         //component.generateAccessCode();
//         const secondCode = component.accessCode;
//         expect(firstCode).not.toEqual(secondCode);
//     });
// });
