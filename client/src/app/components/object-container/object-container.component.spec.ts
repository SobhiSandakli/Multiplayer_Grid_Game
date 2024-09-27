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
});
