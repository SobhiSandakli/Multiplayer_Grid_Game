import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GridSize } from '@app/classes/grid-size.enum';
import { GridService } from '@app/services/grid.service';
import { ObjectContainerComponent } from './object-container.component';
describe('ObjectContainerComponent', () => {
    let component: ObjectContainerComponent;
    let fixture: ComponentFixture<ObjectContainerComponent>;
    let mockGridService: jasmine.SpyObj<GridService>;
    const gridSizeSmall = 2;
    const gridSizeMeduim = 4;
    const gridSizeLarge = 6;
    const initCount = 6;

    beforeEach(async () => {
        mockGridService = jasmine.createSpyObj('GridService', ['addObjectToTile', 'getGridTiles']);
        mockGridService.getGridTiles.and.returnValue([
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
        ]);

        await TestBed.configureTestingModule({
            imports: [ObjectContainerComponent],
            providers: [{ provide: GridService, useValue: mockGridService }],
        }).compileComponents();

        fixture = TestBed.createComponent(ObjectContainerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return 2 for GridSize.Small', () => {
        const result = component.getNumberByGridSize(GridSize.Small);
        expect(result).toBe(gridSizeSmall);
    });

    it('should return 4 for GridSize.Medium', () => {
        const result = component.getNumberByGridSize(GridSize.Medium);
        expect(result).toBe(gridSizeMeduim);
    });

    it('should return 6 for GridSize.Large', () => {
        const result = component.getNumberByGridSize(GridSize.Large);
        expect(result).toBe(gridSizeLarge);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize counts based on grid size on ngOnInit', () => {
        component.ngOnInit();
        expect(component.objectsList[component.randomItemsIndexInList].count).toBe(initCount);
        expect(component.objectsList[component.startedPointsIndexInList].count).toBe(initCount);
    });

    it('should validate drop zone correctly', () => {
        const element = document.createElement('div');
        element.classList.add('drop-zone');
        element.id = '0,0,image';
        const result = component.isDropZoneValid(element);
        expect(result).toBeTrue();
    });

    it('should handle drop event correctly', () => {
        const event = {
            event: { target: document.createElement('div') },
            item: { data: 'test-data' },
        } as unknown as CdkDragDrop<unknown[]>;
        (event.event.target as HTMLElement).classList.add('drop-zone');
        if (event.event.target) {
            (event.event.target as HTMLElement).id = '0,0,image';
        }

        component.drop(event, component.randomItemsIndexInList);
        expect(mockGridService.addObjectToTile).toHaveBeenCalledWith(0, 0, 'test-data');
        expect(component.tile.isOccuped).toBeTrue();
    });

    it('should decrement count correctly in counter method for random items', () => {
        component.objectsList[component.randomItemsIndexInList].count = 2;
        const result = component.counter(component.randomItemsIndexInList);
        expect(result).toBeTrue();
        expect(component.objectsList[component.randomItemsIndexInList].count).toBe(1);
    });

    it('should set count to 0 and mark as drag and drop when count is 1 in counter method', () => {
        component.objectsList[component.randomItemsIndexInList].count = 1;
        const result = component.counter(component.randomItemsIndexInList);
        expect(result).toBeTrue();
        expect(component.objectsList[component.randomItemsIndexInList].count).toBe(0);
        expect(component.objectsList[component.randomItemsIndexInList].isDragAndDrop).toBeTrue();
    });

    it('should return false when count is 0 in counter method', () => {
        component.objectsList[component.randomItemsIndexInList].count = 0;
        const result = component.counter(component.randomItemsIndexInList);
        expect(result).toBeFalse();
    });

    it('should return false for an invalid drop zone', () => {
        const element = document.createElement('div');
        element.classList.add('drop-zone');
        element.id = '0,0,image';
        mockGridService.getGridTiles.and.returnValue([
            [
                { images: [], isOccuped: true },
                { images: [], isOccuped: false },
            ],
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
        ]);
        const result = component.isDropZoneValid(element);
        expect(result).toBeFalse();
    });

    it('should return false if element is null', () => {
        const result = component.isDropZoneValid(null);
        expect(result).toBeFalse();
    });

    it('should return false if element does not have drop-zone class', () => {
        const element = document.createElement('div');
        element.id = '0,0,image';
        const result = component.isDropZoneValid(element);
        expect(result).toBeFalse();
    });

    it('should clear tile images if length is 2 or more', () => {
        const element = document.createElement('div');
        element.classList.add('drop-zone');
        element.id = '0,0,image';
        component.tile.image = ['image1', 'image2'];
        const result = component.isDropZoneValid(element);
        expect(result).toBeTrue();
        expect(component.tile.image).toContain('image');
        expect(component.tile.image.length).toBe(1);
    });

    it('should decrement count for started points and return if counter is true', () => {
        const event = {
            event: { target: document.createElement('div') },
            item: { data: 'test-data' },
        } as unknown as CdkDragDrop<unknown[]>;
        (event.event.target as HTMLElement).classList.add('drop-zone');
        (event.event.target as HTMLElement).id = '0,0,image';

        component.objectsList[component.startedPointsIndexInList].count = 2;
        component.drop(event, component.startedPointsIndexInList);
        expect(component.objectsList[component.startedPointsIndexInList].count).toBe(1);
        expect(component.objectsList[component.startedPointsIndexInList].isDragAndDrop).toBeFalse();
    });

    it('should set isDragAndDrop to true if counter is false', () => {
        const event = {
            event: { target: document.createElement('div') },
            item: { data: 'test-data' },
        } as unknown as CdkDragDrop<unknown[]>;
        (event.event.target as HTMLElement).classList.add('drop-zone');
        (event.event.target as HTMLElement).id = '0,0,image';

        component.objectsList[component.randomItemsIndexInList].count = 0;
        component.drop(event, component.randomItemsIndexInList);
        expect(component.objectsList[component.randomItemsIndexInList].isDragAndDrop).toBeTrue();
    });
});
