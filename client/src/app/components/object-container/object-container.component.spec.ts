// import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { GridSize } from 'src/constants/validate-constants';
// import { DragDropService } from '@app/services/drag-and-drop/drag-and-drop.service';
// import { ObjectContainerComponent } from './object-container.component';

// describe('ObjectContainerComponent', () => {
//     let component: ObjectContainerComponent;
//     let fixture: ComponentFixture<ObjectContainerComponent>;
//     let mockDragDropService: jasmine.SpyObj<DragDropService>;
//     const COUNTER_SIZE_SMALL = 2;
//     const COUNTER_SIZE_MEDIUM = 4;
//     const COUNTER_SIZE_LARGE = 6;

//     beforeEach(async () => {
//         mockDragDropService = jasmine.createSpyObj('DragDropService', ['drop']);

//         await TestBed.configureTestingModule({
//             declarations: [ObjectContainerComponent],
//             imports: [DragDropModule],
//             providers: [{ provide: DragDropService, useValue: mockDragDropService }],
//         }).compileComponents();

//         fixture = TestBed.createComponent(ObjectContainerComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should return 2 for GridSize.Small', () => {
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const result = (component as any).getCounterByGridSize(GridSize.Small);
//         expect(result).toBe(COUNTER_SIZE_SMALL);
//     });

//     it('should return 4 for GridSize.Medium', () => {
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const result = (component as any).getCounterByGridSize(GridSize.Medium);
//         expect(result).toBe(COUNTER_SIZE_MEDIUM);
//     });

//     it('should return 6 for GridSize.Large', () => {
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const result = (component as any).getCounterByGridSize(GridSize.Large);
//         expect(result).toBe(COUNTER_SIZE_LARGE);
//     });

//     it('should return 0 for unrecognized GridSize', () => {
//         const invalidSize = 'invalid' as unknown as GridSize;
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const result = (component as any).getCounterByGridSize(invalidSize);
//         expect(result).toBe(0);
//     });

//     it('should call dragDropService.drop on drop event', () => {
//         const event = {} as CdkDragDrop<unknown[]>;
//         const index = 0;
//         component.drop(event, index);
//         expect(mockDragDropService.drop).toHaveBeenCalledWith(event, index);
//     });
// });
