import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GridSize } from '../../classes/grid-size.enum';
import { GridService } from '../../services/grid.service';
import { ObjectContainerComponent } from './object-container.component';
describe('ObjectContainerComponent', () => {
    let component: ObjectContainerComponent;
    let fixture: ComponentFixture<ObjectContainerComponent>;
    let mockGridService: jasmine.SpyObj<GridService>;

    beforeEach(async () => {
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
        expect(result).toBe(2);
    });

    it('should return 4 for GridSize.Medium', () => {
        const result = component.getNumberByGridSize(GridSize.Medium);
        expect(result).toBe(4);
    });

    it('should return 6 for GridSize.Large', () => {
        const result = component.getNumberByGridSize(GridSize.Large);
        expect(result).toBe(6);
    });

    it('should initialize object counts on ngOnInit', () => {
        component.ngOnInit();
        expect(component.objectsList[6].count).toEqual(6); // Correspond à GridSize.Large
        expect(component.objectsList[7].count).toEqual(6);
    });

    it('should decrement count when counter is called', () => {
        component.objectsList[6].count = 3;
        const result = component.counter(6);
        expect(component.objectsList[6].count).toEqual(2);
        expect(result).toBeTrue();
    });

    it('should set count to 0 when count is 1', () => {
        component.objectsList[6].count = 1;
        const result = component.counter(6);
        expect(component.objectsList[6].count).toEqual(0);
        expect(component.objectsList[6].isDragAndDrop).toBeTrue();
        expect(result).toBeTrue();
    });

    it('should return false when count is 0', () => {
        component.objectsList[6].count = 0;
        const result = component.counter(6);
        expect(result).toBeFalse();
    });

    it('should place object when drop is called on valid tile', () => {
        const event = {
            event: { target: document.createElement('div') },
            item: { data: 'object-data' },
        };
        const index = 6;
        spyOn(component, 'isDropZoneValid').and.returnValue(true);

        component.drop(event as unknown, index);

        expect(component.isDropZoneValid).toHaveBeenCalledWith(event.event.target as Element);
        expect(mockGridService.addObjectToTile).toHaveBeenCalledWith(0, 0, 'object-data');
        expect(component.tile.isOccuped).toBeTrue();
    });

    it('should not place object when drop is called on invalid tile', () => {
        const event = {
            event: { target: document.createElement('div') },
            item: { data: 'object-data' },
        };
        const index = 6;
        spyOn(component, 'isDropZoneValid').and.returnValue(false);

        component.drop(event as unknown, index);

        expect(component.isDropZoneValid).toHaveBeenCalledWith(event.event.target as Element);
        expect(mockGridService.addObjectToTile).not.toHaveBeenCalled();
        expect(component.tile.isOccuped).toBeFalse();
    });
});
