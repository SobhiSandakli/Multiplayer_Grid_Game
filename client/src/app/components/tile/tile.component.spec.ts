import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TileComponent } from './tile.component';

describe('ObjectContainerComponent', () => {
    let component: TileComponent;
    let fixture: ComponentFixture<TileComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TileComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TileComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set selectedTool correctly when selectTool is called', () => {
        const tool = 'test';
        component.selectTile(tool);
        expect(component.selectedTile).toBe(tool);
    });
    
});
