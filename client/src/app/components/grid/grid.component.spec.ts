import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DragDropService } from '@app/services/drag-and-drop/drag-and-drop.service';
import { GameService } from '@app/services/game/game.service';
import { GridService } from '@app/services/grid/grid.service';
import { TileService } from '@app/services/tile/tile.service';
import { of } from 'rxjs';
import { DEFAULT_TILES } from 'src/constants/tiles-constants';
import { GridComponent } from './grid.component';

describe('GridComponent', () => {
    let component: GridComponent;
    let fixture: ComponentFixture<GridComponent>;
    let mockGridService: jasmine.SpyObj<GridService>;
    let mockTileService: jasmine.SpyObj<TileService>;
    let mockGameService: jasmine.SpyObj<GameService>;
    let mockDragDropService: jasmine.SpyObj<DragDropService>;

    beforeEach(async () => {
        mockGridService = jasmine.createSpyObj(
            'GridService',
            [
                'generateDefaultGrid',
                'getTileType',
                'getObjectOnTile',
                'replaceImageOnTile',
                'setTileToCell',
                'setCellToUnoccupied',
                'getGridTiles',
                'removeObjectFromTile',
                'setCellToOccupied',
            ],
            { gridTiles$: of([[{ images: ['tile1'], isOccuped: false }]]) },
        );
        mockTileService = jasmine.createSpyObj('TileService', ['getTileImageSrc', 'removeObjectFromTile', 'addObjectToTile'], {
            selectedTile$: of('wall'),
        });
        mockGameService = jasmine.createSpyObj('GameService', ['getGameConfig']);
        mockDragDropService = jasmine.createSpyObj('DragDropService', ['dropObjectBetweenCase'], { objectsList$: of([]) });

        await TestBed.configureTestingModule({
            declarations: [GridComponent],
            providers: [
                { provide: GridService, useValue: mockGridService },
                { provide: TileService, useValue: mockTileService },
                { provide: GameService, useValue: mockGameService },
                { provide: DragDropService, useValue: mockDragDropService },
                ChangeDetectorRef,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize grid on ngOnInit', () => {
        mockGameService.getGameConfig.and.returnValue({ size: 'medium', mode: 'classic' });
        component.ngOnInit();
        expect(mockGridService.generateDefaultGrid).toHaveBeenCalledWith(15);
    });

    it('should subscribe to grid changes on ngOnInit', () => {
        const gridTiles = [[{ images: ['tile1'], isOccuped: false }]];
        mockGridService.gridTiles$ = of(gridTiles);
        component.ngOnInit();
        expect(component.gridTiles).toEqual(gridTiles);
    });

    it('should handle mouse down for left click to apply tile', () => {
        component.activeTile = 'wall';
        mockTileService.getTileImageSrc.and.returnValue('assets/tiles/Wall.png');
        component.handleMouseDown({ button: 0 } as MouseEvent, 0, 0);
        expect(component.isleftMouseDown).toBeTrue();
        expect(mockGridService.replaceImageOnTile).toHaveBeenCalledWith(0, 0, 'assets/tiles/Wall.png');
    });

    it('should handle right-click drag to delete tile on mouse move', () => {
        // Set up initial conditions
        component.isRightMouseDown = true;
        component.gridTiles = [[{ images: ['tile1'], isOccuped: true }]];
        mockGridService.getObjectOnTile.and.returnValue(''); // Simulate no object on tile

        // Trigger mouse down event with right-click
        component.handleMouseDown({ button: 2 } as MouseEvent, 0, 0);

        // Trigger mouse move to apply the unoccupying action
        component.handleMouseMove(0, 0);

        // Expect `setCellToUnoccupied` to be called with the specified coordinates
        expect(mockGridService.setCellToUnoccupied).toHaveBeenCalledWith(0, 0);
    });

    it('should handle mouse up and reset mouse down flags', () => {
        component.isleftMouseDown = true;
        component.isRightMouseDown = true;
        component.handleMouseUp({ button: 0 } as MouseEvent);
        expect(component.isleftMouseDown).toBeFalse();
        component.handleMouseUp({ button: 2 } as MouseEvent);
        expect(component.isRightMouseDown).toBeFalse();
    });

    it('should handle mouse move to apply a tile when left mouse button is down', () => {
        component.isleftMouseDown = true;
        component.activeTile = 'wall';
        mockTileService.getTileImageSrc.and.returnValue('assets/tiles/Wall.png');
        component.gridTiles = [[{ images: ['Grass'], isOccuped: false }]];

        component.handleMouseMove(0, 0);

        expect(mockGridService.replaceImageOnTile).toHaveBeenCalledWith(0, 0, 'assets/tiles/Wall.png');
    });

    it('should move object in grid on drop', () => {
        const mockEvent = {
            event: { target: document.createElement('div') },
            item: { data: { image: 'object', row: 0, col: 0 } },
            container: { data: { row: 1, col: 1 } },
        } as unknown as CdkDragDrop<{ image: string; row: number; col: number }>;
        component.moveObjectInGrid(mockEvent);
        expect(mockDragDropService.dropObjectBetweenCase).toHaveBeenCalledWith(mockEvent, mockEvent.event.target as Element);
    });

    it('should return connected drop lists', () => {
        component.gridTiles = [[{ images: [], isOccuped: false }], [{ images: [], isOccuped: false }]];
        const connectedDropLists = component.getConnectedDropLists();
        expect(connectedDropLists).toEqual(['cdk-drop-list-0-0', 'cdk-drop-list-1-0']);
    });
    it('should find and return the correct object in objectsList', () => {
        component.objectsList = [{ link: 'object1' }, { link: 'object2', count: 1 }];
        const result = component.findObject('object2');
        expect(result).toEqual({ link: 'object2', count: 1 });
    });

    it('should return an empty object if the object is not found in objectsList', () => {
        component.objectsList = [{ link: 'object1' }];
        const result = component.findObject('object2');
        expect(result).toEqual({ link: '' });
    });
    it('should increment count and set isDragAndDrop to false for removedObject if count is defined', () => {
        const removedObject = { link: 'object', count: 2, isDragAndDrop: true };
        component.updateObjectState(removedObject);
        expect(removedObject.count).toBe(3);
        expect(removedObject.isDragAndDrop).toBeFalse();
    });

    it('should set isDragAndDrop to false for removedObject even if count is undefined', () => {
        const removedObject = { link: 'object', isDragAndDrop: true };
        component.updateObjectState(removedObject);
        expect(removedObject.isDragAndDrop).toBeFalse();
    });
    it('should return early if activeTile is empty', () => {
        component.activeTile = '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).applyTile(0, 0);
        expect(mockGridService.getTileType).not.toHaveBeenCalled();
    });

    it('should call reverseDoorState if currentTile contains Door', () => {
        component.activeTile = 'wall';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn(component as any, 'reverseDoorState');
        mockGridService.getTileType.and.returnValue('Door');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).applyTile(0, 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((component as any).reverseDoorState).toHaveBeenCalledWith(0, 0);
    });

    it('should call updateTile if currentTile does not match activeTile', () => {
        component.activeTile = 'wall';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn(component as any, 'updateTile');
        mockGridService.getTileType.and.returnValue('floor');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).applyTile(0, 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((component as any).updateTile).toHaveBeenCalledWith(0, 0);
    });
    it('should replace image on tile with DEFAULT_TILES if tile has no object', () => {
        mockGridService.getObjectOnTile.and.returnValue('');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).deleteTile(0, 0);

        expect(mockGridService.replaceImageOnTile).toHaveBeenCalledWith(0, 0, DEFAULT_TILES);
    });

    it('should remove object from tile and update object state if tile has an object', () => {
        mockGridService.getObjectOnTile.and.returnValue('object1');
        mockGridService.removeObjectFromTile.and.returnValue('object1');
        spyOn(component, 'updateObjectState');
        component.objectsList = [{ link: 'object1', count: 1 }];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).deleteTile(0, 0);

        expect(mockGridService.removeObjectFromTile).toHaveBeenCalledWith(0, 0);
        expect(component.updateObjectState).toHaveBeenCalledWith({ link: 'object1', count: 1 });
    });
    it('should update tile image and set tile to cell', () => {
        component.activeTile = 'wall';
        mockTileService.getTileImageSrc.and.returnValue('assets/wall.png');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).updateTile(0, 0);

        expect(mockGridService.replaceImageOnTile).toHaveBeenCalledWith(0, 0, 'assets/wall.png');
        expect(mockGridService.setTileToCell).toHaveBeenCalledWith(0, 0, 'assets/wall.png');
    });

    it('should set cell to unoccupied and update object state if tile is occupied', () => {
        component.gridTiles = [[{ images: ['tile'], isOccuped: true }]];
        component.currentObject = 'object';
        component.objectsList = [{ link: 'object', count: 1 }];
        spyOn(component, 'updateObjectState');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).updateTile(0, 0);

        expect(mockGridService.setCellToUnoccupied).toHaveBeenCalledWith(0, 0);
        expect(component.updateObjectState).toHaveBeenCalledWith({ link: 'object', count: 1 });
    });
    describe('reverseDoorState', () => {
        it('should replace door image with doorOpen when current tile is door', () => {
            mockGridService.getTileType.and.returnValue('assets/tiles/door.png');
            mockTileService.getTileImageSrc.withArgs('door').and.returnValue('assets/tiles/door.png');
            mockTileService.getTileImageSrc.withArgs('doorOpen').and.returnValue('assets/tiles/doorOpen.png');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (component as any).reverseDoorState(0, 0);
            expect(mockGridService.replaceImageOnTile).toHaveBeenCalledWith(0, 0, 'assets/tiles/doorOpen.png');
        });

        it('should replace doorOpen image with door when current tile is doorOpen', () => {
            mockGridService.getTileType.and.returnValue('assets/tiles/doorOpen.png');
            mockTileService.getTileImageSrc.withArgs('door').and.returnValue('assets/tiles/door.png');
            mockTileService.getTileImageSrc.withArgs('doorOpen').and.returnValue('assets/tiles/doorOpen.png');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (component as any).reverseDoorState(0, 0);
            expect(mockGridService.replaceImageOnTile).toHaveBeenCalledWith(0, 0, 'assets/tiles/door.png');
        });

        it('should not replace image when current tile is neither door nor doorOpen', () => {
            mockGridService.getTileType.and.returnValue('assets/tiles/wall.png');
            mockTileService.getTileImageSrc.withArgs('door').and.returnValue('assets/tiles/door.png');
            mockTileService.getTileImageSrc.withArgs('doorOpen').and.returnValue('assets/tiles/doorOpen.png');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (component as any).reverseDoorState(0, 0);
            expect(mockGridService.replaceImageOnTile).not.toHaveBeenCalled();
        });
    });
});
