import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { DragDropService } from './drag-and-drop.service';
import { GridService } from './grid.service';

describe('DragDropService', () => {
    let service: DragDropService;
    let gridService: jasmine.SpyObj<GridService>;

    beforeEach(() => {
        gridService = jasmine.createSpyObj('GridService', ['addObjectToTile', 'getGridTiles']);
        TestBed.configureTestingModule({
            providers: [{ provide: GridService, useValue: gridService }],
        });
        service = TestBed.inject(DragDropService);
    });

    it('should initialize the service with default values', () => {
        expect(service.objectsList).toBeDefined();
        expect(service.previousCoordinates).toEqual({ row: null, column: null });
        expect(service.dragInProgressSubject).toBeInstanceOf(BehaviorSubject);
        expect(service.tile).toEqual({ x: 0, y: 0, image: [], isOccuped: false });
    });

    describe('drop', () => {
        it('should add object to tile and set isDragAndDrop to true for valid drop zone', () => {
            spyOn(service, 'isDropZoneValid').and.returnValue(true);
            const event = { event: { target: {} }, item: { data: 'object-data' } } as CdkDragDrop<unknown[]>;
            const index = 0;
            service.objectsList[index] = {
                name: 'Test Object',
                description: 'Test Description',
                link: 'http://test-link',
                isDragAndDrop: false,
                count: 1,
            };

            service.drop(event, index);

            expect(service.isDropZoneValid).toHaveBeenCalled();
            expect(gridService.addObjectToTile).toHaveBeenCalledWith(0, 0, 'object-data');
            expect(service.tile.isOccuped).toBeTrue();
            expect(service.objectsList[index].isDragAndDrop).toBeTrue();
        });

        it('should not add object to tile for invalid drop zone', () => {
            spyOn(service, 'isDropZoneValid').and.returnValue(false);
            const event = { event: { target: {} }, item: { data: 'object-data' } } as CdkDragDrop<unknown[]>;
            const index = 0;

            service.drop(event, index);

            expect(service.isDropZoneValid).toHaveBeenCalled();
            expect(gridService.addObjectToTile).not.toHaveBeenCalled();
        });

        it('should handle Random Items and Started Points correctly', () => {
            spyOn(service, 'counter').and.returnValue(true);
            spyOn(service, 'isDropZoneValid').and.returnValue(true);

            const event = { event: { target: {} }, item: { data: 'object-data' } } as CdkDragDrop<unknown[]>;
            service.randomItemsIndexInList = 1;
            service.startedPointsIndexInList = 2;

            service.objectsList[1] = {
                name: 'Random Items',
                description: 'Random Items Description',
                link: 'http://random-items-link',
                isDragAndDrop: false,
                count: 1,
            };
            service.objectsList[2] = {
                name: 'Started Points',
                description: 'Started Points Description',
                link: 'http://started-points-link',
                isDragAndDrop: false,
                count: 1,
            };

            service.drop(event, 1);
            service.drop(event, 2);

            expect(service.counter).toHaveBeenCalledTimes(2);
        });
    });

    describe('dropGrid', () => {
        it('should add object to tile for valid drop zone', () => {
            spyOn(service, 'isDropZoneValid').and.returnValue(true);
            const event = { event: { target: {} }, item: { data: 'object-data' } } as CdkDragDrop<unknown[]>;

            service.dropGrid(event);

            expect(service.isDropZoneValid).toHaveBeenCalled();
            expect(gridService.addObjectToTile).toHaveBeenCalledWith(0, 0, 'object-data');
            expect(service.tile.isOccuped).toBeTrue();
        });

        it('should not add object to tile for invalid drop zone', () => {
            spyOn(service, 'isDropZoneValid').and.returnValue(false);
            const event = { event: { target: {} }, item: { data: 'object-data' } } as CdkDragDrop<unknown[]>;

            service.dropGrid(event);

            expect(service.isDropZoneValid).toHaveBeenCalled();
            expect(gridService.addObjectToTile).not.toHaveBeenCalled();
        });
    });

    describe('isDropZoneValid', () => {
        it('should return true for valid drop zone', () => {
            const element = document.createElement('div');
            element.classList.add('drop-zone');
            element.id = '1,2,some-image';
            gridService.getGridTiles.and.returnValue([[{ isOccuped: false, images: [] }], [{ isOccuped: false, images: [] }]]);

            const result = service.isDropZoneValid(element);

            expect(result).toBeTrue();
            expect(service.tile.x).toBe(1);
            expect(service.tile.y).toBe(2);
            expect(service.tile.image).toContain('some-image');
        });

        it('should return false for occupied tile', () => {
            const element = document.createElement('div');
            element.classList.add('drop-zone');
            element.id = '0,0,some-image';
            gridService.getGridTiles.and.returnValue([[{ isOccuped: true, images: [] }]]);

            const result = service.isDropZoneValid(element);

            expect(result).toBeFalse();
        });

        it('should return false for non-drop zone element', () => {
            const element = document.createElement('div');

            const result = service.isDropZoneValid(element);

            expect(result).toBeFalse();
        });

        it('should reset tile images if there are more than 2 images', () => {
            const mockElement = document.createElement('div');
            mockElement.classList.add('drop-zone');
            mockElement.id = '1,1,image3';

            // Simulate tile with 3 images
            service.tile.image = ['image1', 'image2', 'image3'];
            const result = service.isDropZoneValid(mockElement);

            expect(service.tile.image).toEqual([]); // Verify that tile images are reset
            expect(result).toBe(true);
        });
    });

    describe('counter', () => {
        it('should decrement object count and return true when count is greater than 1', () => {
            const index = 0;
            service.objectsList[index] = {
                name: 'Test Object',
                description: 'Test Description',
                link: 'http://test-link',
                count: 2,
                isDragAndDrop: false,
            };

            const result = service.counter(index);

            expect(result).toBeTrue();
            expect(service.objectsList[index].count).toBe(1);
        });

        it('should set count to 0 and set isDragAndDrop to true when count is 1', () => {
            const index = 0;
            service.objectsList[index] = {
                name: 'Test Object',
                description: 'Test Description',
                link: 'http://test-link',
                count: 1,
                isDragAndDrop: false,
            };

            const result = service.counter(index);

            expect(result).toBeTrue();
            expect(service.objectsList[index].count).toBe(0);
            expect(service.objectsList[index].isDragAndDrop).toBeTrue();
        });

        it('should return false when count is not greater than 0', () => {
            const index = 0;
            service.objectsList[index] = {
                name: 'Test Object',
                description: 'Test Description',
                link: 'http://test-link',
                count: 0,
                isDragAndDrop: false,
            };

            const result = service.counter(index);

            expect(result).toBeFalse();
        });
    });

    describe('incrementCounter', () => {
        it('should increment object count and reset isDragAndDrop to false', () => {
            const index = 0;
            service.objectsList[index] = {
                name: 'Test Object',
                description: 'Test Description',
                link: 'http://test-link',
                count: 1,
                isDragAndDrop: true,
            };

            service.incrementCounter(index);

            expect(service.objectsList[index].count).toBe(2);
            expect(service.objectsList[index].isDragAndDrop).toBeFalse();
        });
    });
});
