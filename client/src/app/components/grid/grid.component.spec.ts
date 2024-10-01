import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DragDropService } from '@app/services/drag-and-drop.service';
import { GameService } from '@app/services/game.service';
import { GridService } from '@app/services/grid.service';
import { TileService } from '@app/services/tile.service';
import { GridComponent } from './grid.component';

describe('GridComponent', () => {
    let component: GridComponent;
    let gridService: jasmine.SpyObj<GridService>;
    let tileService: jasmine.SpyObj<TileService>;
    let gameService: jasmine.SpyObj<GameService>;
    let fixture: ComponentFixture<GridComponent>;
    let dragDropService: jasmine.SpyObj<DragDropService>;

    beforeEach(() => {
        gridService = jasmine.createSpyObj('GridService', ['generateDefaultGrid', 'replaceImageOnTile', 'getGridTiles']);
        tileService = jasmine.createSpyObj('TileService', ['getTileImage']);
        gameService = jasmine.createSpyObj('GameService', ['getGameConfig']);
        dragDropService = jasmine.createSpyObj('DragDropService', ['dropObjectBetweenCase']);

        TestBed.configureTestingModule({
            providers: [
                { provide: GridService, useValue: gridService },
                { provide: TileService, useValue: tileService },
                { provide: GameService, useValue: gameService },
                { provide: GameService, useValue: gameService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GridComponent);
        component = fixture.componentInstance;
        gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });
    it('should NOT call dropObjectBetweenCase if the image is not draggable', () => {
        const event = {
            item: { data: { image: 'assets/non-draggable-object.png' } },
        } as CdkDragDrop<{ image: string; row: number; col: number }>;
        spyOn(component, 'isDraggableImage').and.returnValue(false);
        component.moveObjectInGrid(event);
        expect(dragDropService.dropObjectBetweenCase).not.toHaveBeenCalled();
    });
    it('should replace image with grass when images length is 1', () => {
        const row = 0;
        const col = 0;
        const grassImage = 'assets/grass.png';
        tileService.getTileImage.and.returnValue(grassImage);
        component.gridTiles = [[{ images: ['assets/some-image.png'], isOccuped: false }]];
        component.deleteTile(row, col);
        expect(gridService.replaceImageOnTile).toHaveBeenCalledWith(row, col, grassImage);
    });

    it('should remove the last object and update object state when images length is 2', () => {
        const row = 0;
        const col = 0;
        const objectImage = 'assets/object.png';
        component.gridTiles = [[{ images: ['assets/some-image.png', objectImage], isOccuped: false }]];
        spyOn(component, 'updateObjectState');
        component.deleteTile(row, col);
        expect(component.gridTiles[row][col].images.length).toBe(1);
        expect(component.updateObjectState).toHaveBeenCalledWith(objectImage);
    });
    it('should apply a tile when handleMouseDown is called with left button', () => {
        component.activeTile = 'wall';
        const event = new MouseEvent('mousedown', { button: 0 });
        spyOn(component, 'applyTile');

        component.handleMouseDown(event, 0, 0);

        expect(component.isleftMouseDown).toBeTrue();
        expect(component.applyTile).toHaveBeenCalledWith(0, 0);
    });

    it('should delete a tile when handleMouseDown is called with right button', () => {
        const mockGrid = [
            [
                { isOccuped: true, images: [] },
                { isOccuped: true, images: [] },
            ],
        ];

        gridService.getGridTiles.and.returnValue(mockGrid);
        const event = new MouseEvent('mousedown', { button: 2 });
        spyOn(component, 'deleteTile');

        component.handleMouseDown(event, 0, 0);

        expect(component.isRightMouseDown).toBeTrue();
        expect(component.deleteTile).toHaveBeenCalledWith(0, 0);
        expect(gridService.getGridTiles()[0][0].isOccuped).toBeFalse();
    });
    it('should apply tile during mouse move if left mouse is down', () => {
        component.isleftMouseDown = true;
        spyOn(component, 'applyTile');

        component.handleMouseMove(1, 1);

        expect(component.applyTile).toHaveBeenCalledWith(1, 1);
    });

    it('should delete tile during mouse move if right mouse is down', () => {
        component.isRightMouseDown = true;
        spyOn(component, 'deleteTile');

        component.handleMouseMove(1, 1);

        expect(component.deleteTile).toHaveBeenCalledWith(1, 1);
    });
    it('should stop left mouse action on mouse up', () => {
        const event = new MouseEvent('mouseup', { button: 0 });

        component.handleMouseUp(event);

        expect(component.isleftMouseDown).toBeFalse();
    });

    it('should stop right mouse action on mouse up', () => {
        const event = new MouseEvent('mouseup', { button: 2 });

        component.handleMouseUp(event);

        expect(component.isRightMouseDown).toBeFalse();
    });

    it('should apply the correct tile on applyTile', () => {
        component.gridTiles = [[{ images: ['assets/tiles/grass.png'], isOccuped: false }]];
        component.activeTile = 'wall';
        const tileImage = 'assets/tiles/wall.png';
        tileService.getTileImage.and.returnValue(tileImage);

        component.applyTile(0, 0);

        expect(gridService.replaceImageOnTile).toHaveBeenCalledWith(0, 0, tileImage);
    });

    it('should reverse door state correctly', () => {
        const doorImage = 'assets/tiles/Door.png';
        const doorOpenImage = 'assets/tiles/DoorOpen.png';

        tileService.getTileImage.and.callFake((tile: string) => {
            if (tile === 'door') return doorImage;
            if (tile === 'doorOpen') return doorOpenImage;
            return '';
        });
        component.gridTiles = [[{ images: [doorImage], isOccuped: false }], [{ images: [doorOpenImage], isOccuped: false }]];
        component.reverseDoorState(0, 0);
        expect(gridService.replaceImageOnTile).toHaveBeenCalledWith(0, 0, doorOpenImage);

        component.reverseDoorState(1, 0);
        expect(gridService.replaceImageOnTile).toHaveBeenCalledWith(1, 0, doorImage);
    });
    it('should increment object counter in updateObjectState', () => {
        component['objectsList'] = [{ name: 'Object', description: 'An object', link: 'assets/object.png', count: 1, isDragAndDrop: true }];

        component.updateObjectState('assets/object.png');

        const updatedObject = component['objectsList'][0];
        expect(updatedObject.count).toBe(2);
        expect(updatedObject.isDragAndDrop).toBeFalse();
    });
    it('should call reverseDoorState if the active tile is a door and the current tile contains Door or DoorOpen', () => {
        component.activeTile = 'door';
        component.gridTiles = [[{ images: ['assets/tiles/Door.png'], isOccuped: false }]];
        const reverseDoorStateSpy = spyOn(component, 'reverseDoorState');

        component.applyTile(0, 0);

        expect(reverseDoorStateSpy).toHaveBeenCalledWith(0, 0);
    });
});
