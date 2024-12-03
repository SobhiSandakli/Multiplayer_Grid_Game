import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/game-model.interface';
import { DragDropService } from '@app/services/drag-and-drop/drag-and-drop.service';
import { GridService } from '@app/services/grid/grid.service';
import { GridSize, ObjectsImages } from 'src/constants/validate-constants';
import { ObjectContainerComponent } from './object-container.component';

class MockGridService {
    gridSize: number = GridSize.Small;
    getGridSize = jasmine.createSpy('getGridSize');
    getCounterByGridSize = jasmine.createSpy('getCounterByGridSize');
}

describe('ObjectContainerComponent', () => {
    let component: ObjectContainerComponent;
    let fixture: ComponentFixture<ObjectContainerComponent>;
    let mockDragDropService: jasmine.SpyObj<DragDropService>;
    let mockGridService: MockGridService;

    beforeEach(async () => {
        mockDragDropService = jasmine.createSpyObj('DragDropService', ['drop'], {
            objectsList: [
                { name: 'Started Points', count: 0, isDragAndDrop: false, link: ObjectsImages.StartPoint },
                { name: 'Random Items', count: 0, isDragAndDrop: false, link: ObjectsImages.RandomItems },
            ],
        });

        mockGridService = new MockGridService();

        await TestBed.configureTestingModule({
            declarations: [ObjectContainerComponent],
            imports: [DragDropModule],
            providers: [
                { provide: DragDropService, useValue: mockDragDropService },
                { provide: GridService, useValue: mockGridService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ObjectContainerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set startedPointsIndexInList and randomItemsIndexInList on ngOnInit', () => {
        component.ngOnInit();

        expect(component.startedPointsIndexInList).toBe(0);
        expect(component.randomItemsIndexInList).toBe(1);
    });

    it('should call resetDefaultContainer on ngOnInit', () => {
        spyOn(component, 'resetDefaultContainer');

        component.ngOnInit();

        expect(component.resetDefaultContainer).toHaveBeenCalled();
    });

    it('should reset object counts and isDragAndDrop in resetDefaultContainer', () => {
        mockGridService.gridSize = 4;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        mockGridService.getCounterByGridSize.and.returnValue(4);
        component.startedPointsIndexInList = 0;
        component.randomItemsIndexInList = 1;

        component.resetDefaultContainer();

        const expectedCount = 4;

        expect(component.objectsList[component.startedPointsIndexInList].count).toBe(expectedCount);
        expect(component.objectsList[component.randomItemsIndexInList].count).toBe(expectedCount);

        for (const object of component.objectsList) {
            expect(object.isDragAndDrop).toBeFalse();
        }
    });

    it('should call dragDropService.drop on drop event', () => {
        const event = {} as CdkDragDrop<unknown[]>;
        const index = 0;

        component.drop(event, index);

        expect(mockDragDropService.drop).toHaveBeenCalledWith(event, index);
    });

    it('should set container objects based on the provided game grid', () => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        mockGridService.getCounterByGridSize.and.returnValue(4);
        const game: Game = {
            grid: [
                [
                    { images: [ObjectsImages.StartPoint, ObjectsImages.StartPoint], isOccuped: true },
                    { images: [ObjectsImages.RandomItems], isOccuped: true },
                ],
                [
                    { images: [ObjectsImages.RandomItems], isOccuped: true },
                    { images: [], isOccuped: false },
                ],
            ],
            size: '15x15',
            _id: '',
            name: '',
            description: '',
            mode: '',
            image: '',
            date: new Date(),
            visibility: false,
        };

        component.startedPointsIndexInList = 0;
        component.randomItemsIndexInList = 1;

        component.setContainerObjects(game);

        expect(component.objectsList[component.startedPointsIndexInList].count).toBe(0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const defaultCount = 4;

        const expectedRandomItemsCount = defaultCount - 2;

        expect(component.objectsList[component.randomItemsIndexInList].count).toBe(expectedRandomItemsCount);
        expect(component.objectsList[component.randomItemsIndexInList].isDragAndDrop).toBeFalse();
    });

    it('should not throw error when objectsList is undefined', () => {
        mockDragDropService.objectsList = [];
        expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should set isDragAndDrop to true and count to 0 when defaultCount equals count', () => {
        component.randomItemsIndexInList = 1;
        component.objectsList = [
            { name: 'Some Object', description: 'Description of Some Object', link: 'link/to/some-object', count: 0, isDragAndDrop: false },
            {
                name: 'Random Items',
                count: 5,
                isDragAndDrop: false,
                description: '',
                link: '',
            },
        ];
        const defaultCount = GridSize.Medium;
        const count = GridSize.Medium;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any)['calculateCounterForRandomItems'](count, defaultCount);

        expect(component.objectsList[component.randomItemsIndexInList].isDragAndDrop).toBeTrue();
        expect(component.objectsList[component.randomItemsIndexInList].count).toBe(0);
    });
});
