// drag-drop.service.spec.ts

import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TestBed } from '@angular/core/testing';
import { GridService } from '@app/services/grid/grid.service';
import { TileService } from '@app/services/tile/tile.service';
import { OBJECTS_LIST } from 'src/constants/objects-constants';
import { DragDropService } from './drag-and-drop.service';

class MockGridService {
    gridTiles = [[{ isOccuped: false, images: [''] }], [{ isOccuped: false, images: [''] }]];
    addObjectToTile = jasmine.createSpy('addObjectToTile');
}

class MockTileService {
    removeObjectFromTile = jasmine.createSpy('removeObjectFromTile');
    addObjectToTile = jasmine.createSpy('addObjectToTile');
}

describe('DragDropService', () => {
    let service: DragDropService;
    let gridService: MockGridService;
    let tileService: MockTileService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [DragDropService, { provide: GridService, useClass: MockGridService }, { provide: TileService, useClass: MockTileService }],
        });

        service = TestBed.inject(DragDropService);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gridService = TestBed.inject(GridService) as any as MockGridService;
        tileService = TestBed.inject(TileService) as any as MockTileService;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize startedPointsIndexInList and randomItemsIndexInList correctly', () => {
        const randomItemsIndex = OBJECTS_LIST.findIndex((obj) => obj.name === 'Random Items');
        const startedPointsIndex = OBJECTS_LIST.findIndex((obj) => obj.name === 'Started Points');

        expect(service['randomItemsIndexInList']).toBe(randomItemsIndex);
        expect(service['startedPointsIndexInList']).toBe(startedPointsIndex);
    });

    it('should update objectsListSubject when updateObjectList is called', () => {
        const newList = [{ name: 'Test Object', count: 1, isDragAndDrop: false }];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let updatedList: any[] = [];

        service.objectsList$.subscribe((list) => {
            updatedList = list;
        });

        service.updateObjectList(newList);

        expect(updatedList).toEqual(newList);
    });

    describe('drop method', () => {
        it('should add object to grid when drop is valid', () => {
            spyOn(service, 'isDropZoneValid').and.returnValue(true);
            const event = {
                event: { target: document.createElement('div') },
                item: { data: 'objectData' },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any as CdkDragDrop<any[]>;
            const index = 0;

            service.drop(event, index);

            expect(gridService.addObjectToTile).toHaveBeenCalled();
            expect(service.objectsList[index].isDragAndDrop).toBeTrue();
        });

        it('should not add object to grid when drop is invalid', () => {
            spyOn(service, 'isDropZoneValid').and.returnValue(false);
            const event = {
                event: { target: document.createElement('div') },
                item: { data: 'objectData' },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any as CdkDragDrop<any[]>;
            const index = 0;

            service.drop(event, index);

            expect(gridService.addObjectToTile).not.toHaveBeenCalled();
        });
    });

    describe('dropObjectBetweenCase method', () => {
        it('should move object between tiles when drop is valid', () => {
            spyOn(service, 'isDropZoneValid').and.returnValue(true);
            const event = {
                event: { target: document.createElement('div') },
                item: {
                    data: { image: 'objectImage', row: 0, col: 0 },
                },
                container: { data: { row: 1, col: 1 } },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any as CdkDragDrop<{ image: string; row: number; col: number }>;
            const element = document.createElement('div');

            service.dropObjectBetweenCase(event, element);

            expect(tileService.removeObjectFromTile).toHaveBeenCalledWith(0, 0, 'objectImage');
            expect(tileService.addObjectToTile).toHaveBeenCalledWith(1, 1, 'objectImage');
        });

        it('should not move object when drop is invalid', () => {
            spyOn(service, 'isDropZoneValid').and.returnValue(false);
            const event = {
                event: { target: document.createElement('div') },
                item: {
                    data: { image: 'objectImage', row: 0, col: 0 },
                },
                container: { data: { row: 1, col: 1 } },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any as CdkDragDrop<{ image: string; row: number; col: number }>;
            const element = document.createElement('div');

            service.dropObjectBetweenCase(event, element);

            expect(tileService.removeObjectFromTile).not.toHaveBeenCalled();
            expect(tileService.addObjectToTile).not.toHaveBeenCalled();
        });
    });

    describe('isDropZoneValid method', () => {
        it('should return true for valid drop zone', () => {
            const element = document.createElement('div');
            element.classList.add('drop-zone');
            element.id = '0,0';
            gridService.gridTiles = [[{ isOccuped: false, images: [''] }], [{ isOccuped: false, images: [''] }]];

            const result = service.isDropZoneValid(element);

            expect(result).toBeTrue();
        });

        it('should return false for invalid drop zone', () => {
            const element = document.createElement('div');
            element.classList.add('invalid-zone');

            const result = service.isDropZoneValid(element);

            expect(result).toBeFalse();
        });
    });

    describe('incrementObjectCounter method', () => {
        it('should increment object count and set isDragAndDrop to false', () => {
            const objectToMove = service.objectsList[0].link;
            service.objectsList[0].count = 1;
            service.objectsList[0].isDragAndDrop = true;

            service.incrementObjectCounter(objectToMove);

            expect(service.objectsList[0].count).toBe(2);
            expect(service.objectsList[0].isDragAndDrop).toBeFalse();
        });
    });
    it('should remove object and increment counter when element has class drop-zone2 in dropObjectBetweenCase', () => {
        spyOn(service, 'isDropZoneValid').and.returnValue(true);
        spyOn(service, 'incrementObjectCounter');

        const objectToMove = { isDragAndDrop: false };
        const event = {
            event: { target: document.createElement('div') },
            item: {
                data: { image: 'objectImage', row: 0, col: 0, ...objectToMove },
            },
            container: { data: { row: 1, col: 1 } },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any as CdkDragDrop<{ image: string; row: number; col: number }>;
        const element = document.createElement('div');
        element.classList.add('drop-zone2');

        service.dropObjectBetweenCase(event, element);

        expect(tileService.removeObjectFromTile).toHaveBeenCalledWith(0, 0, 'objectImage');
        expect(tileService.addObjectToTile).toHaveBeenCalledWith(1, 1, 'objectImage');
        expect(tileService.removeObjectFromTile).toHaveBeenCalledWith(1, 1, 'objectImage');
        expect(service.incrementObjectCounter).toHaveBeenCalledWith('objectImage');
    });

    describe('decrementObjectCounter method', () => {
        it('should decrement object count and set isDragAndDrop to true when count reaches zero', () => {
            service.objectsList[0].count = 1;
            service.objectsList[0].isDragAndDrop = false;

            const result = service.decrementObjectCounter(0);

            expect(service.objectsList[0].count).toBe(0);
            expect(service.objectsList[0].isDragAndDrop).toBeTrue();
            expect(result).toBeTrue();
        });

        it('should not decrement count below zero', () => {
            service.objectsList[0].count = 0;

            const result = service.decrementObjectCounter(0);

            expect(service.objectsList[0].count).toBe(0);
            expect(result).toBeFalse();
        });
    });

    describe('isDoorOrWallTile method', () => {
        it('should return true if tile is a door or wall', () => {
            const element = document.createElement('div');
            element.classList.add('drop-zone');
            element.id = '0,0';
            gridService.gridTiles = [[{ isOccuped: false, images: ['assets/tiles/Door.png'] }]];

            const result = service.isDoorOrWallTile(element);

            expect(result).toBeTrue();
        });

        it('should return false if tile is not a door or wall', () => {
            const element = document.createElement('div');
            element.classList.add('drop-zone');
            element.id = '0,0';
            gridService.gridTiles = [[{ isOccuped: false, images: ['assets/tiles/Floor.png'] }]];

            const result = service.isDoorOrWallTile(element);

            expect(result).toBeFalse();
        });
    });

    it('should return false in isDropZoneValid when tile is occupied', () => {
        const element = document.createElement('div');
        element.classList.add('drop-zone');
        element.id = '0,0';
        gridService.gridTiles = [[{ isOccuped: true, images: [''] }]];

        const result = service.isDropZoneValid(element);

        expect(result).toBeFalse();
    });

    it('should return true in isDropZoneValid when element has class drop-zone2', () => {
        const element = document.createElement('div');
        element.classList.add('drop-zone2');

        const result = service.isDropZoneValid(element);

        expect(result).toBeTrue();
    });

    it('should decrement object count and return true when count > 1 in decrementObjectCounter', () => {
        service.objectsList[0].count = 3;

        const result = service.decrementObjectCounter(0);

        expect(service.objectsList[0].count).toBe(2);
        expect(result).toBeTrue();
    });

    // Test for lines 116-118
    it('should return false in isDoorOrWallTile when tile is not a door or wall', () => {
        const element = document.createElement('div');
        element.classList.add('drop-zone');
        element.id = '0,0';
        gridService.gridTiles = [[{ isOccuped: false, images: ['assets/tiles/Floor.png'] }]];

        const result = service.isDoorOrWallTile(element);

        expect(result).toBeFalse();
    });
});
