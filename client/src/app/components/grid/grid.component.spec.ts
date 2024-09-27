import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GridService } from '@app/services/grid.service';
import { GridComponent } from './grid.component';

describe('GridComponent', () => {
    let component: GridComponent;
    let fixture: ComponentFixture<GridComponent>;
    let gridServiceSpy: jasmine.SpyObj<GridService>;

    beforeEach(async () => {
        gridServiceSpy = jasmine.createSpyObj('GridService', [
            'replaceImageOnTile',
            'generateDefaultGrid',
            'getGridTiles',
            'addImageToTile',
            'replaceWithDefault',
        ]);

        await TestBed.configureTestingModule({
            imports: [GridComponent, HttpClientModule],
            providers: [{ provide: GridService, useValue: gridServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(GridComponent);
        component = fixture.componentInstance;

        gridServiceSpy.getGridTiles.and.returnValue([[{ images: ['assets/tiles/Door.png'] }]]);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should reverse door state if activeTile is door', () => {
        spyOn(component, 'reverseDoorState');
        component.activeTile = 'door';
        component.gridTiles = [[{ images: ['assets/tiles/Door.png'] }]];
        component.applyTile(0, 0);
        expect(component.reverseDoorState).toHaveBeenCalledWith(0, 0);
    });

    it('should change door state to open if his state is closed', () => {
        component.gridTiles = [[{ images: ['assets/tiles/Door.png'] }]];
        component.reverseDoorState(0, 0);
        expect(gridServiceSpy.replaceImageOnTile).toHaveBeenCalledWith(0, 0, 'assets/tiles/DoorOpen.png');
    });

    it('should change door state to closed if his state is open', () => {
        component.gridTiles = [[{ images: ['assets/tiles/DoorOpen.png'] }]];
        component.reverseDoorState(0, 0);
        expect(gridServiceSpy.replaceImageOnTile).toHaveBeenCalledWith(0, 0, 'assets/tiles/Door.png');
    });

    it('should stop behavior on dragstart', () => {
        const event = new DragEvent('dragstart');
        spyOn(event, 'preventDefault');
        component.onDragStart(event);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should apply a tile with left mouse click', () => {
        spyOn(component, 'applyTile');

        const event = new MouseEvent('mousedown', { button: 0 });
        component.handleMouseDown(event, 0, 0);

        expect(component.applyTile).toHaveBeenCalledWith(0, 0);
    });

    it('should delete a tile with right mouse click', () => {
        spyOn(component, 'deleteTile');

        const event = new MouseEvent('mousedown', { button: 2 });
        component.handleMouseDown(event, 0, 0);

        expect(component.deleteTile).toHaveBeenCalledWith(0, 0);
    });

    it('should apply tiles continuously when left mouse is held down', () => {
        spyOn(component, 'applyTile');
        const eventDown = new MouseEvent('mousedown', { button: 0 });
        component.handleMouseDown(eventDown, 0, 0);
        component.handleMouseMove(0, 1);
        expect(component.applyTile).toHaveBeenCalledWith(0, 1);
    });

    it('should delete tiles continuously when right mouse is held down', () => {
        spyOn(component, 'deleteTile');
        const eventDown = new MouseEvent('mousedown', { button: 2 });
        component.handleMouseDown(eventDown, 0, 0);
        component.handleMouseMove(0, 1);
        expect(component.deleteTile).toHaveBeenCalledWith(0, 1);
    });

    it('should stop applying tiles when left mouse is released', () => {
        const eventDown = new MouseEvent('mousedown', { button: 0 });
        component.handleMouseDown(eventDown, 0, 0);
        expect(component.isleftMouseDown).toBeTrue();
        const eventUp = new MouseEvent('mouseup', { button: 0 });
        component.handleMouseUp(eventUp);
        expect(component.isleftMouseDown).toBeFalse();
    });

    it('should stop deleting tiles when right mouse is released', () => {
        const eventDown = new MouseEvent('mousedown', { button: 2 });
        component.handleMouseDown(eventDown, 0, 0);
        expect(component.isRightMouseDown).toBeTrue();
        const eventUp = new MouseEvent('mouseup', { button: 2 });
        component.handleMouseUp(eventUp);
        expect(component.isRightMouseDown).toBeFalse();
    });
    it('should call reverseDoorState when activeTile is "door" and currentTile includes "Door"', () => {
        spyOn(component, 'reverseDoorState');
        component.activeTile = 'door';
        component.gridTiles = [[{ images: ['assets/tiles/Door.png'] }]];
        component.applyTile(0, 0);
        expect(component.reverseDoorState).toHaveBeenCalledWith(0, 0);
    });

    it('should call reverseDoorState when activeTile is "door" and currentTile includes "DoorOpen"', () => {
        spyOn(component, 'reverseDoorState');
        component.activeTile = 'door';
        component.gridTiles = [[{ images: ['assets/tiles/DoorOpen.png'] }]];
        component.applyTile(0, 0);
        expect(component.reverseDoorState).toHaveBeenCalledWith(0, 0);
    });

    it('should not call reverseDoorState when activeTile is "door" but currentTile does not include "Door" or "DoorOpen"', () => {
        spyOn(component, 'reverseDoorState');
        component.activeTile = 'door';
        component.gridTiles = [[{ images: ['assets/tiles/Wall.png'] }]];
        component.applyTile(0, 0);
        expect(component.reverseDoorState).not.toHaveBeenCalled();
    });

    it('should not call reverseDoorState when activeTile is not "door" regardless of currentTile', () => {
        spyOn(component, 'reverseDoorState');
        component.activeTile = 'floor';
        component.gridTiles = [[{ images: ['assets/tiles/Door.png'] }]];
        component.applyTile(0, 0);
        expect(component.reverseDoorState).not.toHaveBeenCalled();
    });
});
