import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TileService } from '@app/services/tile.service';
import { TileComponent } from './tile.component';
import SpyObj = jasmine.SpyObj;

describe('ObjectContainerComponent', () => {
    let component: TileComponent;
    let fixture: ComponentFixture<TileComponent>;
    let mockTileService: SpyObj<TileService>;

    beforeEach(async () => {
        mockTileService = jasmine.createSpyObj('TileService', ['setSelectedTile']);
        await TestBed.configureTestingModule({
            declarations: [TileComponent],  
            providers: [{ provide: TileService, useValue: mockTileService }] 
        }).compileComponents();

        fixture = TestBed.createComponent(TileComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set selectedTile correctly when selectTile is called', () => {
        const tile = 'test';
        component.selectTile(tile);
        expect(component.selectedTile).toBe(tile);
        expect(mockTileService.setSelectedTile).toHaveBeenCalledWith(tile);  // Ensure the service is called
    });
});