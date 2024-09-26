import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { GridService } from '@app/services/grid.service';
import { GridComponent } from './grid.component';

describe('GridComponent', () => {
    let component: GridComponent;
    let fixture: ComponentFixture<GridComponent>;
    let gridServiceSpy: jasmine.SpyObj<GridService>;

    beforeEach(async () => {
        // Create a spy object for GridService
        gridServiceSpy = jasmine.createSpyObj('GridService', ['replaceImageOnTile', 'generateDefaultGrid', 'getGridTiles', 'addImageToTile', 'replaceWithDefault']);

        await TestBed.configureTestingModule({
            imports: [GridComponent, HttpClientModule],
            providers: [{ provide: GridService, useValue: gridServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(GridComponent);
        component = fixture.componentInstance;

        // Mock the gridTiles returned by the service
        gridServiceSpy.getGridTiles.and.returnValue([[{ images: ['assets/tiles/Door.png'] }]]);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should reverse door state if activeTile is door', () => {
        spyOn(component, 'reverseDoorState');
        component.activeTile = 'door';
        component.gridTiles = [
            [{ images: ['assets/tiles/Door.png'] }]
        ];
        component.applyTile(0, 0);
        expect(component.reverseDoorState).toHaveBeenCalledWith(0, 0);
    });

    it('should change door state to open if his state is closed', () => {
        component.gridTiles = [
            [{ images: ['assets/tiles/Door.png'] }]
        ];
        component.reverseDoorState(0, 0);
        expect(gridServiceSpy.replaceImageOnTile).toHaveBeenCalledWith(0, 0, 'assets/tiles/DoorOpen.png');
    });

    it('should change door state to closed if his state is open', () => {
        component.gridTiles = [
            [{ images: ['assets/tiles/DoorOpen.png'] }]
        ];
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

    // New test for onDrop method
    it('should add image to the correct tile on drop', () => {
        // Mock event data
        const mockEvent: CdkDragDrop<any> = {
            previousContainer: undefined!,
            container: { data: { row: 0, col: 0 } } as any, // Mocked target tile with row and col index
            previousIndex: 0,
            currentIndex: 0,
            item: { data: { link: 'assets/tiles/DoorOpen.png' } } as any, // Mocked dragged item with link property
            isPointerOverContainer: true,
            distance: { x: 0, y: 0 },
            // Add the missing `event` property with a default mock object
            event: new DragEvent('drop'), 
            dropPoint: { x: 0, y: 0 }
        };

        // Trigger the onDrop method with the mocked event
        component.onDrop(mockEvent);

        // Verify that the gridService's addImageToTile method was called with the correct parameters
        expect(gridServiceSpy.addImageToTile).toHaveBeenCalledWith(0, 0, 'assets/tiles/DoorOpen.png');
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
        component.gridTiles = [
            [{ images: ['assets/tiles/Wall.png'] }], // Not a door tile
        ];
        component.applyTile(0, 0);
        expect(component.reverseDoorState).not.toHaveBeenCalled();
    });
    
    it('should not call reverseDoorState when activeTile is not "door" regardless of currentTile', () => {
        spyOn(component, 'reverseDoorState');
        component.activeTile = 'floor'; // Not a door
        component.gridTiles = [
            [{ images: ['assets/tiles/Door.png'] }], // Even though this is a door tile
        ];
        component.applyTile(0, 0);
        expect(component.reverseDoorState).not.toHaveBeenCalled();
    });
});
