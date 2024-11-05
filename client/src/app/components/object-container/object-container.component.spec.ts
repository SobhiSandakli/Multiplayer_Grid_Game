// object-container.component.spec.ts

import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/game-model.interface';
import { DragDropService } from '@app/services/drag-and-drop/drag-and-drop.service';
import { GridService } from '@app/services/grid/grid.service';
import * as objectConstant from 'src/constants/objects-constants';
import { GridSize, ObjectsImages } from 'src/constants/validate-constants';
import { ObjectContainerComponent } from './object-container.component';

class MockGridService {
    gridSize: number = GridSize.Small;
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
                // Add more objects as needed for testing
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

    it('should reset object counts and isDragAndDrop flags in resetDefaultContainer', () => {
        mockGridService.gridSize = GridSize.Medium;
        component.startedPointsIndexInList = 0;
        component.randomItemsIndexInList = 1;

        component.resetDefaultContainer();

        const expectedCount = objectConstant.MAX_COUNTER_MEDIUM_GRID;

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
        const defaultCount = (component as any)['getCounterByGridSize'](GridSize.Medium);

        // console.log('defaultCount:', defaultCount); // Check the value of defaultCount

        const expectedRandomItemsCount = defaultCount - 2;

        expect(component.objectsList[component.randomItemsIndexInList].count).toBe(expectedRandomItemsCount);
        expect(component.objectsList[component.randomItemsIndexInList].isDragAndDrop).toBeFalse();
    });

    it('should not throw error when objectsList is undefined', () => {
        mockDragDropService.objectsList = [];
        expect(() => component.ngOnInit()).not.toThrow();
    });
    it('should return MAX_COUNTER_SMALL_GRID for GridSize.Small', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (component as any)['getCounterByGridSize'](GridSize.Small);
        expect(result).toBe(objectConstant.MAX_COUNTER_SMALL_GRID);
    });

    it('should return MAX_COUNTER_MEDIUM_GRID for GridSize.Medium', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (component as any)['getCounterByGridSize'](GridSize.Medium);
        expect(result).toBe(objectConstant.MAX_COUNTER_MEDIUM_GRID);
    });

    it('should return MAX_COUNTER_LARGE_GRID for GridSize.Large', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (component as any)['getCounterByGridSize'](GridSize.Large);
        expect(result).toBe(objectConstant.MAX_COUNTER_LARGE_GRID);
    });

    it('should return 0 for unrecognized grid size', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (component as any)['getCounterByGridSize'](-1);
        expect(result).toBe(0);
    });
    it('should set isDragAndDrop to true and count to 0 when defaultCount equals count', () => {
        component.randomItemsIndexInList = 1;
        component.objectsList = [
            { name: 'Some Object', count: 0, isDragAndDrop: false },
            { name: 'Random Items', count: 5, isDragAndDrop: false },
        ];
        const defaultCount = 5;
        const count = 5;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any)['calculateCounterForRandomItems'](count, defaultCount);

        expect(component.objectsList[component.randomItemsIndexInList].isDragAndDrop).toBeTrue();
        expect(component.objectsList[component.randomItemsIndexInList].count).toBe(0);
    });
});
