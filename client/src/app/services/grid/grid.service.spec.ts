import { TestBed } from '@angular/core/testing';
import { GridService } from './grid.service';

describe('GridService', () => {
    let service: GridService;
    const GRID_SIZE = 10;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GridService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should generate a default grid with the correct size and image ', () => {
        service.generateDefaultGrid(GRID_SIZE);

        const grid = service.gridTiles;
        expect(grid.length).toBe(GRID_SIZE);
    });

    it('should replace image on a specific tile only if the tile exists', () => {
        const newImage = 'new_image.png';
        service.generateDefaultGrid(GRID_SIZE);
        service.replaceImageOnTile(1, 1, newImage);
        const grid = service.gridTiles;
        expect(grid[1][1].images[0]).toBe(newImage);
        service.replaceImageOnTile(GRID_SIZE, GRID_SIZE, newImage);
        expect(grid[1][1].images[0]).toBe(newImage);
    });

    it('should replace with the default image only if the tile exists', () => {
        const defaultImage = 'default.png';
        const newImage = 'new_image.png';
        service.generateDefaultGrid(GRID_SIZE);
        service.addObjectToTile(1, 1, newImage);
        service.replaceImageOnTile(1, 1, defaultImage);
        const grid = service.gridTiles;
        expect(grid[1][1].images[0]).toBe(defaultImage);
        service.replaceImageOnTile(GRID_SIZE, GRID_SIZE, defaultImage);
        expect(grid[1][1].images[0]).toBe(defaultImage);
    });

    it('should set the grid and notify subscribers', () => {
        const newGrid = [[{ images: ['image1.png'], isOccuped: false }], [{ images: ['image2.png'], isOccuped: true }]];

        let emittedGrid: { images: string[]; isOccuped: boolean }[][] | undefined;
        service.gridTiles$.subscribe((grid) => {
            emittedGrid = grid;
        });

        service.setGrid(newGrid);

        expect(service.gridTiles).toEqual(newGrid);
        expect(emittedGrid).toEqual(newGrid);
    });
    it('should add object to tile when tile exists', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = 1;
        const y = 1;
        const imageLink = 'object.png';

        service.addObjectToTile(x, y, imageLink);

        expect(service.gridTiles[y][x].images).toContain(imageLink);
        expect(service.gridTiles[y][x].isOccuped).toBeTrue();
    });
    it('should not add object to tile when tile does not exist', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = GRID_SIZE; 
        const y = GRID_SIZE; 
        const imageLink = 'object.png';

        service.addObjectToTile(x, y, imageLink);

     
        expect(service.gridTiles.length).toBe(GRID_SIZE);
        expect(service.gridTiles[0].length).toBe(GRID_SIZE);

  
        let found = false;
        for (const row of service.gridTiles) {
            for (const tile of row) {
                if (tile.images.includes(imageLink)) {
                    found = true;
                    break;
                }
            }
        }
        expect(found).toBeFalse();
    });
    describe('getGridTiles', () => {
        it('should return the current grid tiles after generating default grid', () => {
            service.generateDefaultGrid(GRID_SIZE);

            const gridTiles = service.getGridTiles();

            expect(gridTiles).toEqual(service.gridTiles);
            expect(gridTiles.length).toBe(GRID_SIZE);
        });

        it('should return the updated grid tiles after modifying the grid', () => {
            service.generateDefaultGrid(GRID_SIZE);
            const x = 1;
            const y = 1;
            const newImage = 'new_image.png';
            service.replaceImageOnTile(y, x, newImage);

            const gridTiles = service.getGridTiles();

            expect(gridTiles[y][x].images[0]).toBe(newImage);
        });

        it('should return an empty array when grid is not initialized', () => {
            const gridTiles = service.getGridTiles();

            expect(gridTiles).toEqual([]);
            expect(gridTiles.length).toBe(0);
        });

        it('should return the grid tiles after setting a new grid', () => {
            const newGrid = [[{ images: ['image1.png'], isOccuped: false }], [{ images: ['image2.png'], isOccuped: true }]];
            service.setGrid(newGrid);

            const gridTiles = service.getGridTiles();

            expect(gridTiles).toEqual(newGrid);
        });
    });

    it('should reset the grid to the default state', () => {
       
        const initialGrid = Array.from({ length: GRID_SIZE }, () =>
            Array.from({ length: GRID_SIZE }, () => ({ images: ['initial_image.png'], isOccuped: true })),
        );

        service.setGrid(initialGrid);

       
        service.resetDefaultGrid();

      
        const resetGrid = service.gridTiles;
        resetGrid.forEach((row) => {
            row.forEach((tile) => {
                expect(tile.images).toEqual([service.defaultImage]);
                expect(tile.isOccuped).toBeFalse();
            });
        });
    });
    it('should return the correct tile type for valid indices', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = 1;
        const y = 1;
        const expectedTile = service.defaultImage;

        const tileType = service.getTileType(y, x);

        expect(tileType).toBe(expectedTile);
    });
    it('should throw an error when accessing invalid indices in getTileType', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = GRID_SIZE; 
        const y = GRID_SIZE; 

        expect(() => service.getTileType(y, x)).toThrowError();
    });
    it('should return the object on tile when it exists', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = 1;
        const y = 1;
        const objectImage = 'object.png';

        service.addObjectToTile(x, y, objectImage);

        const objectOnTile = service.getObjectOnTile(y, x);

        expect(objectOnTile).toBe(objectImage);
    });
    it('should return empty string when there is no object on tile', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = 1;
        const y = 1;

        const objectOnTile = service.getObjectOnTile(y, x);

        expect(objectOnTile).toBe('');
    });
    it('should throw an error when accessing invalid indices in getObjectOnTile', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = GRID_SIZE; 
        const y = GRID_SIZE; 

        expect(() => service.getObjectOnTile(y, x)).toThrowError();
    });
    it('should set cell to unoccupied', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = 1;
        const y = 1;
        service.setCellToOccupied(y, x); 

        service.setCellToUnoccupied(y, x);

        expect(service.gridTiles[y][x].isOccuped).toBeFalse();
    });
    it('should throw an error when setting cell to occupied with invalid indices', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = GRID_SIZE;
        const y = GRID_SIZE;

        expect(() => service.setCellToOccupied(y, x)).toThrowError();
    });
    it('should throw an error when setting cell to unoccupied with invalid indices', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = GRID_SIZE; 
        const y = GRID_SIZE; 

        expect(() => service.setCellToUnoccupied(y, x)).toThrowError();
    });
    it('should remove object from tile and return it', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = 1;
        const y = 1;
        const objectImage = 'object.png';
        service.addObjectToTile(x, y, objectImage);

        const removedObject = service.removeObjectFromTile(y, x);

        expect(removedObject).toBe(objectImage);
        expect(service.gridTiles[y][x].images).not.toContain(objectImage);
        expect(service.gridTiles[y][x].images.length).toBe(1);
    });
    it('should remove default image when removing from tile with only default image', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = 1;
        const y = 1;

        const removedObject = service.removeObjectFromTile(y, x);

        expect(removedObject).toBe(service.defaultImage);
        expect(service.gridTiles[y][x].images.length).toBe(0); 
    it('should throw an error when removing object from tile with invalid indices', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = GRID_SIZE; 
        const y = GRID_SIZE; 

        expect(() => service.removeObjectFromTile(y, x)).toThrowError();
    });
    it('should set tile to cell with a new tile image', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = 1;
        const y = 1;
        const newTileImage = 'new_tile.png';

        service.setTileToCell(y, x, newTileImage);

        expect(service.gridTiles[y][x].images).toEqual([newTileImage]);
    });
    it('should throw an error when setting tile to cell with invalid indices', () => {
        service.generateDefaultGrid(GRID_SIZE);
        const x = GRID_SIZE; 
        const y = GRID_SIZE; 
        const newTileImage = 'new_tile.png';

        expect(() => service.setTileToCell(y, x, newTileImage)).toThrowError();
    });
});
